"""
Task Level Employee Burnout Risk Detection — Flask API
Loads the trained RandomForest model and uses SHAP to explain predictions.
"""

import os
import io
import numpy as np
import pandas as pd
import joblib
import shap
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import data_cleaner

# ── App Setup ────────────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")

app = Flask(__name__, static_folder=STATIC_DIR)
CORS(app)

# ── Load Model & Explainer Once ─────────────────────────────────────────────
print("Loading burnout model...")
model = joblib.load(os.path.join(BASE_DIR, "burnout_model.pkl"))

FEATURE_NAMES = [
    "Tasks_Assigned",
    "Tasks_Completed",
    "Context_Switches_Per_Day",
    "Avg_Uninterrupted_Work_Mins",
    "Standard_Hours_Logged",
    "After_Hours_Mins",
    "Missed_Deadlines",
]

FEATURE_LABELS = {
    "Tasks_Assigned": "Tasks Assigned",
    "Tasks_Completed": "Tasks Completed",
    "Context_Switches_Per_Day": "Context Switches / Day",
    "Avg_Uninterrupted_Work_Mins": "Avg Uninterrupted Work (min)",
    "Standard_Hours_Logged": "Standard Hours Logged",
    "After_Hours_Mins": "After-Hours Work (min)",
    "Missed_Deadlines": "Missed Deadlines",
}

print("Initializing SHAP explainer (this may take a moment)...")
explainer = shap.TreeExplainer(model)
print("Ready!\n")


# ── Helper Functions ─────────────────────────────────────────────────────────

def classify_risk(score: float) -> dict:
    """Return risk level, colour, and emoji for a 0-100 score."""
    if score <= 30:
        return {"level": "Low", "color": "#22c55e", "emoji": "✅"}
    elif score <= 55:
        return {"level": "Moderate", "color": "#eab308", "emoji": "⚠️"}
    elif score <= 75:
        return {"level": "High", "color": "#f97316", "emoji": "🔶"}
    else:
        return {"level": "Critical", "color": "#ef4444", "emoji": "🔴"}


def generate_recommendations(factors: list, score: float) -> list:
    """Return actionable recommendations based on top contributing factors."""
    recs = []
    factor_map = {f["feature"]: f for f in factors}

    if "After_Hours_Mins" in factor_map and factor_map["After_Hours_Mins"]["impact"] > 0:
        recs.append({
            "title": "Reduce After-Hours Work",
            "desc": "Excessive after-hours work is a major burnout driver. Consider enforcing work-hour boundaries and redistributing workload.",
            "icon": "🌙",
        })

    if "Context_Switches_Per_Day" in factor_map and factor_map["Context_Switches_Per_Day"]["impact"] > 0:
        recs.append({
            "title": "Minimize Context Switching",
            "desc": "Frequent context switching fragments attention and increases cognitive load. Try batching similar tasks and blocking focus time.",
            "icon": "🔄",
        })

    if "Missed_Deadlines" in factor_map and factor_map["Missed_Deadlines"]["impact"] > 0:
        recs.append({
            "title": "Address Missed Deadlines",
            "desc": "Missed deadlines increase stress and signal workload mismatch. Review task priorities and provide buffer time for complex work.",
            "icon": "📅",
        })

    if "Avg_Uninterrupted_Work_Mins" in factor_map and factor_map["Avg_Uninterrupted_Work_Mins"]["impact"] > 0:
        recs.append({
            "title": "Increase Deep Work Time",
            "desc": "Low uninterrupted work periods hurt productivity. Introduce 'No Meeting' blocks and minimize interruptions during focus hours.",
            "icon": "🎯",
        })

    if "Tasks_Assigned" in factor_map and factor_map["Tasks_Assigned"]["impact"] > 0:
        recs.append({
            "title": "Rebalance Task Load",
            "desc": "High task volume relative to capacity is causing strain. Consider delegating or deferring lower-priority items.",
            "icon": "📋",
        })

    if "Tasks_Completed" in factor_map and factor_map["Tasks_Completed"]["impact"] > 0:
        recs.append({
            "title": "Review Task Completion Gaps",
            "desc": "A wide gap between assigned and completed tasks suggests overload. Reassess task sizing and deadlines.",
            "icon": "✏️",
        })

    if "Standard_Hours_Logged" in factor_map and factor_map["Standard_Hours_Logged"]["impact"] > 0:
        recs.append({
            "title": "Monitor Working Hours",
            "desc": "Extended standard hours contribute to fatigue. Encourage regular breaks and sustainable pacing.",
            "icon": "⏰",
        })

    # Fallback if few recommendations
    if len(recs) < 2:
        if score > 50:
            recs.append({
                "title": "Schedule a Check-In",
                "desc": "Overall risk indicators are elevated. Consider scheduling a 1-on-1 to discuss workload and well-being.",
                "icon": "💬",
            })
        else:
            recs.append({
                "title": "Maintain Current Pace",
                "desc": "Work patterns look healthy. Continue monitoring to catch early signs of strain.",
                "icon": "👍",
            })

    return recs


