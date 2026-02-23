"""Debug: full model load and prediction test with exhaustive shims."""
import pathlib, platform, sys, traceback, types

if platform.system() == "Windows":
    pathlib.PosixPath = pathlib.WindowsPath

import torch, pickle

# 1. Apply exhaustive shims
try:
    import plum
    
    def _shim_to_private(public_name, private_name=None):
        if private_name is None:
            private_name = "_" + public_name.split('.')[-1]
        
        full_private = "plum." + private_name if not private_name.startswith("plum.") else private_name
        
        try:
            mod = __import__(full_private, fromlist=['*'])
            sys.modules[public_name] = mod
            # Also set as attribute on plum
            setattr(plum, public_name.split('.')[-1], mod)
            return True
        except ImportError:
            # Create a shim from plum itself if private not found
            shim = types.ModuleType(public_name)
            shim.__dict__.update({k: v for k, v in plum.__dict__.items() if not k.startswith('_')})
            sys.modules[public_name] = shim
            setattr(plum, public_name.split('.')[-1], shim)
            return False

    print("Applying exhaustive shims...")
    _shim_to_private('plum.function', '_function')
    _shim_to_private('plum.resolver', '_resolver')
    _shim_to_private('plum.signature', '_signature')
    _shim_to_private('plum.type', '_type')
    _shim_to_private('plum.method', '_method')
    _shim_to_private('plum.util', '_util')
    _shim_to_private('plum.promotion', '_promotion')
    _shim_to_private('plum.dispatcher', '_dispatcher')

    # Fixup missing classes in plum.type
    import plum.type as pt
    if not hasattr(pt, 'Type'):
        class Type: pass
        pt.Type = Type
        print("Stubbed plum.type.Type")

    print("Shims applied.")
except Exception as e:
    print(f"Error preparing shims: {e}")
    traceback.print_exc()

fname = pathlib.Path(r"D:\gyno-vision-ai\backend\cervical-cancer-resnet50-model\models\export.pkl")

print(f"=== Loading model from {fname} ===", flush=True)
try:
    res = torch.load(fname, map_location="cpu", pickle_module=pickle, weights_only=False)
    print(f"SUCCESS: type={type(res)}", flush=True)
    
    if hasattr(res, 'dls'):
        print(f"  Classes: {res.dls.vocab}", flush=True)
        from fastai.vision.all import PILImage
        test_img = pathlib.Path(r"D:\gyno-vision-ai\backend\cervical-cancer-resnet50-model\models\test\Dyskeratotic\001_03.bmp")
        img = PILImage.create(test_img)
        pred, pred_idx, probs = res.predict(img)
        print(f"PREDICTION: {pred} ({float(probs[pred_idx]):.4f})", flush=True)
        
except Exception as e:
    print(f"LOAD FAILED: {type(e).__name__}: {e}", flush=True)
    traceback.print_exc()

print("\nDONE", flush=True)
