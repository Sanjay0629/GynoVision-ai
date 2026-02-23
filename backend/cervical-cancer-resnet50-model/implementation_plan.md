# Perfect Implementation Plan: React + Flask Integration

This plan provides a robust, production-ready setup to connect your React frontend with the Cervical Cancer Detection backend (Flask + FastAI).

## 1. Architecture Overview

```mermaid
graph LR
    A[React Frontend] -- Image Upload (POST) --> B[Flask API]
    B -- Inference --> C[FastAI Model (export.pkl)]
    C -- Prediction --> B
    B -- JSON Result --> A
```

---

## 2. Backend Setup (`/backend`)

### A. Directory Structure
```text
backend/
├── models/
│   └── export.pkl          # Your trained model file
├── model_server.py         # The Flask API script
└── requirements.txt        # Backend dependencies
```

### B. `requirements.txt` (The "Golden" Version)
These specific dependencies resolve the `IPython`, `plum-dispatch`, and version mismatch issues.

```text
flask
flask-cors
fastai>=2.7.10
torch>=2.0.0
torchvision
ipython
plum-dispatch
pillow
werkzeug
```

### C. [model_server.py](file:///c:/Users/Sanjay/Desktop/cervical_cancer_detection/model_server.py) (Robust Implementation)
This code includes the "monkeypatches" for Windows compatibility and handles loading errors gracefully.

```python
import pathlib
import sys
from flask import Flask, request, jsonify
from flask_cors import CORS
from fastai.vision.all import *

# 1. FIX: Linux/Windows path compatibility
pathlib.PosixPath = pathlib.WindowsPath

# 2. FIX: Mock IPython to prevent progress bar crashes
try:
    import IPython
except ImportError:
    from unittest.mock import MagicMock
    mock = MagicMock()
    sys.modules["IPython"] = mock
    sys.modules["IPython.display"] = mock

app = Flask(__name__)
# Enable CORS for React (port 3000)
CORS(app, resources={r"/predict": {"origins": "http://localhost:3000"}})

# Global variable for the model
learn = None

def load_model():
    global learn
    # Search for model in common locations
    model_paths = [Path("export.pkl"), Path("models/export.pkl"), Path("../data/processed/models/export.pkl")]
    for path in model_paths:
        if path.exists():
            try:
                print(f"Loading model from {path}...")
                learn = load_learner(path)
                print("Model loaded successfully!")
                return True
            except Exception as e:
                print(f"Error loading from {path}: {e}")
    return False

# Initial load attempt
load_model()

@app.route('/predict', methods=['POST'])
def predict():
    global learn
    if learn is None and not load_model():
        return jsonify({'error': 'Model not found or failed to load'}), 500

    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    
    file = request.files['file']
    try:
        img = PILImage.create(file.stream)
        pred, pred_idx, probs = learn.predict(img)
        
        return jsonify({
            'prediction': str(pred),
            'confidence': float(probs[pred_idx]),
            'classes': list(learn.dls.vocab)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
```

---

## 3. Frontend Setup (`/frontend`)

### A. Install Axios (Recommended)
```bash
npm install axios
```

### B. React Api Service (`api.js`)
```javascript
import axios from 'axios';

const API_URL = 'http://localhost:5000';

export const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await axios.post(`${API_URL}/predict`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};
```

### C. Example React Component
```jsx
// Simplified example of the prediction component
function Predictor() {
    const [file, setFile] = useState(null);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const onFileChange = (e) => setFile(e.target.files[0]);

    const handlePredict = async () => {
        setLoading(true);
        try {
            const data = await uploadImage(file);
            setResult(data);
        } catch (err) {
            alert('Error: ' + err.message);
        }
        setLoading(false);
    };

    return (
        <div>
            <input type="file" onChange={onFileChange} />
            <button onClick={handlePredict} disabled={!file || loading}>
                {loading ? 'Analyzing...' : 'Predict'}
            </button>
            {result && (
                <div>
                    <h3>Result: {result.prediction}</h3>
                    <p>Confidence: {(result.confidence * 100).toFixed(2)}%</p>
                </div>
            )}
        </div>
    );
}
```

---

## 4. Execution Steps

1.  **Backend**:
    - Place [export.pkl](file:///c:/Users/Sanjay/Desktop/cervical_cancer_detection/data/processed/models/export.pkl) in a `models/` folder.
    - Run `pip install -r requirements.txt`.
    - Run `python model_server.py`.
2.  **Frontend**:
    - Ensure your React app is configured to call `http://localhost:5000`.
    - Run `npm start`.
3.  **Test**: Upload an image and verify the prediction response.

---

## 5. Troubleshooting checklist

> [!TIP]
> **Checklist for `UnboundLocalError`**
> - Ensure `torch` version is >= 2.0.
> - Ensure `fastai` version is >= 2.7.
> - If you used custom classes/functions during training, they **must** be defined in [model_server.py](file:///c:/Users/Sanjay/Desktop/cervical_cancer_detection/model_server.py) before `load_learner`.

> [!IMPORTANT]
> **CORS Configuration**
> If your React app is NOT on `localhost:3000`, update the `CORS` line in [model_server.py](file:///c:/Users/Sanjay/Desktop/cervical_cancer_detection/model_server.py) to match your frontend URL.
