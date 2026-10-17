"""
train.py
--------
Reproducible training script.

Usage (from project root, inside activated venv):
    python backend/train.py

This script:
  1. Loads and validates the dataset.
  2. Engineers features (chronological split — no data leakage).
  3. Trains Dummy, LinearRegression, and RandomForest models.
  4. Evaluates all three on the held-out test set.
  5. Selects the best model by test RMSE.
  6. Saves the full sklearn Pipeline (preprocessor + model) to models/.
  7. Saves evaluation report to reports/.
"""

import os
import sys
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.dummy import DummyRegressor
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.pipeline import Pipeline

# Allow running from project root or from backend/
sys.path.insert(0, os.path.dirname(__file__))

from data_loader import load_and_prepare, get_dataset_stats
from preprocessing import (
    build_preprocessor,
    prepare_features,
    NUMERIC_FEATURES,
    CATEGORICAL_FEATURES,
    TARGET,
    ALL_FEATURES,
)
from evaluation import compute_metrics, build_actuals_vs_predicted, build_hourly_summary, build_weekly_summary, build_volume_distribution

# ── Paths ──────────────────────────────────────────────────────────────────────
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
MODELS_DIR = os.path.join(ROOT_DIR, "models")
REPORTS_DIR = os.path.join(ROOT_DIR, "reports")
DATA_DIR = os.path.join(ROOT_DIR, "data")

os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(REPORTS_DIR, exist_ok=True)


def chronological_split(df: pd.DataFrame, test_fraction: float = 0.2):
    """
    Split DataFrame chronologically so older records train, newer ones test.
    This prevents temporal data leakage — never shuffle time-series data.
    """
    split_idx = int(len(df) * (1 - test_fraction))
    train = df.iloc[:split_idx].copy()
    test = df.iloc[split_idx:].copy()
    print(f"[train] Train: {len(train)} rows  |  Test: {len(test)} rows")
    return train, test


def train_and_evaluate():
    # ── 1. Load data ───────────────────────────────────────────────────────────
    df = load_and_prepare()
    stats = get_dataset_stats(df)
    print(f"[train] Dataset stats: {json.dumps(stats, indent=2)}")

    # ── 2. Chronological split ─────────────────────────────────────────────────
    train_df, test_df = chronological_split(df, test_fraction=0.2)

    X_train = prepare_features(train_df)
    y_train = train_df[TARGET].values

    X_test = prepare_features(test_df)
    y_test = test_df[TARGET].values

    # ── 3. Build preprocessor (fit only on train) ──────────────────────────────
    preprocessor = build_preprocessor()

    # ── 4. Define models ───────────────────────────────────────────────────────
    model_configs = [
        ("DummyRegressor", DummyRegressor(strategy="mean")),
        ("LinearRegression", LinearRegression()),
        (
            "RandomForest",
            RandomForestRegressor(
                n_estimators=150,
                max_depth=20,
                min_samples_leaf=5,
                n_jobs=-1,
                random_state=42,
            ),
        ),
    ]

    results = []
    pipelines = {}
    test_predictions = {}

    for name, model in model_configs:
        print(f"\n[train] Training {name}...")
        pipeline = Pipeline([
            ("preprocessor", preprocessor),
            ("model", model),
        ])
        # Clone the preprocessor for each pipeline so fits are independent
        from sklearn.base import clone
        pipeline = Pipeline([
            ("preprocessor", clone(preprocessor)),
            ("model", model),
        ])
        pipeline.fit(X_train, y_train)
        y_pred = pipeline.predict(X_test)
        # Clamp negatives to zero (documented decision)
        y_pred = np.clip(y_pred, 0, None)
        metrics = compute_metrics(y_test, y_pred, name)
        print(f"  MAE={metrics['mae']:.2f}  RMSE={metrics['rmse']:.2f}  R²={metrics['r2']:.4f}")
        results.append(metrics)
        pipelines[name] = pipeline
        test_predictions[name] = y_pred

    # ── 5. Select best model by RMSE ──────────────────────────────────────────
    best = min(results, key=lambda x: x["rmse"])
    best_name = best["model_name"]
    best_pipeline = pipelines[best_name]
    best_preds = test_predictions[best_name]

    print(f"\n[train] [OK] Best model: {best_name}  (RMSE={best['rmse']:.2f})")

    # ── 6. Feature importance ─────────────────────────────────────────────────
    feature_importance = []
    if best_name == "RandomForest":
        rf_model = best_pipeline.named_steps["model"]
        fitted_preprocessor = best_pipeline.named_steps["preprocessor"]
        # Build feature name list
        num_names = NUMERIC_FEATURES.copy()
        cat_names = []
        try:
            enc = fitted_preprocessor.named_transformers_["cat"].named_steps["encoder"]
            cat_names = [f"weather_{c}" for c in enc.categories_[0]]
        except Exception:
            pass
        feature_names = num_names + cat_names
        importances = rf_model.feature_importances_
        for fname, imp in sorted(zip(feature_names, importances), key=lambda x: -x[1]):
            feature_importance.append({"feature": fname, "importance": round(float(imp), 6)})
    elif best_name == "LinearRegression":
        lr_model = best_pipeline.named_steps["model"]
        fitted_preprocessor = best_pipeline.named_steps["preprocessor"]
        num_names = NUMERIC_FEATURES.copy()
        cat_names = []
        try:
            enc = fitted_preprocessor.named_transformers_["cat"].named_steps["encoder"]
            cat_names = [f"weather_{c}" for c in enc.categories_[0]]
        except Exception:
            pass
        feature_names = num_names + cat_names
        coefs = np.abs(lr_model.coef_)
        for fname, imp in sorted(zip(feature_names, coefs), key=lambda x: -x[1]):
            feature_importance.append({"feature": fname, "importance": round(float(imp), 6)})

    # ── 7. Save model ─────────────────────────────────────────────────────────
    model_path = os.path.join(MODELS_DIR, "best_pipeline.joblib")
    joblib.dump(best_pipeline, model_path)
    print(f"[train] Model saved -> {model_path}")

    # ── 8. Save analytics data ────────────────────────────────────────────────
    actuals_vs_predicted = build_actuals_vs_predicted(y_test, best_preds)
    hourly_summary = build_hourly_summary(df)
    weekly_summary = build_weekly_summary(df)
    volume_distribution = build_volume_distribution(df)

    report = {
        "best_model": best_name,
        "evaluation_method": (
            "Chronological train/test split (80/20). Preprocessing fit only on training data. "
            "Metrics computed on held-out test set. No data leakage."
        ),
        "all_model_metrics": results,
        "best_model_metrics": best,
        "feature_importance": feature_importance,
        "actuals_vs_predicted": actuals_vs_predicted,
        "hourly_summary": hourly_summary,
        "weekly_summary": weekly_summary,
        "volume_distribution": volume_distribution,
        "dataset_stats": stats,
    }

    report_path = os.path.join(REPORTS_DIR, "evaluation_report.json")
    with open(report_path, "w") as f:
        json.dump(report, f, indent=2)
    print(f"[train] Evaluation report saved -> {report_path}")
    return report


if __name__ == "__main__":
    train_and_evaluate()
    print("\n[train] [OK] Training complete. Run the Flask API with: python backend/app.py")
