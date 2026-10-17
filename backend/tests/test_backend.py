"""
Tests for the Smart Traffic Prediction backend.

Run from project root (with venv activated):
    pytest backend/tests/ -v
"""

import os
import sys
import json
import pytest
import numpy as np
import pandas as pd

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


# ── Data Loader Tests ──────────────────────────────────────────────────────────

class TestDataLoader:
    def test_missing_file_raises(self):
        from data_loader import load_raw_data
        with pytest.raises(FileNotFoundError) as exc_info:
            load_raw_data("/nonexistent/path/file.csv")
        assert "SETUP ERROR" in str(exc_info.value)
        assert "kaggle" in str(exc_info.value).lower()

    def test_validate_columns_passes(self):
        from data_loader import validate_columns
        df = pd.DataFrame(columns=[
            "holiday", "temp", "rain_1h", "snow_1h", "clouds_all",
            "weather_main", "weather_description", "date_time", "traffic_volume"
        ])
        validate_columns(df)  # should not raise

    def test_validate_columns_fails_on_missing(self):
        from data_loader import validate_columns
        df = pd.DataFrame(columns=["holiday", "temp"])
        with pytest.raises(ValueError) as exc_info:
            validate_columns(df)
        assert "Missing required columns" in str(exc_info.value)

    def test_parse_timestamps(self):
        from data_loader import parse_timestamps
        df = pd.DataFrame({"date_time": ["2016-01-01 00:00:00", "not-a-date", "2016-06-15 12:00:00"]})
        result = parse_timestamps(df)
        assert len(result) == 2
        assert pd.api.types.is_datetime64_any_dtype(result["date_time"])

    def test_engineer_features(self):
        from data_loader import engineer_features
        df = pd.DataFrame({
            "date_time": pd.to_datetime(["2016-01-01 08:00:00", "2016-01-02 17:00:00"]),
            "holiday": ["None", "None"],
        })
        result = engineer_features(df)
        assert "hour" in result.columns
        assert "day_of_week" in result.columns
        assert "month" in result.columns
        assert "is_weekend" in result.columns
        assert "is_holiday" in result.columns
        assert result["hour"].tolist() == [8, 17]

    def test_is_weekend_flag(self):
        from data_loader import engineer_features
        # 2016-01-02 is Saturday (day_of_week=5)
        df = pd.DataFrame({
            "date_time": pd.to_datetime(["2016-01-02 12:00:00"]),
            "holiday": ["None"],
        })
        result = engineer_features(df)
        assert result["is_weekend"].iloc[0] == 1

    def test_clean_data_clamps_negatives(self):
        from data_loader import clean_data
        df = pd.DataFrame({
            "traffic_volume": [-100.0, 0.0, 500.0],
            "holiday": ["None", "None", "None"],
            "temp": [280.0, 285.0, 290.0],
            "rain_1h": [0.0, 0.0, 0.0],
            "snow_1h": [0.0, 0.0, 0.0],
            "clouds_all": [20, 30, 40],
            "weather_main": ["Clear", "Clear", "Clouds"],
            "weather_description": ["clear sky", "clear sky", "few clouds"],
        })
        result = clean_data(df)
        assert (result["traffic_volume"] >= 0).all()

    def test_clean_data_removes_duplicates(self):
        from data_loader import clean_data
        df = pd.DataFrame({
            "traffic_volume": [100.0, 100.0, 200.0],
            "holiday": ["None", "None", "None"],
            "temp": [280.0, 280.0, 285.0],
            "rain_1h": [0.0, 0.0, 0.0],
            "snow_1h": [0.0, 0.0, 0.0],
            "clouds_all": [20, 20, 30],
            "weather_main": ["Clear", "Clear", "Clouds"],
            "weather_description": ["clear sky", "clear sky", "few clouds"],
        })
        result = clean_data(df)
        assert len(result) == 2


# ── Preprocessing Tests ────────────────────────────────────────────────────────

class TestPreprocessing:
    def test_build_input_from_request_valid(self):
        from preprocessing import build_input_from_request
        data = {
            "date_str": "2024-07-15",
            "hour": 8,
            "temp": 20.0,
            "rain_1h": 0.0,
            "snow_1h": 0.0,
            "clouds_all": 30,
            "weather_main": "Clear",
            "is_holiday": 0,
        }
        df = build_input_from_request(data)
        assert len(df) == 1
        assert "hour" in df.columns
        assert "temp" in df.columns
        # temp should be converted to Kelvin
        assert df["temp"].iloc[0] == pytest.approx(20.0 + 273.15)

    def test_build_input_from_request_invalid_hour(self):
        from preprocessing import build_input_from_request
        with pytest.raises(ValueError):
            build_input_from_request({"hour": 25, "date_str": "2024-01-01",
                                       "temp": 20, "rain_1h": 0, "snow_1h": 0,
                                       "clouds_all": 0, "weather_main": "Clear"})

    def test_build_input_from_request_defaults(self):
        from preprocessing import build_input_from_request
        # Minimal input — should fill defaults
        df = build_input_from_request({"date_str": "2024-01-01", "hour": 12,
                                        "temp": 15, "rain_1h": 0, "snow_1h": 0,
                                        "clouds_all": 0, "weather_main": "Clear"})
        assert df["is_weekend"].iloc[0] in (0, 1)

    def test_build_preprocessor_fits(self):
        from preprocessing import build_preprocessor, ALL_FEATURES, NUMERIC_FEATURES, CATEGORICAL_FEATURES
        preprocessor = build_preprocessor()
        df = pd.DataFrame({
            "temp": [280.0, 290.0, 285.0],
            "rain_1h": [0.0, 1.0, 0.5],
            "snow_1h": [0.0, 0.0, 0.1],
            "clouds_all": [20, 80, 50],
            "hour": [8, 17, 12],
            "day_of_week": [0, 4, 2],
            "month": [1, 6, 3],
            "is_weekend": [0, 0, 0],
            "is_holiday": [0, 0, 1],
            "weather_main": ["Clear", "Rain", "Clouds"],
        })
        X = preprocessor.fit_transform(df[ALL_FEATURES])
        assert X.shape[0] == 3


