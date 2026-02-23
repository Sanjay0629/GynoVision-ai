"""Quick test script for model loading and prediction."""
import pathlib
import platform
import sys
import traceback

# Patches
if platform.system() == "Windows":
    pathlib.PosixPath = pathlib.WindowsPath

try:
    print("1/4  Attempting FastAI import...", flush=True)
    from fastai.vision.all import load_learner, PILImage
    print("2/4  FastAI imported", flush=True)
except Exception:
    print("IMPORT ERROR:", flush=True)
    traceback.print_exc()
    sys.exit(1)

model_path = pathlib.Path(r"D:\gyno-vision-ai\backend\cervical-cancer-resnet50-model\models\export.pkl")
print(f"     Model file exists: {model_path.exists()}", flush=True)

try:
    learn = load_learner(model_path)
    print(f"3/4  Model loaded! Classes: {learn.dls.vocab}", flush=True)
except Exception as e:
    print(f"LOAD ERROR: {e}", flush=True)
    traceback.print_exc()
    sys.exit(1)

test_img_path = pathlib.Path(r"D:\gyno-vision-ai\backend\cervical-cancer-resnet50-model\models\test\Dyskeratotic\001_03.bmp")
try:
    img = PILImage.create(test_img_path)
    pred, pred_idx, probs = learn.predict(img)
    print(f"4/4  Prediction: {pred}  (confidence: {float(probs[pred_idx]):.4f})", flush=True)
    for i, cls in enumerate(learn.dls.vocab):
        print(f"     {cls}: {float(probs[i]):.4f}", flush=True)
    print("\n===  ALL TESTS PASSED  ===", flush=True)
except Exception as e:
    print(f"PREDICT ERROR: {e}", flush=True)
    traceback.print_exc()
    sys.exit(1)
