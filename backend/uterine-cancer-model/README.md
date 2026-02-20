# Uterine Cancer Risk Prediction API

A Flask-based microservice for estimating uterine cancer risk based on clinical features. This service provides a prediction probability, risk tier classification, per-feature clinical contributions (SHAP equivalent), and rule-based clinical recommendations.

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Virtual environment (recommended)

### Installation
1. Navigate to the backend directory:
   ```bash
   cd backend/uterine-cancer-model
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # Windows
   venv\Scripts\activate
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
The server will start on **http://localhost:5007**.

---

## 🛠 API Endpoints

### 1. Health Check
`GET /health`
Returns the operational status of the API.

### 2. Model Information
`GET /model-info`
Returns metadata about the currently loaded model, including expected features and risk thresholds.

### 3. Predict Risk
`POST /predict/uterine`
Main endpoint for risk estimation. Requires a JSON body with 18 clinical features.

**Sample Request Body:**
```json
{
  "Age": 62,
  "BMI": 31.5,
  "MenopauseStatus": "Postmenopausal",
  "AbnormalBleeding": "Yes",
  "PelvicPain": "Yes",
  "VaginalDischarge": "No",
  "UnexplainedWeightLoss": "No",
  "ThickEndometrium": 18.5,
  "CA125_Level": 65.3,
  "Hypertension": "No",
  "Diabetes": "Yes",
  "FamilyHistoryCancer": "No",
  "Smoking": "No",
  "EstrogenTherapy": "No",
  "HistologyType": "Endometrioid",
  "Parity": 2,
  "Gravidity": 3,
  "HormoneReceptorStatus": "Positive"
}
```

---

## 🧠 Model Details

- **Model Type**: Logistic Regression (with Class Weighting)
- **Input Features**: 18 clinico-pathological features.
- **Risk Stratification**:
  - **Low**: Probability < 0.56
  - **Intermediate**: Probability 0.56 – 0.65
  - **High**: Probability ≥ 0.65
- **Explainability**: Uses coefficient-based feature importance to show which factors increased or decreased the specific patient's risk.
- **Recommendations**: Integrated rule-based engine providing clinical guidance based on GOG/ESGO standards (e.g., endometrial thickness thresholds).

## ⚠️ Disclaimer
This tool is a **Clinical Decision Support (CDS) prototype** built for research purposes. It is trained on synthetic data and has not been clinically validated. All results should be reviewed by a qualified healthcare professional.
