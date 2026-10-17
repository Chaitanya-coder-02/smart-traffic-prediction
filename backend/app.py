"""
app.py
------
Flask REST API for the Smart Traffic Prediction System.

Endpoints:
  GET  /api/health
  GET  /api/dashboard
  POST /api/predict
  GET  /api/analytics/hourly
  GET  /api/analytics/weekly
  GET  /api/model/metrics
  GET  /api/analytics/feature-importance
  GET  /api/analytics/actuals-vs-predicted
"""

import os
import sys
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Allow running from project root or backend/
sys.path.insert(0, os.path.dirname(__file__))

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

from model_service import get_service

app = Flask(__name__)

# CORS: allow requests from React dev server and production build
CORS(
    app,
    resources={r"/api/*": {"origins": os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")}},
)

service = get_service()


# ── Health ─────────────────────────────────────────────────────────────────────

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "model_ready": service.is_ready,
        "model_name": service._get_model_name() if service.is_ready else None,
        "message": (
            "Model loaded and ready."
            if service.is_ready
            else "Model not found — run 'python backend/train.py' first."
        ),
    })


# ── Dashboard ──────────────────────────────────────────────────────────────────

@app.route("/api/dashboard", methods=["GET"])
def dashboard():
    data = service.get_dashboard_data()
    return jsonify(data)


# ── Prediction ─────────────────────────────────────────────────────────────────

@app.route("/api/predict", methods=["POST"])
def predict():
    if not request.is_json:
        return jsonify({"error": "Request must have Content-Type: application/json"}), 415

    body = request.get_json(silent=True)
    if not body:
        return jsonify({"error": "Empty or invalid JSON body"}), 400

    # Basic required-field check
    required = ["date_str", "hour", "temp", "rain_1h", "snow_1h", "clouds_all", "weather_main"]
    missing = [k for k in required if k not in body]
    if missing:
        return jsonify({"error": f"Missing required fields: {missing}"}), 400

    try:
        result = service.predict(body)
        return jsonify(result), 200
    except RuntimeError as exc:
        return jsonify({"error": str(exc)}), 503
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 422
    except Exception as exc:
        # Never expose stack traces to clients
        app.logger.exception("Unexpected error in /api/predict")
        return jsonify({"error": "Internal server error. Check backend logs."}), 500


# ── Analytics ──────────────────────────────────────────────────────────────────

@app.route("/api/analytics/hourly", methods=["GET"])
def analytics_hourly():
    data = service.get_hourly_analytics()
    if not data:
        return jsonify({"error": "No analytics data. Run train.py first."}), 503
    return jsonify(data)


@app.route("/api/analytics/weekly", methods=["GET"])
def analytics_weekly():
    data = service.get_weekly_analytics()
    if not data:
        return jsonify({"error": "No analytics data. Run train.py first."}), 503
    return jsonify(data)


@app.route("/api/analytics/feature-importance", methods=["GET"])
def feature_importance():
    data = service.get_feature_importance()
    return jsonify(data)


@app.route("/api/analytics/actuals-vs-predicted", methods=["GET"])
def actuals_vs_predicted():
    data = service.get_actuals_vs_predicted()
    return jsonify(data)


# ── Model metrics ──────────────────────────────────────────────────────────────

@app.route("/api/model/metrics", methods=["GET"])
def model_metrics():
    return jsonify(service.get_metrics())


# ── Entry point ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("FLASK_DEBUG", "true").lower() == "true"
    print(f"[app] Starting Flask on port {port}  debug={debug}")
    app.run(host="0.0.0.0", port=port, debug=debug)
