# ONNX Model Files

This directory contains ONNX versions of the trained Vision Transformer model for mobile deployment.

## Model Files

### model_fp16.onnx (RECOMMENDED for mobile)
- **Size**: 42 MB
- **Precision**: FP16 (half precision)
- **Use case**: Mobile deployment (iOS, Android)
- **Advantages**: 50% smaller size, faster inference on mobile GPUs
- **Accuracy**: ~86% top-1, ~95% top-5 (minimal loss vs FP32)

### model_fp32.onnx
- **Size**: 84 MB
- **Precision**: FP32 (full precision)
- **Use case**: Server deployment or if FP16 is not supported
- **Advantages**: Highest accuracy, full precision
- **Accuracy**: 86.08% top-1, 94.74% top-5

## Model Details

- **Architecture**: Vision Transformer Small (ViT-Small)
- **Input**: 224x224 RGB images
- **Output**: 500 class probabilities (plant genera)
- **Pretrained**: ImageNet-21k → ImageNet-1k → Plant genera
- **ONNX Opset**: Version 14

## Using the ONNX Models

### Python (onnxruntime)

```python
import onnxruntime as ort
import numpy as np
from PIL import Image

# Load model
session = ort.InferenceSession("model_fp16.onnx")

# Prepare image (224x224, normalized)
img = Image.open("plant.jpg").convert("RGB").resize((224, 224))
img_array = np.array(img).transpose(2, 0, 1).astype(np.float32) / 255.0
img_array = (img_array - np.array([0.485, 0.456, 0.406]).reshape(3, 1, 1)) / np.array([0.229, 0.224, 0.225]).reshape(3, 1, 1)
img_array = np.expand_dims(img_array, axis=0)

# Run inference
outputs = session.run(None, {'input': img_array})
probabilities = outputs[0]

# Get top prediction
predicted_class = np.argmax(probabilities)
confidence = probabilities[0][predicted_class]
```

### iOS (Core ML)

Convert ONNX to Core ML format:

```bash
pip install onnx-coreml
python -c "import onnx; from onnx_coreml import convert; model = onnx.load('model_fp16.onnx'); coreml_model = convert(model); coreml_model.save('PlantGenus.mlmodel')"
```

### Android (TensorFlow Lite)

Convert ONNX to TFLite:

```bash
pip install onnx-tf tensorflow
python -c "import onnx; from onnx_tf.backend import prepare; onnx_model = onnx.load('model_fp16.onnx'); tf_rep = prepare(onnx_model); tf_rep.export_graph('model.pb')"
# Then use TensorFlow's converter to create .tflite file
```

## Image Preprocessing

Input images must be preprocessed as follows:

1. **Resize** to 224x224 pixels
2. **Convert** to RGB (3 channels)

3. **Normalize** pixel values to [0, 1] by dividing by 255  
// you dont need to do 3 if you are going to do 4 right after

4. **Standardize** using ImageNet statistics:
   - Mean: [0.485, 0.456, 0.406]
   - Std: [0.229, 0.224, 0.225]
5. **Transpose** to NCHW format: (batch, channels, height, width)

## Metadata

See `onnx_conversion_info.json` for:
- Original training configuration
- Checkpoint used for conversion
- Model specifications

## Class Labels

The model outputs probabilities for 500 plant genera. To map the output indices to genus names, you'll need the `genus_to_id` mapping from the training dataset.

## Notes

- The FP16 model may show slight numerical differences from FP32 (typically < 0.1% accuracy difference)
- Some ONNX runtimes may automatically upcast FP16 to FP32 for operations not supported in FP16
- For production deployment, always validate accuracy on your target device/runtime
