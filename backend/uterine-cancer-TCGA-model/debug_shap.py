import joblib
import pandas as pd
import shap
import traceback

print("Loading Task B model...")
model = joblib.load("model_artifacts/task_b_primary_best_model.joblib")

cols = [
    "Mutation Count",
    "Fraction Genome Altered",
    "Diagnosis Age",
    "Race Category_Asian",
    "Race Category_Black or African American",
    "Race Category_Native Hawaiian or Other Pacific Islander",
    "Race Category_White",
    "MSI_PC1"
]
df = pd.DataFrame([[0]*8], columns=cols)

try:
    print("Modifying booster...")
    booster = model.get_booster()
    booster.set_param({"base_score": 0.5})
    
    print("Initializing Explainer...")
    explainer = shap.TreeExplainer(booster)
    print("Computing shap values...")
    shap_values = explainer.shap_values(df)
    print("Success")
    print(shap_values)
except Exception as e:
    print(f"Error computing SHAP: {repr(e)}")
