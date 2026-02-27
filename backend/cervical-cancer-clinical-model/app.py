import os, json, re
import numpy as np
import pandas as pd
import joblib
import shap
from flask import Flask, request, jsonify
from flask_cors import CORS
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.preprocessing import RobustScaler


# ══════════════════════════════════════════════════════════════════════════════
# Custom transformer classes (must be in __main__ so the pickle can find them)
# ══════════════════════════════════════════════════════════════════════════════

class STDAtomicTransformer(BaseEstimator, TransformerMixin):
    """Impute STD fields, engineer summary features, drop raw STD sub-cols."""

    _STD_BINARY = [
        "STDs:condylomatosis", "STDs:cervical condylomatosis",
        "STDs:vaginal condylomatosis", "STDs:vulvo-perineal condylomatosis",
        "STDs:syphilis", "STDs:pelvic inflammatory disease",
        "STDs:genital herpes", "STDs:molluscum contagiosum",
        "STDs:AIDS", "STDs:HIV", "STDs:Hepatitis B", "STDs:HPV",
    ]
    _HIGH_RISK = ["STDs:HIV", "STDs:AIDS", "STDs:Hepatitis B", "STDs:HPV"]

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        X = X.copy()
        binary_std_cols = [c for c in self._STD_BINARY if c in X.columns]
        high_risk_cols  = [c for c in self._HIGH_RISK  if c in X.columns]

        # 1. Impute / zero-out STD fields
        for idx in X.index:
            std_flag = X.loc[idx, "STDs"] if "STDs" in X.columns else np.nan
            if std_flag == 0:
                for c in binary_std_cols:
                    X.loc[idx, c] = 0.0
                for c in self.median_values_:
                    if c in X.columns:
                        X.loc[idx, c] = 0.0
            else:
                for c, med in self.median_values_.items():
                    if c in X.columns and pd.isna(X.loc[idx, c]):
                        X.loc[idx, c] = med
                for c in binary_std_cols:
                    if pd.isna(X.loc[idx, c]):
                        X.loc[idx, c] = 0.0

        # 2. Engineer summary features
        X["Any_STD"]      = (X[binary_std_cols].sum(axis=1) > 0).astype(int)
        X["STD_Burden"]   = X[binary_std_cols].sum(axis=1).astype(int)
        X["High_Risk_STD"] = (X[high_risk_cols].sum(axis=1) > 0).astype(int)

        # 3. Drop raw sub-columns + time columns
        drop = binary_std_cols + [
            c for c in ["STDs: Time since first diagnosis",
                        "STDs: Time since last diagnosis"] if c in X.columns
        ]
        X = X.drop(columns=drop)
        return X


class MissingnessIndicatorTransformer(BaseEstimator, TransformerMixin):
    """Create binary ``<col>_missing`` indicators for selected columns."""

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        X = X.copy()
        for col in self.columns:
            if col in X.columns:
                X[col + "_missing"] = X[col].isna().astype(int)
        return X


class GeneralImputerTransformer(BaseEstimator, TransformerMixin):
    """Impute NaN: median for continuous cols, mode for binary/categorical."""

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        X = X.copy()
        for col, med in self.median_values_.items():
            if col in X.columns:
                X[col] = X[col].fillna(med)
        for col, mode in self.mode_values_.items():
            if col in X.columns:
                X[col] = X[col].fillna(mode)
        return X


class ColumnNameSanitizer(BaseEstimator, TransformerMixin):
    """Replace spaces / special chars in column names with underscores."""

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        X = X.copy()
        X.columns = [re.sub(r"[^A-Za-z0-9_]+", "_", c).strip("_") for c in X.columns]
        return X


class RobustScalerTransformer(BaseEstimator, TransformerMixin):
    """Apply a fitted sklearn RobustScaler only to the numeric columns."""

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        X = X.copy()
        cols = [c for c in self.numeric_cols_ if c in X.columns]
        X[cols] = self.scaler_.transform(X[cols])
        return X


# ══════════════════════════════════════════════════════════════════════════════

app = Flask(__name__)
CORS(app)

BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models")

