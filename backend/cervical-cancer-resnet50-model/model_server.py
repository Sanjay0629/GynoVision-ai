"""
Cervical Cancer Detection — Flask API Server
=============================================
Serves a FastAI ResNet-50 model that classifies Pap smear cytology images
into one of five cell types:
  Dyskeratotic | Koilocytotic | Metaplastic | Parabasal | Superficial-Intermediate

Endpoint consumed by the React frontend (CervicalCytology page):
  POST /predict/cervical   — multipart/form-data with a 'file' field
  GET  /health             — liveness / readiness probe
"""

import pathlib
import platform
import sys
import os

# ── 1. Patch: Linux/Windows path compatibility ──────────────────────────────
# Models trained on Linux save PosixPath objects inside the pickle; on Windows
# the deserialiser will choke unless we alias PosixPath → WindowsPath.
if platform.system() == "Windows":
    pathlib.PosixPath = pathlib.WindowsPath

# ── 2. Patch: Mock IPython to prevent progress-bar crashes ──────────────────
try:
    import IPython  # noqa: F401
except ImportError:
    from unittest.mock import MagicMock

    _mock = MagicMock()
    sys.modules["IPython"] = _mock
    sys.modules["IPython.display"] = _mock

# ── 3. Patch: plum-dispatch version compatibility ───────────────────────────
# The model was trained with an older plum-dispatch that possessed sub-modules
# like `plum.function`, `plum.resolver`, `plum.signature`, etc. Later versions 
# reorganized the namespace. We mapped legacy paths to modern counterparts.
import types
try:
    import plum

    def _shim_plum(public_name, private_name=None):
        if private_name is None:
            private_name = "_" + public_name.split('.')[-1]
        full_private = "plum." + private_name if not private_name.startswith("plum.") else private_name
        try:
            mod = __import__(full_private, fromlist=['*'])
            sys.modules[public_name] = mod
            setattr(plum, public_name.split('.')[-1], mod)
        except ImportError:
            # Fallback to root plum namespace for missing submodules
            shim = types.ModuleType(public_name)
            shim.__dict__.update({k: v for k, v in plum.__dict__.items() if not k.startswith('_')})
            sys.modules[public_name] = shim
            setattr(plum, public_name.split('.')[-1], shim)

    # Legacy modules used by the pickled model
    for mod_name in ['function', 'resolver', 'signature', 'type', 'method', 'util', 'promotion', 'dispatcher']:
        _shim_plum(f'plum.{mod_name}', f'_{mod_name}')

    # Stub missing classes if they moved or were removed
    if not hasattr(plum.type, 'Type'):
        class _TypeStub: pass
        plum.type.Type = _TypeStub

    print("[INFO]  Applied exhaustive plum compatibility shims")
except ImportError:
    pass  # plum not installed — handled during model launch



# ── 4. Imports (after patches) ──────────────────────────────────────────────
from flask import Flask, request, jsonify  # noqa: E402
from flask_cors import CORS  # noqa: E402
from fastai.vision.all import PILImage  # noqa: E402
from pathlib import Path  # noqa: E402
import torch  # noqa: E402
import pickle  # noqa: E402

# ── 5. Flask app setup ──────────────────────────────────────────────────────
app = Flask(__name__)

# Allow the React dev-server (usually :5173 for Vite or :3000 for CRA)
CORS(app, resources={
    r"/predict/*": {"origins": ["http://localhost:3000", "http://localhost:5173", "http://localhost:8080"]},
    r"/health":    {"origins": "*"},
})

# ── 6. Model loading ────────────────────────────────────────────────────────
MODEL_DIR = Path(__file__).resolve().parent / "models"
MODEL_FILENAME = "export.pkl"

learn = None  # global learner reference


def _find_model() -> Path | None:
    """Search several likely locations for the model file."""
    candidates = [
        MODEL_DIR / MODEL_FILENAME,                # models/export.pkl
        Path(__file__).resolve().parent / MODEL_FILENAME,  # export.pkl (same dir)
    ]
    for p in candidates:
        if p.exists():
            return p
    return None


