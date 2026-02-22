# Uterine Cancer TCGA Molecular Prediction API

A Flask-based microservice that leverages **The Cancer Genome Atlas (TCGA)** trained models to predict uterine (endometrial) cancer molecular subtypes and survival outcomes. 

This service integrates two high-performance models:
1.  **Task A (Subtype Classification)**: Multi-class Random Forest model predicting `UCEC_CN_HIGH`, `UCEC_CN_LOW`, `UCEC_MSI`, and `UCEC_POLE`.
2.  **Task B (Survival Analysis)**: XGBoost model predicting `LIVING` vs `DECEASED` outcomes and associated risk probabilities.

---

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Virtual environment (recommended)

### Installation
1. Navigate to the microservice directory:
   ```bash
   cd backend/uterine-cancer-TCGA-model
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # Windows
   .\venv\Scripts\activate
   # Linux/Mac
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

### Running the API
```bash
python app.py
```
The server will start on **http://localhost:5008**.

---

## 🛠 API Endpoints

### 1. Health Check
`GET /health`
Returns the operational status and model identifier.

### 2. Model Information
`GET /model-info`
Returns metadata about the subtype classes, performance metrics, and required input features.

### 3. Predict Molecular Risk
`POST /predict/uterine-tcga`
Handles prediction requests. Requires a JSON body with 6 features.

**Sample Request Body:**
```json
{
  "mutation_count": 65,
  "fraction_genome_altered": 0.3311,
  "diagnosis_age": 59,
  "msi_mantis_score": 0.3234,
  "msisensor_score": 0.85,
  "race_category": "Black or African American"
}
```

**Features Description:**
- `mutation_count`: Total somatic mutations.
- `fraction_genome_altered`: Ratio of genome with copy number alterations (0.0 to 1.0).
- `diagnosis_age`: Age of the patient at the time of diagnosis.
- `msi_mantis_score`: Microsatellite instability score (MANTIS).
- `msisensor_score`: MSIsensor genomic instability score.
- `race_category`: One of `White`, `Black or African American`, `Asian`, `Native Hawaiian or Other Pacific Islander`, `American Indian or Alaska Native`.

---

## 🧠 Model Logic & Explainability

### Preprocessing
The API replicates the exact training pipeline:
1.  **One-Hot Encoding**: Handled for `race_category`.
2.  **Imputation & Scaling**: Uses pre-trained `joblib` artifacts to ensure feature consistency.
3.  **MSI_PC1 Merge**: Merges `msi_mantis_score` and `msisensor_score` into a single genomic component using a PCA-aligned transformation.

### SHAP Explanations
The API provides per-prediction feature importance.
> [!NOTE]
> Due to a known `SHAP` library incompatibility with certain XGBoost versions (JSON `base_score` parsing), this API implements an **automated fallback**. If the standard `TreeExplainer` fails, it utilizes global feature importances signed by the patient's specific risk probability to ensure continuous visual feedback on the frontend.

## ⚠️ Disclaimer
This is a **Research Prototype** built using public TCGA data. It has not undergone clinical validation and is intended for demonstration and research purposes only.
