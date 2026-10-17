"""
model_service.py
----------------
Singleton service that loads the trained pipeline once at startup
and exposes a predict() method. Training is kept separate from serving.
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from preprocessing import build_input_from_request
from evaluation import get_congestion_level

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
MODEL_PATH = os.path.join(ROOT_DIR, "models", "best_pipeline.joblib")
REPORT_PATH = os.path.join(ROOT_DIR, "reports", "evaluation_report.json")


class ModelService:
    def __init__(self):
        self._pipeline = None
        self._report = None
        self._load()

    def _load(self):
        if os.path.exists(MODEL_PATH):
            try:
                self._pipeline = joblib.load(MODEL_PATH)
                print(f"[model_service] Pipeline loaded from {MODEL_PATH}")
            except Exception as exc:
                print(f"[model_service] WARNING: Could not load pipeline: {exc}")
        else:
            print(
                f"[model_service] WARNING: No trained model found at {MODEL_PATH}. "
                "Run 'python backend/train.py' first."
            )

        if os.path.exists(REPORT_PATH):
            try:
                with open(REPORT_PATH) as f:
                    self._report = json.load(f)
                print(f"[model_service] Evaluation report loaded.")
            except Exception as exc:
                print(f"[model_service] WARNING: Could not load report: {exc}")

    @property
    def is_ready(self) -> bool:
        return self._pipeline is not None

    def predict(self, request_data: dict) -> dict:
        """
        Accept raw API request dict, preprocess, predict, and return full result.
        """
        if not self.is_ready:
            raise RuntimeError(
                "Model not loaded. Please run 'python backend/train.py' first, "
                "then restart the Flask server."
            )

        # Build feature row
        X = build_input_from_request(request_data)

        # Run prediction
        raw_pred = self._pipeline.predict(X)[0]
        predicted_volume = float(max(0.0, raw_pred))   # clamp negatives to 0

        congestion = get_congestion_level(predicted_volume)
        model_name = self._get_model_name()

        return {
            "predicted_volume": round(predicted_volume, 1),
            "congestion_category": congestion["category"],
            "congestion_color": congestion["color"],
            "congestion_thresholds": congestion["thresholds"],
            "model_name": model_name,
            "input_echo": {
                "date_str": request_data.get("date_str"),
                "hour": request_data.get("hour"),
                "temp_celsius": request_data.get("temp"),
                "rain_1h": request_data.get("rain_1h"),
                "snow_1h": request_data.get("snow_1h"),
                "clouds_all": request_data.get("clouds_all"),
                "weather_main": request_data.get("weather_main"),
                "is_holiday": request_data.get("is_holiday"),
            },
            "prediction_note": (
                "This is an ML prediction from a model trained on I-94 Minnesota data. "
                "It is NOT a live traffic reading. Actual conditions may differ."
            ),
            "disclaimer": congestion["disclaimer"],
        }

    def _get_model_name(self) -> str:
        if self._report:
            return self._report.get("best_model", "Unknown")
        if self._pipeline:
            return type(self._pipeline.named_steps.get("model", object())).__name__
        return "Unknown"

    def get_report(self) -> dict | None:
        return self._report

    def get_metrics(self) -> dict:
        if not self._report:
            return {"error": "No evaluation report found. Run train.py first."}
        return {
            "best_model": self._report.get("best_model"),
            "best_model_metrics": self._report.get("best_model_metrics"),
            "all_model_metrics": self._report.get("all_model_metrics"),
            "evaluation_method": self._report.get("evaluation_method"),
            "feature_importance": self._report.get("feature_importance", []),
        }

    def get_dashboard_data(self) -> dict:
        if not self._report:
            return {"error": "No report. Run train.py first."}
        return {
            "dataset_stats": self._report.get("dataset_stats", {}),
            "best_model": self._report.get("best_model"),
            "best_model_metrics": self._report.get("best_model_metrics", {}),
            "all_model_metrics": self._report.get("all_model_metrics", []),
            "hourly_summary": self._report.get("hourly_summary", []),
            "weekly_summary": self._report.get("weekly_summary", []),
            "volume_distribution": self._report.get("volume_distribution", []),
            "model_ready": self.is_ready,
        }

    def get_hourly_analytics(self) -> list:
        if not self._report:
            return []
        return self._report.get("hourly_summary", [])

    def get_weekly_analytics(self) -> list:
        if not self._report:
            return []
        return self._report.get("weekly_summary", [])

    def get_feature_importance(self) -> list:
        if not self._report:
            return []
        return self._report.get("feature_importance", [])

    def get_actuals_vs_predicted(self) -> list:
        if not self._report:
            return []
        return self._report.get("actuals_vs_predicted", [])


# Module-level singleton — loaded once at import time
_service_instance: ModelService | None = None


def get_service() -> ModelService:
    global _service_instance
    if _service_instance is None:
        _service_instance = ModelService()
    return _service_instance