# ── Load artifacts once at startup ────────────────────────────────────────────
model      = joblib.load(os.path.join(MODELS_DIR, "final_model.joblib"))
pipeline   = joblib.load(os.path.join(MODELS_DIR, "preprocessing_pipeline.joblib"))
thresholds = json.load(open(os.path.join(MODELS_DIR, "thresholds.json")))

T1 = thresholds["t1"]
T2 = thresholds["t2"]

# ── Build SHAP explainer once (uses the base LightGBM inside the calibrated model)
_cal        = model.calibrated_classifiers_[0]
_base_model = _cal.estimator
_explainer  = shap.TreeExplainer(_base_model)

# ── Clinical Decision Support rules ──────────────────────────────────────────
CDS_RULES = {
    "Low Risk": {
        "summary": "Patient is at low risk for cervical cancer.",
        "actions": [
            "Routine cervical screening as per national guidelines (every 3–5 years).",
            "Counsel on STI prevention and safe sexual practices.",
        ],
    },
    "Moderate Risk": {
        "summary": "Patient has elevated risk factors that warrant closer monitoring.",
        "actions": [
            "Schedule cervical screening within the next 12 months.",
            "Assess and address modifiable risk factors (smoking cessation, STI treatment).",
            "Consider HPV co-testing at next visit.",
        ],
    },
    "High Risk": {
        "summary": "Patient has multiple significant risk factors. Urgent clinical review recommended.",
        "actions": [
            "Refer for colposcopy evaluation at the earliest opportunity.",
            "Do not defer based on last normal screening result.",
            "Document and address all identified risk factors.",
            "Ensure patient is counselled on the importance of follow-up.",
        ],
    },
}

REQUIRED_FIELDS = [
    "Age", "Number of sexual partners", "First sexual intercourse",
    "Num of pregnancies", "Smokes", "Smokes (years)", "Smokes (packs/year)",
    "Hormonal Contraceptives", "Hormonal Contraceptives (years)", "IUD",
    "IUD (years)", "STDs", "STDs (number)", "STDs:condylomatosis",
    "STDs:cervical condylomatosis", "STDs:vaginal condylomatosis",
    "STDs:vulvo-perineal condylomatosis", "STDs:syphilis",
    "STDs:pelvic inflammatory disease", "STDs:genital herpes",
    "STDs:molluscum contagiosum", "STDs:AIDS", "STDs:HIV",
    "STDs:Hepatitis B", "STDs:HPV", "STDs: Number of diagnosis",
    "STDs: Time since first diagnosis", "STDs: Time since last diagnosis",
]


def assign_risk(prob: float) -> str:
    if prob >= T2:
        return "High Risk"
    if prob >= T1:
        return "Moderate Risk"
    return "Low Risk"


def get_shap_explanation(X_processed, feature_names, top_n=5):
    """Return top N features driving this individual prediction."""
    sv = _explainer.shap_values(X_processed)
    # For binary classifiers shap_values may return a list [neg, pos]
    if isinstance(sv, list):
        sv = sv[1]
    sv_row = sv[0]
    pairs = sorted(
        zip(feature_names, sv_row),
        key=lambda x: abs(x[1]),
        reverse=True,
    )[:top_n]
    return [
        {
            "feature": feat,
            "shap_value": round(float(val), 4),
            "direction": "increases risk" if val > 0 else "decreases risk",
        }
        for feat, val in pairs
    ]


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "model_loaded": True})


@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json(force=True)

        row = {}
        for field in REQUIRED_FIELDS:
            value = data.get(field, None)
            row[field] = np.nan if (value == "" or value is None) else float(value)

        X = pd.DataFrame([row])
        X_processed = pipeline.transform(X)

        # Prediction
        prob       = float(model.predict_proba(X_processed)[0][1])
        risk_label = assign_risk(prob)

        # SHAP explanation
        feature_names    = list(X_processed.columns)
        shap_explanation = get_shap_explanation(X_processed, feature_names)

        # Clinical Decision Support
        cds = CDS_RULES[risk_label]

        return jsonify({
            "cancer_probability": round(prob, 4),
            "risk_label": risk_label,
            "thresholds": {"T1": T1, "T2": T2},
            "shap_explanation": shap_explanation,
            "cds_guidance": {
                "summary": cds["summary"],
                "actions": cds["actions"],
            },
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 400


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5010, debug=True)
