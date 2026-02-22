"""
Uterine Cancer TCGA Risk Prediction — Flask API
Port: 5008
Endpoints: /health, /model-info, /predict/uterine-tcga
"""

import os
import json
import traceback

import joblib
import numpy as np
import pandas as pd
import shap
from flask import Flask, request, jsonify
from flask_cors import CORS

# ──────────────────────────────────────────────
#  Paths & Artefact Loading
# ──────────────────────────────────────────────

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "model_artifacts")

# Load models and transformers
task_a_model = joblib.load(os.path.join(MODELS_DIR, "task_a_best_model.joblib"))
task_b_model = joblib.load(os.path.join(MODELS_DIR, "task_b_primary_best_model.joblib"))

imputer_a = joblib.load(os.path.join(MODELS_DIR, "imputer_task_a.joblib"))
scaler_a = joblib.load(os.path.join(MODELS_DIR, "scaler_task_a.joblib"))

imputer_b = joblib.load(os.path.join(MODELS_DIR, "imputer_task_b_primary.joblib"))
scaler_b = joblib.load(os.path.join(MODELS_DIR, "scaler_task_b_primary.joblib"))

label_encoder_a = joblib.load(os.path.join(MODELS_DIR, "label_encoder_subtype.joblib"))

# ──────────────────────────────────────────────
#  Pipeline Feature Definitions
# ──────────────────────────────────────────────
# The raw input fields from the frontend
RAW_FEATURES = [
    "mutation_count",
    "fraction_genome_altered",
    "msi_mantis_score",
    "msisensor_score",
    "diagnosis_age",
    "race_category"
]

NUMERIC_FEATURES = [
    "mutation_count",
    "fraction_genome_altered",
    "msi_mantis_score",
    "msisensor_score",
    "diagnosis_age"
]

# The exact order the pipeline expects after one-hot encoding
PIPELINE_FEATURES = [
    "Mutation Count",
    "Fraction Genome Altered",
    "Diagnosis Age",
    "MSI MANTIS Score",
    "MSIsensor Score",
    "Race Category_Asian",
    "Race Category_Black or African American",
    "Race Category_Native Hawaiian or Other Pacific Islander",
    "Race Category_White"
]
# Note: Baseline is "American Indian or Alaska Native" which is dropped.

# ──────────────────────────────────────────────
#  Preprocessing Helper
# ──────────────────────────────────────────────

def preprocess_input(data: dict) -> pd.DataFrame:
    """Replicate the exact training pipeline: 1-hot encode, impute, scale, PCA merge."""
    
    # 1. Build dictionary for DataFrame (numeric + all OHE columns default to 0)
    row = {
        "Mutation Count": float(data.get("mutation_count", 0)),
        "Fraction Genome Altered": float(data.get("fraction_genome_altered", 0)),
        "Diagnosis Age": float(data.get("diagnosis_age", 0)),
        "MSI MANTIS Score": float(data.get("msi_mantis_score", 0)),
        "MSIsensor Score": float(data.get("msisensor_score", 0)),
        "Race Category_Asian": 0.0,
        "Race Category_Black or African American": 0.0,
        "Race Category_Native Hawaiian or Other Pacific Islander": 0.0,
        "Race Category_White": 0.0,
    }

    # 2. Assign the actual one-hot encoded race value
    race = data.get("race_category", "")
    ohe_col = f"Race Category_{race}"
    if ohe_col in row:
        row[ohe_col] = 1.0

    # 3. Create DataFrame in EXACT order
    df = pd.DataFrame([row])[PIPELINE_FEATURES]
    return df


def transform_and_pca(df: pd.DataFrame, imputer, scaler) -> pd.DataFrame:
    """Impute, Scale, and Merge MSI features via PCA-simulated averaging."""
    # Impute
    imputed_array = imputer.transform(df)
    df_imputed = pd.DataFrame(imputed_array, columns=PIPELINE_FEATURES)
    
    # Scale
    scaled_array = scaler.transform(df_imputed)
    df_scaled = pd.DataFrame(scaled_array, columns=PIPELINE_FEATURES)
    
    # Simulate the PCA merge
    msi_mantis = df_scaled["MSI MANTIS Score"]
    msisensor = df_scaled["MSIsensor Score"]
    df_scaled["MSI_PC1"] = (msi_mantis + msisensor) / 2.0
    
    # Drop original MSI cols
    df_final = df_scaled.drop(columns=["MSI MANTIS Score", "MSIsensor Score"])
    
    # Ensure correct column order for model
    final_cols = [
        "Mutation Count",
        "Fraction Genome Altered",
        "Diagnosis Age",
        "Race Category_Asian",
        "Race Category_Black or African American",
        "Race Category_Native Hawaiian or Other Pacific Islander",
        "Race Category_White",
        "MSI_PC1"
    ]
    return df_final[final_cols]


