# Cervical Cytology — ResNet-50 Model Server

This folder contains a lightweight Flask model server that serves a FastAI ResNet-50
learner trained to classify Pap-smear cytology image patches into five classes:

- Dyskeratotic
- Koilocytotic
- Metaplastic
- Parabasal
- Superficial-Intermediate

The server is intended to be used by the frontend (Cervical Cytology page) or
called directly for batch inference and testing.

## Contents

- `model_server.py` — Flask API that exposes `/predict/cervical` and `/health`.
- `test_model.py` — basic inference/test utilities.
- `verify_api.py` — helper script to call the running API for verification.
- `requirements.txt` — Python dependencies used by the server.
- `models/` — place model artifacts here (see below).

## Requirements

Python 3.9+ (a compatible interpreter with `fastai`/`torch`), then install:

```bash
python -m pip install -r requirements.txt
```

On Windows the server includes compatibility shims for `pathlib` and `plum-dispatch`
because some saved FastAI learners reference older module paths.

## Model artifact

The server looks for a FastAI export file named `export.pkl` in one of these
locations (in order):

- `models/export.pkl` (recommended)
- `export.pkl` next to `model_server.py`

If you have a trained learner (exported via `learn.export()`), place the file
as `models/export.pkl` before starting the server.

## Running the server

Start the API with:

```bash
python model_server.py
```

By default the server binds to `0.0.0.0` and port `5009`. To override the port:

## API

- `GET  /health` — liveness/readiness probe. Returns JSON with `model_loaded` and `model_classes`.
- `POST /predict/cervical` — accepts `multipart/form-data` with key `file` containing the image.

Successful response example (200):

```json
{
  "prediction": "Dyskeratotic",
  "confidence": 0.9723,
  "classes": ["Dyskeratotic", "Koilocytotic", "Metaplastic", "Parabasal", "Superficial-Intermediate"],
  "class_probabilities": {"Dyskeratotic": 0.9723, "Koilocytotic": 0.0123, "Metaplastic": 0.0054, "Parabasal": 0.0045, "Superficial-Intermediate": 0.0055}
}
```

cURL example:

```bash
curl -X POST -F "file=@/path/to/image.jpg" http://localhost:5009/predict/cervical
```

## Tests & verification

- `python test_model.py` — local inference test harness (see file for options).
- `python verify_api.py` — exercise the running HTTP API (useful after starting `model_server.py`).

## Troubleshooting

- If the server prints `Model file not found`, verify `models/export.pkl` exists.
- The server contains compatibility shims for older `plum-dispatch`/pickled models —
  ensure `plum-dispatch` is installed (listed in `requirements.txt`).
- If inference fails with import errors, check that the environment matches the
  major library versions used during training (`fastai`, `torch`).

## Notes

- This module is focused on inference only. Training code is not included here.
- The server runs inference on CPU by default (the `torch.load(..., map_location="cpu")`
  call is used). Modify `model_server.py` if you need GPU support and have compatible CUDA.


