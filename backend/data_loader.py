"""
data_loader.py
--------------
Loads and validates the Metro Interstate Traffic Volume dataset.
Expected CSV path: data/Metro_Interstate_Traffic_Volume.csv
"""

import os
import sys
import pandas as pd
import numpy as np

REQUIRED_COLUMNS = [
    "holiday",
    "temp",
    "rain_1h",
    "snow_1h",
    "clouds_all",
    "weather_main",
    "weather_description",
    "date_time",
    "traffic_volume",
]

DEFAULT_CSV_PATH = os.path.join(
    os.path.dirname(__file__), "..", "data", "Metro_Interstate_Traffic_Volume.csv"
)


def load_raw_data(csv_path: str = DEFAULT_CSV_PATH) -> pd.DataFrame:
    """
    Load the raw dataset from disk.
    Raises FileNotFoundError with setup instructions when the file is missing.
    """
    csv_path = os.path.abspath(csv_path)
    if not os.path.exists(csv_path):
        raise FileNotFoundError(
            f"\n\n[SETUP ERROR] Dataset not found at:\n  {csv_path}\n\n"
            "Please download the Metro Interstate Traffic Volume dataset from:\n"
            "  https://www.kaggle.com/datasets/ramyahr/metro-interstate-traffic-volume\n\n"
            "After downloading, place the CSV file at:\n"
            "  smart-traffic-prediction/data/Metro_Interstate_Traffic_Volume.csv\n\n"
            "Then re-run: python train.py\n"
        )

    print(f"[data_loader] Loading dataset from: {csv_path}")
    df = pd.read_csv(csv_path)
    print(f"[data_loader] Raw shape: {df.shape}")
    return df


def validate_columns(df: pd.DataFrame) -> None:
    """Raise ValueError listing any missing required columns."""
    missing = [c for c in REQUIRED_COLUMNS if c not in df.columns]
    if missing:
        raise ValueError(
            f"[data_loader] Missing required columns: {missing}\n"
            f"Found columns: {list(df.columns)}"
        )


def parse_timestamps(df: pd.DataFrame) -> pd.DataFrame:
    """Parse date_time column to datetime; drop unparseable rows."""
    df = df.copy()
    df["date_time"] = pd.to_datetime(df["date_time"], errors="coerce")
    bad = df["date_time"].isna().sum()
    if bad > 0:
        print(f"[data_loader] Dropped {bad} rows with unparseable timestamps.")
        df = df.dropna(subset=["date_time"])
    return df


def clean_data(df: pd.DataFrame) -> pd.DataFrame:
    """
    Remove duplicates, handle missing values, and sanitize numeric columns.
    """
    df = df.copy()

    # Remove exact duplicates
    before = len(df)
    df = df.drop_duplicates()
    print(f"[data_loader] Removed {before - len(df)} duplicate rows.")

    # Drop rows where traffic_volume is missing
    df = df.dropna(subset=["traffic_volume"])

    # Clamp traffic_volume to non-negative (document the decision)
    negative_count = (df["traffic_volume"] < 0).sum()
    if negative_count > 0:
        print(
            f"[data_loader] Clamped {negative_count} negative traffic_volume values to 0."
        )
        df["traffic_volume"] = df["traffic_volume"].clip(lower=0)

    # Fill numeric NaNs with column medians
    numeric_cols = ["temp", "rain_1h", "snow_1h", "clouds_all"]
    for col in numeric_cols:
        if col in df.columns:
            median_val = df[col].median()
            missing = df[col].isna().sum()
            if missing > 0:
                print(f"[data_loader] Filled {missing} NaN values in '{col}' with median={median_val:.2f}.")
            df[col] = df[col].fillna(median_val)

    # Fill categorical NaNs
    for col in ["weather_main", "weather_description"]:
        if col in df.columns:
            df[col] = df[col].fillna("Unknown")

    df["holiday"] = df["holiday"].fillna("None")

    return df


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Extract time-based features from the parsed date_time column.
    """
    df = df.copy()
    df["hour"] = df["date_time"].dt.hour
    df["day_of_week"] = df["date_time"].dt.dayofweek   # 0=Monday … 6=Sunday
    df["month"] = df["date_time"].dt.month
    df["day"] = df["date_time"].dt.day
    df["is_weekend"] = (df["day_of_week"] >= 5).astype(int)
    df["is_holiday"] = (df["holiday"] != "None").astype(int)
    return df


def load_and_prepare(csv_path: str = DEFAULT_CSV_PATH) -> pd.DataFrame:
    """
    Full pipeline: load → validate → parse → clean → engineer features.
    Returns a clean, feature-enriched DataFrame sorted chronologically.
    """
    df = load_raw_data(csv_path)
    validate_columns(df)
    df = parse_timestamps(df)
    df = clean_data(df)
    df = engineer_features(df)
    df = df.sort_values("date_time").reset_index(drop=True)
    print(f"[data_loader] Final dataset shape: {df.shape}")
    return df


def get_dataset_stats(df: pd.DataFrame) -> dict:
    """Return summary statistics about the loaded dataset."""
    return {
        "total_records": int(len(df)),
        "date_range_start": str(df["date_time"].min().date()),
        "date_range_end": str(df["date_time"].max().date()),
        "avg_traffic_volume": round(float(df["traffic_volume"].mean()), 2),
        "max_traffic_volume": int(df["traffic_volume"].max()),
        "min_traffic_volume": int(df["traffic_volume"].min()),
        "std_traffic_volume": round(float(df["traffic_volume"].std()), 2),
        "unique_weather_categories": sorted(df["weather_main"].unique().tolist()),
        "holiday_records": int(df["is_holiday"].sum()),
        "weekend_records": int(df["is_weekend"].sum()),
        "geographic_note": (
            "This dataset represents a single section of Interstate 94 in Minnesota, USA. "
            "Predictions are specific to this road segment and should not be generalized "
            "to other locations without retraining on local data."
        ),
    }
