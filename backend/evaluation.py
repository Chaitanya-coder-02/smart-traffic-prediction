"""
evaluation.py
-------------
Evaluation utilities: metrics, congestion thresholds, and chart data generation.
"""

import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score


# ── Congestion Thresholds ──────────────────────────────────────────────────────
# Derived from exploratory analysis of the Metro I-94 dataset quartiles.
# These are ILLUSTRATIVE categories for this educational project.
# Actual road congestion also depends on lane count, incidents, vehicle mix, etc.

CONGESTION_THRESHOLDS = {
    "Low": (0, 2000),
    "Moderate": (2000, 4000),
    "High": (4000, 5500),
    "Very High": (5500, None),
}

CONGESTION_COLORS = {
    "Low": "#22c55e",       # green
    "Moderate": "#eab308",  # yellow
    "High": "#f97316",      # orange
    "Very High": "#ef4444", # red
}


def compute_metrics(y_true: np.ndarray, y_pred: np.ndarray, model_name: str) -> dict:
    """
    Compute regression metrics for a single model.
    Note: These are regression metrics (MAE, RMSE, R²), NOT classification accuracy.
    """
    mae = mean_absolute_error(y_true, y_pred)
    rmse = np.sqrt(mean_squared_error(y_true, y_pred))
    r2 = r2_score(y_true, y_pred)
    return {
        "model_name": model_name,
        "mae": round(float(mae), 2),
        "rmse": round(float(rmse), 2),
        "r2": round(float(r2), 4),
        "metric_note": (
            "MAE and RMSE are in vehicles/hour. R² measures proportion of variance explained. "
            "These are regression metrics — not classification accuracy."
        ),
    }


def get_congestion_level(predicted_volume: float) -> dict:
    """
    Map a predicted vehicle count to a congestion category.
    Returns category name, color, and an explanation of limitations.
    """
    volume = max(0.0, float(predicted_volume))   # clamp negatives
    category = "Low"
    for level, (low, high) in CONGESTION_THRESHOLDS.items():
        if volume >= low and (high is None or volume < high):
            category = level
            break
    return {
        "category": category,
        "color": CONGESTION_COLORS[category],
        "thresholds": CONGESTION_THRESHOLDS,
        "disclaimer": (
            "Congestion levels are illustrative estimates derived from predicted vehicle count. "
            "Actual congestion depends on road capacity, lane count, incidents, weather impact, "
            "and vehicle mix — factors not fully captured by this dataset."
        ),
    }


def build_actuals_vs_predicted(y_true, y_pred, n_samples: int = 500) -> list[dict]:
    """Return a sampled list of {actual, predicted} for charting."""
    y_true = np.array(y_true)
    y_pred = np.array(y_pred)
    step = max(1, len(y_true) // n_samples)
    return [
        {"index": int(i), "actual": round(float(y_true[i]), 1), "predicted": round(float(y_pred[i]), 1)}
        for i in range(0, len(y_true), step)
    ]


def build_hourly_summary(df: pd.DataFrame) -> list[dict]:
    """Compute average traffic volume by hour of day."""
    summary = (
        df.groupby("hour")["traffic_volume"]
        .agg(avg="mean", std="std", count="count")
        .reset_index()
    )
    return [
        {
            "hour": int(row["hour"]),
            "avg_volume": round(float(row["avg"]), 1),
            "std": round(float(row["std"]), 1) if not np.isnan(row["std"]) else 0,
            "count": int(row["count"]),
        }
        for _, row in summary.iterrows()
    ]


def build_weekly_summary(df: pd.DataFrame) -> list[dict]:
    """Compute average traffic volume by day of week."""
    day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    summary = (
        df.groupby("day_of_week")["traffic_volume"]
        .agg(avg="mean", std="std", count="count")
        .reset_index()
    )
    return [
        {
            "day_of_week": int(row["day_of_week"]),
            "day_name": day_names[int(row["day_of_week"])],
            "avg_volume": round(float(row["avg"]), 1),
            "std": round(float(row["std"]), 1) if not np.isnan(row["std"]) else 0,
            "count": int(row["count"]),
        }
        for _, row in summary.iterrows()
    ]


def build_volume_distribution(df: pd.DataFrame, bins: int = 20) -> list[dict]:
    """Build histogram data for traffic_volume distribution."""
    counts, edges = np.histogram(df["traffic_volume"], bins=bins)
    return [
        {
            "range_start": round(float(edges[i]), 1),
            "range_end": round(float(edges[i + 1]), 1),
            "count": int(counts[i]),
        }
        for i in range(len(counts))
    ]