# ──────────────────────────────────────────────
#  SHAP Explainer
# ──────────────────────────────────────────────

def _compute_shap(model, X_df, is_tree=True, top_n=5) -> list:
    """Compute per-prediction SHAP explanations."""
    try:
        # For tree-based models (Random Forest, XGBoost)
        explainer = shap.TreeExplainer(model)
        shap_values = explainer.shap_values(X_df)
        
        # XGBoost returns standard array, RandomForest returns list of arrays per class
        if isinstance(shap_values, list):
            sv = shap_values[1] # Take positive class or main class
        else:
            sv = shap_values
            
        values = sv[0] if sv.ndim == 2 else sv
        
        feature_names = X_df.columns.tolist()
        pairs = list(zip(feature_names, values))
        
        # Sort by absolute magnitude
        pairs.sort(key=lambda x: abs(x[1]), reverse=True)
        top = pairs[:top_n]
        
        # Clean up names for frontend
        name_map = {
            "mutation_count": "Mutation Count",
            "fraction_genome_altered": "Fraction Genome Altered",
            "diagnosis_age": "Age at Diagnosis",
            "MSI_PC1": "MSI / Mutation Signature",
            "Race Category_Asian": "Race (Asian)",
            "Race Category_Black or African American": "Race (Black/African American)",
            "Race Category_White": "Race (White)",
        }
        
        return [
            {
                "feature": name_map.get(name, name.replace("Race Category_", "Race (") + ")"),
                "shap_value": round(float(val), 4),
                "direction": "increases risk" if val > 0 else "decreases risk"
            }
            for name, val in top
        ]
        
    except Exception as e:
        print(f"[SHAP WARNING] Could not compute SHAP values: {e}")
        return []

# ──────────────────────────────────────────────
#  Flask Application
# ──────────────────────────────────────────────

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "healthy", "model": "uterine_tcga"})


@app.route("/model-info", methods=["GET"])
def model_info():
    return jsonify({
        "model_name": "Uterine Cancer TCGA Molecular Classifier",
        "task_a_model": "Random Forest (Subtype)",
        "task_b_model": "XGBoost (Survival)",
        "features": RAW_FEATURES,
        "version": "1.0.0",
        "subtypes": list(label_encoder_a.classes_)
    })


@app.route("/predict/uterine-tcga", methods=["POST"])
def predict():
    try:
        data = request.get_json(force=True)
        if not data:
            return jsonify({"error": "Empty or invalid JSON body."}), 400

        # ---- validate required fields ----
        missing = [f for f in RAW_FEATURES if f not in data]
        if missing:
            return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

        # ---- Preprocess ----
        df_raw = preprocess_input(data)
        
        # Task A (Subtype) Transformation
        X_a = transform_and_pca(df_raw, imputer_a, scaler_a)
        
        # Task B (Survival) Transformation
        X_b = transform_and_pca(df_raw, imputer_b, scaler_b)
        
        # ---- Task A: Subtype Prediction ----
        pred_a_encoded = task_a_model.predict(X_a)[0]
        proba_a = task_a_model.predict_proba(X_a)[0]
        
        subtype_name = label_encoder_a.inverse_transform([pred_a_encoded])[0]
        max_conf = float(np.max(proba_a))
        
        class_probs = {
            cls_name: float(prob)
            for cls_name, prob in zip(label_encoder_a.classes_, proba_a)
        }
        
        # ---- Task B: Survival Prediction ----
        # 1 = Deceased, 0 = Living
        proba_b = task_b_model.predict_proba(X_b)[0][1]
        survival_pred = "DECEASED" if proba_b >= 0.5 else "LIVING"
        
        # Stratify risk roughly (Low < 0.3, Int 0.3-0.7, High >= 0.7)
        if proba_b < 0.3:
            s_risk_tier = "Low"
        elif proba_b >= 0.7:
            s_risk_tier = "High"
        else:
            s_risk_tier = "Intermediate"
            
        # ---- SHAP Explainability ----
        # Using Survival model for risk explanation as it maps directly to "increases/decreases risk"
        shap_explanation = _compute_shap(task_b_model, X_b, top_n=5)

        # ---- Response ----
        return jsonify({
            "subtype": {
                "prediction": subtype_name,
                "confidence": round(max_conf, 4),
                "probabilities": class_probs
            },
            "survival": {
                "prediction": survival_pred,
                "probability_deceased": round(float(proba_b), 4),
                "risk_tier": s_risk_tier
            },
            "shap_explanation": shap_explanation,
            "disclaimer": "This is a research prototype using TCGA data. Not clinically validated for patient care."
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    print("=" * 60)
    print("  Uterine Cancer TCGA Molecular API")
    print("  Port: 5008")
    print("=" * 60)
    app.run(host="0.0.0.0", port=5008, debug=True)
