# Plant Classification API - Setup & Testing

## Backend Setup

### 1. Install Python Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Verify Model Files
Make sure these files exist in `backend/models/`:
- `model_fp16.onnx` (43MB ONNX FP16 model)
- `label_mapping.json` (genus name mappings)
- `confidence_threshold_results.json` (per-class thresholds)

### 3. Start the Backend Server
```bash
# From backend directory
python main.py

# Or using uvicorn directly
uvicorn main:app --host 0.0.0.0 --port 3001 --reload
```

The API will be available at: `http://localhost:3001`

## API Endpoints

### Health Check
```bash
GET http://localhost:3001/health
```

### Model Info
```bash
GET http://localhost:3001/api/classify/model-info
```

### Classify Plant
```bash
POST http://localhost:3001/api/classify/plant
Content-Type: multipart/form-data
Body: file (image file)
```

## Testing with cURL

```bash
# Test with an image
curl -X POST "http://localhost:3001/api/classify/plant" \
  -F "file=@path/to/your/plant_image.jpg"
```

## Testing with Python

```python
import requests

# Test classification
with open('plant_image.jpg', 'rb') as f:
    files = {'file': f}
    response = requests.post('http://localhost:3001/api/classify/plant', files=files)
    print(response.json())
```

## Response Format

```json
{
  "top_prediction": {
    "genus": "Rosa",
    "confidence": 0.956,
    "confidence_percent": "95.60%",
    "threshold": 0.85,
    "is_confident": true
  },
  "all_predictions": [
    {
      "genus": "Rosa",
      "confidence": 0.956,
      "confidence_percent": "95.60%",
      "threshold": 0.85,
      "is_confident": true
    },
    // ... top 5 predictions
  ],
  "model_type": "ONNX FP16"
}
```

## React Native Integration

The frontend automatically connects to `http://localhost:3001`. 

For production or mobile device testing, update the `API_BASE_URL` in:
- `utils/plantClassificationService.js`

Example for network access:
```javascript
const API_BASE_URL = 'http://192.168.1.100:3001'; // Your computer's IP
```

## Troubleshooting

### Backend won't start
- Check Python version (3.8+)
- Verify all dependencies installed
- Check port 3001 is not in use

### Model not found
- Verify model files in `backend/models/`
- Check file paths in `plant_classification_service.py`

### Classification errors
- Check image format (JPEG, PNG supported)
- Verify image is clear and contains a plant
- Check backend logs for detailed errors

### React Native can't connect
- Ensure backend is running
- Update API_BASE_URL with correct IP/port
- Check firewall settings
- For Expo: use computer's network IP, not localhost