def load_model() -> bool:
    """Load (or reload) the FastAI learner.  Returns True on success.

    Uses ``torch.load`` directly instead of fastai's ``load_learner``
    because the latter silently swallows ``ModuleNotFoundError`` when
    the pickle references old module paths (e.g. ``plum.function``).
    """
    global learn
    model_path = _find_model()
    if model_path is None:
        print("[ERROR] Model file not found. Searched:")
        print(f"        - {MODEL_DIR / MODEL_FILENAME}")
        print(f"        - {Path(__file__).resolve().parent / MODEL_FILENAME}")
        return False

    try:
        print(f"[INFO]  Loading model from {model_path} ...")
        # Direct torch.load — avoids the buggy error handling in
        # fastai 2.8.x's load_learner which swallows ImportErrors.
        res = torch.load(
            model_path,
            map_location="cpu",
            pickle_module=pickle,
            weights_only=False,
        )
        # Replicate what load_learner does after a successful load
        res.dls.cpu()
        if hasattr(res, "channels_last"):
            res = res.to_contiguous(to_fp32=True)
        elif hasattr(res, "mixed_precision"):
            res = res.to_fp32()
        elif hasattr(res, "non_native_mixed_precision"):
            res = res.to_non_native_fp32()
        learn = res
        print(f"[INFO]  Model loaded successfully!  Classes: {learn.dls.vocab}")
        return True
    except Exception as exc:
        import traceback
        print(f"[ERROR] Failed to load model: {exc}")
        traceback.print_exc()
        learn = None
        return False


# Attempt to load on startup
load_model()

# ── 7. Routes ────────────────────────────────────────────────────────────────


@app.route("/health", methods=["GET"])
def health():
    """Liveness / readiness probe."""
    return jsonify({
        "status": "healthy" if learn is not None else "model_not_loaded",
        "model_loaded": learn is not None,
        "model_classes": list(learn.dls.vocab) if learn else [],
    })


@app.route("/predict/cervical", methods=["POST"])
def predict_cervical():
    """
    Classify a cytology image.

    Expects:
        multipart/form-data with key 'file' holding the image.

    Returns (200):
        {
            "prediction":  "Dyskeratotic",
            "confidence":  0.9723,
            "classes":     ["Dyskeratotic", "Koilocytotic", ...]
        }

    Returns (4xx / 5xx):
        { "error": "description of problem" }
    """
    global learn

    # ── Guard: model must be available ──
    if learn is None:
        if not load_model():
            return jsonify({"error": "Model not found or failed to load. Check server logs."}), 500

    # ── Guard: file must be present ──
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded. Include a 'file' field in form-data."}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "Empty filename — no file was selected."}), 400

    # ── Allowed extensions check ──
    ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "bmp", "tif", "tiff"}
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        return jsonify({
            "error": f"Unsupported file type '.{ext}'. Accepted: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        }), 400

    # ── Inference ──
    try:
        img = PILImage.create(file.stream)
        pred, pred_idx, probs = learn.predict(img)

        # Build per-class probability map
        class_probs = {
            cls: round(float(probs[i]), 4)
            for i, cls in enumerate(learn.dls.vocab)
        }

        return jsonify({
            "prediction":  str(pred),
            "confidence":  round(float(probs[pred_idx]), 4),
            "classes":     list(learn.dls.vocab),
            "class_probabilities": class_probs,
        })

    except Exception as exc:
        print(f"[ERROR] Prediction failed: {exc}")
        return jsonify({"error": f"Prediction failed: {str(exc)}"}), 500


# ── 8. Entry-point ───────────────────────────────────────────────────────────
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5009))
    print(f"[INFO]  Starting Cervical Cancer Detection API on port {port}")
    print(f"[INFO]  POST /predict/cervical  — classify a cytology image")
    print(f"[INFO]  GET  /health            — server health check")
    app.run(host="0.0.0.0", port=port, debug=False)