# ── Evaluation Tests ───────────────────────────────────────────────────────────

class TestEvaluation:
    def test_compute_metrics(self):
        from evaluation import compute_metrics
        y_true = np.array([1000, 2000, 3000, 4000])
        y_pred = np.array([1100, 1900, 3100, 3900])
        m = compute_metrics(y_true, y_pred, "TestModel")
        assert m["model_name"] == "TestModel"
        assert m["mae"] > 0
        assert m["rmse"] > 0
        assert 0 <= m["r2"] <= 1
        assert "regression" in m["metric_note"].lower()

    def test_congestion_levels(self):
        from evaluation import get_congestion_level
        assert get_congestion_level(500)["category"] == "Low"
        assert get_congestion_level(2500)["category"] == "Moderate"
        assert get_congestion_level(4500)["category"] == "High"
        assert get_congestion_level(6000)["category"] == "Very High"

    def test_congestion_clamps_negative(self):
        from evaluation import get_congestion_level
        result = get_congestion_level(-100)
        assert result["category"] == "Low"

    def test_build_hourly_summary(self):
        from evaluation import build_hourly_summary
        df = pd.DataFrame({
            "hour": [8, 8, 17, 17],
            "traffic_volume": [1000, 1200, 3000, 3200],
        })
        result = build_hourly_summary(df)
        assert len(result) == 2
        hours = [r["hour"] for r in result]
        assert 8 in hours and 17 in hours


# ── API Tests ──────────────────────────────────────────────────────────────────

@pytest.fixture
def client():
    """Flask test client."""
    import app as flask_app
    flask_app.app.config["TESTING"] = True
    with flask_app.app.test_client() as c:
        yield c


class TestAPI:
    def test_health_endpoint(self, client):
        resp = client.get("/api/health")
        assert resp.status_code == 200
        data = resp.get_json()
        assert "status" in data
        assert data["status"] == "ok"
        assert "model_ready" in data

    def test_dashboard_endpoint(self, client):
        resp = client.get("/api/dashboard")
        assert resp.status_code == 200
        data = resp.get_json()
        assert isinstance(data, dict)

    def test_predict_missing_fields(self, client):
        resp = client.post(
            "/api/predict",
            json={"hour": 8},  # missing many required fields
            content_type="application/json",
        )
        assert resp.status_code == 400
        data = resp.get_json()
        assert "error" in data

    def test_predict_wrong_content_type(self, client):
        resp = client.post("/api/predict", data="not json")
        assert resp.status_code == 415

    def test_predict_with_model_if_ready(self, client):
        """If the model is loaded, a valid request should return a prediction."""
        from model_service import get_service
        svc = get_service()
        if not svc.is_ready:
            pytest.skip("Model not trained yet — run train.py first.")
        resp = client.post(
            "/api/predict",
            json={
                "date_str": "2024-07-15",
                "hour": 8,
                "temp": 22.0,
                "rain_1h": 0.0,
                "snow_1h": 0.0,
                "clouds_all": 20,
                "weather_main": "Clear",
                "is_holiday": 0,
            },
            content_type="application/json",
        )
        assert resp.status_code == 200
        raw_text = resp.get_data(as_text=True)
        assert "Infinity" not in raw_text
        assert "NaN" not in raw_text
        data = resp.get_json()
        assert "predicted_volume" in data
        assert data["predicted_volume"] >= 0
        assert "congestion_category" in data
        assert data["congestion_category"] in ["Low", "Moderate", "High", "Very High"]

    def test_hourly_analytics(self, client):
        resp = client.get("/api/analytics/hourly")
        # Either data or a 503 if not trained
        assert resp.status_code in (200, 503)

    def test_weekly_analytics(self, client):
        resp = client.get("/api/analytics/weekly")
        assert resp.status_code in (200, 503)

    def test_model_metrics(self, client):
        resp = client.get("/api/model/metrics")
        assert resp.status_code == 200
        data = resp.get_json()
        assert isinstance(data, dict)
