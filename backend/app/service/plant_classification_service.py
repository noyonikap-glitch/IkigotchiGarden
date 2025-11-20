"""
Plant classification service using ONNX FP16 model
"""
import numpy as np
import cv2 as cv
import json
import os
from pathlib import Path
import onnxruntime as ort

# Global variables for model session and mappings
_session = None
_label_mapping = None
_confidence_thresholds = None

MODEL_DIR = Path(__file__).parent.parent.parent / "models"
MODEL_PATH = MODEL_DIR / "model_fp32.onnx"  
LABEL_MAPPING_PATH = MODEL_DIR / "label_mapping.json"
CONFIDENCE_THRESHOLDS_PATH = MODEL_DIR / "confidence_threshold_results.json"


def initialize_model():
    """Initialize the ONNX model and load label mappings"""
    global _session, _label_mapping, _confidence_thresholds
    
    if _session is not None:
        print("[PlantClassifier] Model already initialized")
        return
    
    print("[PlantClassifier] Initializing model...")
    
    # Load ONNX model
    _session = ort.InferenceSession(str(MODEL_PATH))
    print(f"[PlantClassifier] Model loaded from {MODEL_PATH}")
    
    # Load label mapping
    with open(LABEL_MAPPING_PATH, 'r') as f:
        _label_mapping = json.load(f)
    
    # Load confidence thresholds
    with open(CONFIDENCE_THRESHOLDS_PATH, 'r') as f:
        _confidence_thresholds = json.load(f)
    
    print(f"[PlantClassifier] Loaded {len(_label_mapping.get('genus_to_id', {}))} plant classes")
    print("[PlantClassifier] Model ready for inference")


def preprocess_image(image_bytes):
    """
    Preprocess image for model input
    
    Args:
        image_bytes: Raw image bytes
        
    Returns:
        Preprocessed numpy array ready for inference
    """
    # Decode image from bytes
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv.imdecode(nparr, cv.IMREAD_COLOR)
    img = cv.cvtColor(img, cv.COLOR_BGR2RGB)
    
    # Resize to 224x224
    img_resize = cv.resize(img, (224, 224))
    
    # Convert to array and normalize
    img_array = np.array(img_resize)
    img_array = img_array / 255.0  # Convert RGB to 0-1 range
    img_array = np.transpose(img_array, (2, 0, 1))  # Convert to (3, 224, 224)
    
    # Add batch dimension
    img_input = np.expand_dims(img_array, axis=0)
    img_input = img_input.astype('float32')
    
    return img_input


def softmax(x):
    """Apply softmax to convert logits to probabilities"""
    exp_x = np.exp(x - np.max(x))  # Subtract max for numerical stability
    return exp_x / exp_x.sum()


def classify_plant(image_bytes, top_k=5):
    """
    Classify plant species from image bytes
    
    Args:
        image_bytes: Raw image bytes
        top_k: Number of top predictions to return
        
    Returns:
        Dictionary with classification results
    """
    if _session is None:
        raise RuntimeError("Model not initialized. Call initialize_model() first.")
    
    # Preprocess image
    img_input = preprocess_image(image_bytes)
    
    # Run inference
    input_name = _session.get_inputs()[0].name
    input_data = {input_name: img_input}
    output = _session.run(None, input_data)
    
    # Get logits and convert to probabilities
    logits = output[0][0]
    probabilities = softmax(logits)
    
    # Create reverse mapping (id to genus name)
    id_to_genus = {v: k for k, v in _label_mapping['genus_to_id'].items()}
    
    # Get top predictions
    top_indices = np.argsort(probabilities)[-top_k:][::-1]
    
    predictions = []
    for idx in top_indices:
        genus_name = id_to_genus[idx]
        confidence = float(probabilities[idx])
        threshold = _confidence_thresholds.get(genus_name, 0.5)
        
        predictions.append({
            "genus": genus_name,
            "confidence": confidence,
            "confidence_percent": f"{confidence * 100:.2f}%",
            "threshold": threshold,
            "is_confident": confidence >= threshold
        })
    
    return {
        "top_prediction": predictions[0],
        "all_predictions": predictions,
        "model_type": "ONNX FP32"
    }


def get_model_info():
    """Get information about the loaded model"""
    if _session is None:
        return {"status": "not_initialized"}
    
    return {
        "status": "ready",
        "model_path": str(MODEL_PATH),
        "num_classes": len(_label_mapping.get('genus_to_id', {})),
        "input_shape": [i.shape for i in _session.get_inputs()],
        "output_shape": [o.shape for o in _session.get_outputs()],
        "model_type": "ONNX FP32"
    }
