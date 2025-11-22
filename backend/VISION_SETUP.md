# Vision Transformer Setup Guide

This guide explains how to set up and use the Vision Transformer model for plant genus detection.

## Model Information

- **Model**: Vision Transformer Small (ViT-Small)
- **Input Size**: 224x224 RGB images
- **Output**: 500 plant genera
- **Accuracy**: ~86% top-1, ~95% top-5
- **Format**: ONNX FP16 (42 MB)
- **Confidence Threshold**: 0.4 (40%)

## Setup Instructions

### 1. Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

This will install:
- `onnxruntime==1.16.3` - For running ONNX models
- `numpy==1.24.3` - For array operations
- `Pillow==10.1.0` - For image processing

### 2. Verify Model Files

Ensure these files exist in `backend/models/`:
- `plant_genus_vit_fp16.onnx` - The FP16 quantized model (42 MB)
- `label_mapping.json` - Genus name to ID mapping (500 classes)

### 3. Start the Backend Server

```bash
cd backend
python main.py
```

The server will start on `http://localhost:3001`

### 4. Configure Frontend

The frontend is already configured to use `http://localhost:3001` in `utils/visionService.js`.

If your backend is running on a different host/port, update the `API_URL` constant:

```javascript
const API_URL = 'http://your-backend-url:port';
```

## API Endpoint

### POST /api/vision/detect-genus

Upload an image to detect plant genus.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: Form data with `file` field containing the image

**Response:**
```json
{
  "genus": "Quercus",
  "confidence": 0.8542,
  "message": "Detected genus: Quercus with 85.42% confidence"
}
```

Or if confidence < 0.4:
```json
{
  "genus": null,
  "confidence": null,
  "message": "No genus detected with sufficient confidence"
}
```

## How It Works

1. **Frontend** (`utils/visionService.js`):
   - User selects an image in the app
   - Image is sent to backend API via FormData

2. **Backend** (`app/service/vision_service.py`):
   - Image is preprocessed (resize to 224x224, normalize with ImageNet stats)
   - ONNX model runs inference
   - Returns genus name if confidence >= 0.4

3. **Frontend** (`screens/EditPlantScreen.js`):
   - Displays result or handles mismatch logic
   - Updates plant genus in storage

## Image Preprocessing

The model expects images to be preprocessed as follows:
1. Resize to 224x224 pixels
2. Convert to RGB (3 channels)
3. Normalize to [0, 1] by dividing by 255
4. Standardize using ImageNet statistics:
   - Mean: [0.485, 0.456, 0.406]
   - Std: [0.229, 0.224, 0.225]
5. Transpose to NCHW format: (batch, channels, height, width)

This is automatically handled by the `VisionTransformerService` class.

## Confidence Threshold

The confidence threshold is set to **0.4 (40%)** to balance between:
- **Precision**: Avoiding false positives
- **Recall**: Detecting enough plants

You can adjust this in `app/controller/vision_controller.py`:

```python
result = vision_service.predict(image, confidence_threshold=0.4)
```

## Testing

To test the endpoint using curl:

```bash
curl -X POST http://localhost:3001/api/vision/detect-genus \
  -F "file=@path/to/plant_image.jpg"
```

Or visit the auto-generated API docs at: `http://localhost:3001/docs`

## Troubleshooting

### Model Not Found Error
- Ensure `plant_genus_vit_fp16.onnx` exists in `backend/models/`
- Check file permissions

### Low Confidence / No Detection
- Try images with better lighting and focus
- Ensure the plant is clearly visible in the image
- The model works best with leaf/flower close-ups

### API Connection Error (Frontend)
- Verify backend is running on localhost:3001
- Check that CORS is properly configured
- Update API_URL in `utils/visionService.js` if needed

## Model Details

The model was trained on 500 plant genera from the PlantCLEF dataset and fine-tuned from:
- Base: Vision Transformer Small (ViT-Small/16-224)
- Pretrained: ImageNet-21k → ImageNet-1k
- Fine-tuned: Plant genera classification

See `ViT package/README_ONNX.md` for more details about the model.
