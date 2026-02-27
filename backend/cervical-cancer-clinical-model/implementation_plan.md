# Backend + Frontend Integration Plan
## (with SHAP Explanations + Clinical Decision Support)

---

## Step 1 — Copy Model Artifacts to Backend Folder

```
output/models/final_model.joblib           → backend/
output/models/preprocessing_pipeline.joblib → backend/
output/models/thresholds.json               → backend/
```

> [!IMPORTANT]
> Both [.joblib](file:///c:/Users/Sanjay/Desktop/Cervical-cancer-clinical-model/output/models/final_model.joblib) files must travel together. The pipeline transforms input **before** the model sees it.

---

## Step 2 — Install Backend Dependencies

```bash
pip install flask flask-cors joblib scikit-learn lightgbm shap pandas numpy
```

---

## Step 3 — Full Flask API (`app.py`)

```python
import os, json
import numpy as np
import pandas as pd
import joblib
import shap
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# ── Load artifacts once at startup ────────────────────────────────────────────
model      = joblib.load(os.path.join(BASE_DIR, "final_model.joblib"))
pipeline   = joblib.load(os.path.join(BASE_DIR, "preprocessing_pipeline.joblib"))
thresholds = json.load(open(os.path.join(BASE_DIR, "thresholds.json")))

T1 = thresholds["T1"]
T2 = thresholds["T2"]

# ── Build SHAP explainer once (uses the base LightGBM inside the calibrated model)
_cal = model.calibrated_classifiers_[0]
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


def assign_risk(prob):
    if prob >= T2: return "High Risk"
    if prob >= T1: return "Moderate Risk"
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
        prob        = float(model.predict_proba(X_processed)[0][1])
        risk_label  = assign_risk(prob)

        # SHAP explanation
        feature_names = list(X_processed.columns)
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
    app.run(host="0.0.0.0", port=5000, debug=True)
```

---

## Step 4 — Frontend Input Fields

Send these as a flat JSON object. Use `null` for optional fields left blank.

### Section A — Demographics & Lifestyle

| Frontend Label | JSON Key | Type |
|---|---|---|
| Age | `Age` | Number |
| Number of sexual partners | `Number of sexual partners` | Number *(optional)* |
| Age at first intercourse | `First sexual intercourse` | Number *(optional)* |
| Number of pregnancies | `Num of pregnancies` | Number |
| Smokes? | `Smokes` | 0 / 1 |
| Smoking duration (years) | `Smokes (years)` | Number *(optional)* |
| Smoking amount (packs/year) | `Smokes (packs/year)` | Number |

### Section B — Contraception & IUD

| Frontend Label | JSON Key | Type |
|---|---|---|
| Uses hormonal contraceptives? | `Hormonal Contraceptives` | 0 / 1 |
| HC duration (years) | `Hormonal Contraceptives (years)` | Number *(optional)* |
| IUD use? | `IUD` | 0 / 1 |
| IUD duration (years) | `IUD (years)` | Number |

### Section C — STD History

| Frontend Label | JSON Key | Type |
|---|---|---|
| Any STD history? | `STDs` | 0 / 1 |
| Number of STDs | `STDs (number)` | Number |
| Condylomatosis | `STDs:condylomatosis` | 0 / 1 |
| Cervical condylomatosis | `STDs:cervical condylomatosis` | 0 / 1 |
| Vaginal condylomatosis | `STDs:vaginal condylomatosis` | 0 / 1 |
| Vulvo-perineal condylomatosis | `STDs:vulvo-perineal condylomatosis` | 0 / 1 |
| Syphilis | `STDs:syphilis` | 0 / 1 |
| Pelvic inflammatory disease | `STDs:pelvic inflammatory disease` | 0 / 1 |
| Genital herpes | `STDs:genital herpes` | 0 / 1 |
| Molluscum contagiosum | `STDs:molluscum contagiosum` | 0 / 1 |
| AIDS | `STDs:AIDS` | 0 / 1 |
| HIV | `STDs:HIV` | 0 / 1 |
| Hepatitis B | `STDs:Hepatitis B` | 0 / 1 |
| HPV | `STDs:HPV` | 0 / 1 |
| Number of STD diagnoses | `STDs: Number of diagnosis` | Number |
| Time since first STD diagnosis (yrs) | `STDs: Time since first diagnosis` | Number *(optional)* |
| Time since last STD diagnosis (yrs) | `STDs: Time since last diagnosis` | Number *(optional)* |

---

## Step 5 — API Response Contract

### Full Response Example

```json
{
  "cancer_probability": 0.1423,
  "risk_label": "High Risk",
  "thresholds": { "T1": 0.05, "T2": 0.10 },

  "shap_explanation": [
    { "feature": "Age", "shap_value": 0.0812, "direction": "increases risk" },
    { "feature": "Hormonal_Contraceptives_years", "shap_value": 0.0645, "direction": "increases risk" },
    { "feature": "First_sexual_intercourse", "shap_value": -0.0412, "direction": "decreases risk" },
    { "feature": "Num_of_pregnancies", "shap_value": 0.0388, "direction": "increases risk" },
    { "feature": "Number_of_sexual_partners", "shap_value": 0.0201, "direction": "increases risk" }
  ],

  "cds_guidance": {
    "summary": "Patient has multiple significant risk factors. Urgent clinical review recommended.",
    "actions": [
      "Refer for colposcopy evaluation at the earliest opportunity.",
      "Do not defer based on last normal screening result.",
      "Document and address all identified risk factors.",
      "Ensure patient is counselled on the importance of follow-up."
    ]
  }
}
```

---

## Step 6 — Frontend Display Guide

Use the response fields to build your results panel:

| Response Field | What to Show |
|---|---|
| `risk_label` | Coloured badge: 🟢 Low / 🟡 Moderate / 🔴 High |
| `cancer_probability` | "Estimated Cancer Probability: **14.2%**" |
| `shap_explanation` | Bar chart or list: "Top factors driving this result" |
| `cds_guidance.summary` | Highlighted summary box |
| `cds_guidance.actions` | Bullet-point checklist for the clinician |

> [!IMPORTANT]
> Always display the disclaimer: *"This tool is for screening prioritisation only and does not constitute a clinical diagnosis. Clinical judgement must be applied."*

---

## Final Backend Folder Structure

```
backend/
├── app.py
├── final_model.joblib
├── preprocessing_pipeline.joblib
├── thresholds.json
└── requirements.txt
```