# ── Routes ───────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    return send_from_directory(STATIC_DIR, "index.html")


@app.route("/predict", methods=["POST"])
def predict():
    """Accept 7 features, return risk score + SHAP explanation."""
    try:
        data = request.get_json(force=True)

        # Validate all features present
        missing = [f for f in FEATURE_NAMES if f not in data]
        if missing:
            return jsonify({"error": f"Missing features: {', '.join(missing)}"}), 400

        # Build input DataFrame
        input_values = [[float(data[f]) for f in FEATURE_NAMES]]
        input_df = pd.DataFrame(input_values, columns=FEATURE_NAMES)

        # Predict
        raw_score = model.predict(input_df)[0]
        risk_score = float(np.clip(raw_score, 0, 100))

        # SHAP explanation
        shap_values = explainer.shap_values(input_df)
        factors = []
        for i, feat in enumerate(FEATURE_NAMES):
            impact = float(shap_values[0][i])
            factors.append({
                "feature": feat,
                "label": FEATURE_LABELS[feat],
                "value": float(data[feat]),
                "impact": round(impact, 2),
                "direction": "Increases risk" if impact > 0 else "Decreases risk",
            })

        # Sort by absolute impact
        factors.sort(key=lambda x: abs(x["impact"]), reverse=True)

        risk_info = classify_risk(risk_score)
        recommendations = generate_recommendations(factors, risk_score)

        return jsonify({
            "risk_score": round(risk_score, 1),
            "risk_level": risk_info["level"],
            "risk_color": risk_info["color"],
            "risk_emoji": risk_info["emoji"],
            "factors": factors,
            "recommendations": recommendations,
            "base_value": round(float(explainer.expected_value), 2),
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── Run ──────────────────────────────────────────────────────────────────────

@app.route("/upload", methods=["POST"])
def upload():
    """Accept a CSV file upload, clean the data, and return batch predictions."""
    try:
        if "file" not in request.files:
            return jsonify({"error": "No file uploaded"}), 400

        file = request.files["file"]
        if file.filename == "":
            return jsonify({"error": "No file selected"}), 400

        # Read the file
        filename = file.filename.lower()
        if filename.endswith(".csv"):
            raw_df = pd.read_csv(file)
        elif filename.endswith((".xlsx", ".xls")):
            raw_df = pd.read_excel(file)
        else:
            return jsonify({"error": "Unsupported file format. Please upload a CSV or Excel file."}), 400

        if len(raw_df) == 0:
            return jsonify({"error": "The uploaded file contains no data rows."}), 400

        # Clean the data
        cleaned_df, employee_ids, warnings = data_cleaner.clean_data(raw_df)

        # Run predictions for all employees
        results = []
        raw_scores = model.predict(cleaned_df)
        shap_values = explainer.shap_values(cleaned_df)

        for idx in range(len(cleaned_df)):
            row = cleaned_df.iloc[idx]
            risk_score = float(np.clip(raw_scores[idx], 0, 100))

            # SHAP factors
            factors = []
            for i, feat in enumerate(FEATURE_NAMES):
                impact = float(shap_values[idx][i])
                factors.append({
                    "feature": feat,
                    "label": FEATURE_LABELS[feat],
                    "value": float(row[feat]),
                    "impact": round(impact, 2),
                    "direction": "Increases risk" if impact > 0 else "Decreases risk",
                })
            factors.sort(key=lambda x: abs(x["impact"]), reverse=True)

            risk_info = classify_risk(risk_score)
            recommendations = generate_recommendations(factors, risk_score)

            results.append({
                "employee_id": employee_ids[idx] if idx < len(employee_ids) else f"Employee {idx+1}",
                "risk_score": round(risk_score, 1),
                "risk_level": risk_info["level"],
                "risk_color": risk_info["color"],
                "risk_emoji": risk_info["emoji"],
                "factors": factors,
                "recommendations": recommendations,
                "input_values": {feat: float(row[feat]) for feat in FEATURE_NAMES},
            })

        return jsonify({
            "results": results,
            "total_employees": len(results),
            "warnings": warnings,
            "base_value": round(float(explainer.expected_value), 2),
        })

    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": f"Failed to process file: {str(e)}"}), 500


@app.route("/download-sample")
def download_sample():
    """Serve the sample raw company data CSV for download."""
    return send_from_directory(BASE_DIR, "sample_raw_company_data.csv", as_attachment=True)


if __name__ == "__main__":
    print("Starting Burnout Risk Detection API on http://localhost:5000")
    app.run(debug=True, port=5000)
