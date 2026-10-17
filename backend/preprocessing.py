"""
preprocessing.py
----------------
Feature engineering and sklearn preprocessing pipeline for the traffic dataset.
Encoding is fit ONLY on training data to prevent data leakage.
"""

import numpy as np
import pandas as pd
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer

# ── Feature lists ──────────────────────────────────────────────────────────────

NUMERIC_FEATURES = ["temp", "rain_1h", "snow_1h", "clouds_all",
                     "hour", "day_of_week", "month", "is_weekend", "is_holiday"]

CATEGORICAL_FEATURES = ["weather_main"]   # keep to high-level category to limit dimensionality

TARGET = "traffic_volume"

# All features fed into the model
ALL_FEATURES = NUMERIC_FEATURES + CATEGORICAL_FEATURES


def build_preprocessor() -> ColumnTransformer:
    """
    Build a ColumnTransformer that:
      - Imputes and scales numeric features
      - Imputes and one-hot encodes categorical features
    Must be fit only on training data.
    """
    numeric_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler()),
    ])

    categorical_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("encoder", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
    ])

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", numeric_pipeline, NUMERIC_FEATURES),
            ("cat", categorical_pipeline, CATEGORICAL_FEATURES),
        ],
        remainder="drop",
    )
    return preprocessor


def prepare_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Select and return only the columns used as model features.
    Ensures all required columns exist, filling missing ones with defaults.
    """
    df = df.copy()
    for col in NUMERIC_FEATURES:
        if col not in df.columns:
            df[col] = 0
    for col in CATEGORICAL_FEATURES:
        if col not in df.columns:
            df[col] = "Unknown"
    return df[ALL_FEATURES]


def get_feature_names(preprocessor: ColumnTransformer) -> list[str]:
    """
    Return human-readable feature names after fitting the preprocessor.
    """
    num_names = NUMERIC_FEATURES.copy()
    cat_names = []
    try:
        encoder = preprocessor.named_transformers_["cat"].named_steps["encoder"]
        cats = encoder.categories_[0]
        cat_names = [f"weather_{c}" for c in cats]
    except Exception:
        pass
    return num_names + cat_names


def build_input_from_request(data: dict) -> pd.DataFrame:
    """
    Convert a raw API prediction request dict into a single-row DataFrame
    ready for preprocessing. Validates required keys and applies sensible defaults.

    Expected keys (all strings from JSON body):
        date_str   - ISO date string e.g. "2024-07-15"
        hour       - int 0-23
        temp       - float Kelvin (convert from °C: temp_celsius + 273.15)
        rain_1h    - float mm
        snow_1h    - float mm
        clouds_all - int 0-100
        weather_main - str category
        is_holiday - int 0 or 1
    """
    try:
        hour = int(data.get("hour", 12))
        assert 0 <= hour <= 23, "hour must be 0-23"

        temp_c = float(data.get("temp", 15.0))
        temp_k = temp_c + 273.15   # dataset stores temp in Kelvin

        rain_1h = float(data.get("rain_1h", 0.0))
        snow_1h = float(data.get("snow_1h", 0.0))
        clouds_all = int(data.get("clouds_all", 0))
        assert 0 <= clouds_all <= 100, "clouds_all must be 0-100"

        weather_main = str(data.get("weather_main", "Clear"))

        is_holiday = int(data.get("is_holiday", 0))
        assert is_holiday in (0, 1), "is_holiday must be 0 or 1"

        date_str = data.get("date_str", "2024-01-15")
        dt = pd.to_datetime(date_str, errors="coerce")
        if pd.isna(dt):
            dt = pd.Timestamp("2024-01-15")

        day_of_week = dt.dayofweek
        month = dt.month
        is_weekend = int(day_of_week >= 5)

    except (TypeError, ValueError, AssertionError) as exc:
        raise ValueError(f"Invalid input data: {exc}") from exc

    row = {
        "temp": temp_k,
        "rain_1h": rain_1h,
        "snow_1h": snow_1h,
        "clouds_all": clouds_all,
        "hour": hour,
        "day_of_week": day_of_week,
        "month": month,
        "is_weekend": is_weekend,
        "is_holiday": is_holiday,
        "weather_main": weather_main,
    }
    return pd.DataFrame([row])[ALL_FEATURES]
