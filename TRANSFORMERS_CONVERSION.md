# Converting ONNX Model to Transformers.js Format

This guide explains how to convert your ONNX Vision Transformer model for use with Transformers.js.

## Prerequisites

You'll need to do this conversion in your model training environment (where you have the original model).

```bash
pip install optimum[exporters]
pip install onnx onnxruntime
```

## Conversion Steps

### Step 1: Export to Transformers.js Compatible Format

Since your model is already in ONNX format, we need to convert it to the format Transformers.js expects:

```bash
# Navigate to your ViT package directory
cd "ViT package"

# Convert using optimum-cli
python -m optimum.exporters.onnx \
    --model model_fp16.onnx \
    --task image-classification \
    transformers_js_model/
```

**Alternative: Manual Conversion**

If the above doesn't work (custom ViT architecture), use this Python script:

```python
# convert_to_transformers_js.py
import json
import shutil
import os
from pathlib import Path

# Create output directory
output_dir = "transformers_js_model"
os.makedirs(output_dir, exist_ok=True)

# Copy ONNX model
shutil.copy("model_fp16.onnx", f"{output_dir}/model.onnx")

# Load label mapping
with open("label_mapping.json", "r") as f:
    label_data = json.load(f)

genus_to_id = label_data["genus_to_id"]
id_to_label = {str(v): k for k, v in genus_to_id.items()}

# Create config.json for Transformers.js
config = {
    "model_type": "vit",
    "architectures": ["ViTForImageClassification"],
    "image_size": 224,
    "num_channels": 3,
    "patch_size": 16,
    "num_labels": 500,
    "id2label": id_to_label,
    "label2id": genus_to_id,
    "hidden_size": 384,  # ViT-Small hidden size
    "num_hidden_layers": 12,  # ViT-Small layers
    "num_attention_heads": 6,  # ViT-Small heads
    "intermediate_size": 1536,
    "hidden_act": "gelu",
    "hidden_dropout_prob": 0.0,
    "attention_probs_dropout_prob": 0.0,
    "initializer_range": 0.02,
    "layer_norm_eps": 1e-12,
    "qkv_bias": True
}

with open(f"{output_dir}/config.json", "w") as f:
    json.dump(config, f, indent=2)

# Create preprocessor config
preprocessor_config = {
    "do_normalize": True,
    "do_resize": True,
    "image_mean": [0.485, 0.456, 0.406],
    "image_std": [0.229, 0.224, 0.225],
    "resample": 2,  # PIL.Image.BILINEAR
    "size": {"height": 224, "width": 224}
}

with open(f"{output_dir}/preprocessor_config.json", "w") as f:
    json.dump(preprocessor_config, f, indent=2)

print(f"✓ Model converted to {output_dir}/")
print(f"✓ Files created:")
print(f"  - model.onnx")
print(f"  - config.json")
print(f"  - preprocessor_config.json")
```

Run the conversion:
```bash
python convert_to_transformers_js.py
```

### Step 2: Verify Conversion

Test that the converted model works:

```python
# test_conversion.py
from transformers import AutoModelForImageClassification, AutoFeatureExtractor
from PIL import Image
import requests

# Test loading
model = AutoModelForImageClassification.from_pretrained(
    "./transformers_js_model",
    trust_remote_code=True
)

feature_extractor = AutoFeatureExtractor.from_pretrained(
    "./transformers_js_model"
)

print("✓ Model loaded successfully!")
print(f"✓ Number of labels: {len(model.config.id2label)}")
print(f"✓ Sample labels: {list(model.config.id2label.values())[:5]}")
```

### Step 3: Prepare for React Native

The `transformers_js_model/` directory should contain:
- `model.onnx` - The ONNX model
- `config.json` - Model configuration
- `preprocessor_config.json` - Image preprocessing settings

### Step 4: Hosting Options

You have two options for making the model available to your app:

**Option A: Bundle with App (Not Recommended - 42 MB)**
```
assets/
  models/
    transformers_js_model/
      model.onnx
      config.json
      preprocessor_config.json
```

**Option B: Download from CDN (Recommended)**

Upload the `transformers_js_model/` folder to a hosting service:
- GitHub Releases
- AWS S3
- Firebase Storage
- Your own server

Example structure:
```
https://your-cdn.com/models/plant-genus-vit/
  model.onnx
  config.json
  preprocessor_config.json
```

## Simplified Approach (What We'll Use)

Since Transformers.js has some limitations with custom models, we'll use a hybrid approach:

1. **Use ONNX Runtime Web** (via Transformers.js infrastructure)
2. **Manual preprocessing** (same as backend)
3. **Direct ONNX model loading**

This avoids conversion issues while still enabling on-device inference.

### Files Needed for React Native:

Simply copy these to a CDN or bundle:
- `model_fp16.onnx` (your existing model)
- `label_mapping.json` (your existing labels)

No conversion needed! Transformers.js can load ONNX models directly.

## Next Steps

Once you have the model ready (either converted or using direct ONNX):

1. Upload to a CDN or hosting service
2. Note the URL (e.g., `https://your-cdn.com/models/plant-genus-vit/model_fp16.onnx`)
3. Update the React Native code with the model URL

## Testing

After implementing in React Native, verify:
- ✓ Model downloads successfully
- ✓ Inference produces same results as backend
- ✓ Confidence scores match (within 0.01 tolerance)
- ✓ Inference completes in <5 seconds

## Troubleshooting

**Issue: Model too large (42 MB)**
- Solution: Download on first use, cache locally
- Don't bundle with app

**Issue: Slow download**
- Solution: Use CDN with edge locations
- Show progress indicator

**Issue: Different predictions than backend**
- Solution: Verify preprocessing is identical
- Check normalization values match ImageNet stats

**Issue: Out of memory**
- Solution: Process images at lower resolution first
- Dispose of model after use if needed
