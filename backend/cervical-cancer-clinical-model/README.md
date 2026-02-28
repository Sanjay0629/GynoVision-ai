# Cervical Clinical Model — Flask API

This service provides clinical-risk predictions for cervical cancer from
structured clinical data. It exposes a small Flask API that performs
preprocessing, predicts probability of cancer, returns a risk label and
provides SHAP explanations plus simple Clinical Decision Support (CDS).

## Contents

- `app.py` — Flask application implementing `/predict` and `/health`.
- `models/` — contains `final_model.joblib`, `preprocessing_pipeline.joblib`, and `thresholds.json`.
- `requirements.txt` — Python package dependencies.
- `implementation_plan.md` — integration and frontend contract details.

## Requirements

Python 3.9+ and the packages in `requirements.txt`:

```bash
python -m pip install -r requirements.txt
```

Key libraries: `flask`, `joblib`, `scikit-learn`, `lightgbm`, `pandas`, `numpy`, `shap`.

## Model artifacts

Place the trained artifacts in `models/` (the repository expects these names):

- `final_model.joblib` — calibrated classifier (used for `predict_proba`).
- `preprocessing_pipeline.joblib` — sklearn pipeline used to transform frontend inputs.
- `thresholds.json` — JSON with keys `t1` and `t2` defining risk cutoffs.

The `implementation_plan.md` includes instructions for exporting and copying
these artifacts from training outputs.

## Running the server

Start the API with:

```bash
python app.py
```

The app binds to `0.0.0.0` on port `5010` (see `app.py` for the `__main__` port).

## API Endpoints

- `GET /health` — returns service health and whether the model is loaded.
- `POST /predict` — accepts a JSON object containing the clinical fields (see
  `REQUIRED_FIELDS` in `app.py`). Returns cancer probability, risk label,
  SHAP explanation and CDS guidance.

Example request (curl):

```bash
curl -X POST http://localhost:5010/predict \
  -H "Content-Type: application/json" \
  -d '{"Age":30, "Number of sexual partners":1, "First sexual intercourse":18, "Num of pregnancies":1, "Smokes":0, "Hormonal Contraceptives":0, "IUD":0, "STDs":0}'
```

Example response:

```json
{
  "cancer_probability": 0.1423,
  "risk_label": "High Risk",
  "thresholds": {"T1": 0.05, "T2": 0.10},
  "shap_explanation": [
    {"feature":"Age","shap_value":0.0812,"direction":"increases risk"}
  ],
  "cds_guidance": {"summary":"...","actions":["..."]}
}
```

## Required input fields

The server expects a flat JSON object containing the fields listed in
`REQUIRED_FIELDS` within `app.py` (examples and labels are documented in
`implementation_plan.md`). Use `null` or omit optional fields; the pipeline
will impute missing values where applicable.

## SHAP explanations & CDS

- The app builds a SHAP explainer at startup (uses the LightGBM base estimator)
  and returns the top features driving the individual prediction.
- A simple CDS mapping (`Low Risk` / `Moderate Risk` / `High Risk`) is applied
  based on thresholds from `thresholds.json` and returned as `cds_guidance`.

## Troubleshooting

- If the server fails on startup, confirm that `models/final_model.joblib` and
  `models/preprocessing_pipeline.joblib` exist and are loadable by `joblib`.
- Mismatched library versions (scikit-learn, lightgbm, shap) between training
  and serving environments are a common source of errors — prefer reproducing
  the training environment when possible.



