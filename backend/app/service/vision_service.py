"""
Vision service for plant genus detection using ONNX Vision Transformer model.
"""
import onnxruntime as ort
import numpy as np
from PIL import Image
import json
import os
from typing import Optional, Tuple

# Get the path to the models directory
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, "models")
MODEL_PATH = os.path.join(MODELS_DIR, "plant_genus_vit_fp16.onnx")
LABEL_MAPPING_PATH = os.path.join(MODELS_DIR, "label_mapping.json")

# ImageNet normalization constants
IMAGENET_MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
IMAGENET_STD = np.array([0.229, 0.224, 0.225], dtype=np.float32)

class VisionTransformerService:
    """Service for running plant genus detection using Vision Transformer."""

    def __init__(self):
        """Initialize the ONNX runtime session and load label mappings."""
        self.session = None
        self.id_to_genus = {}
        self.genus_to_id = {}
        self._load_model()
        self._load_labels()

    def _load_model(self):
        """Load the ONNX model."""
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(f"Model not found at {MODEL_PATH}")

        print(f"Loading ONNX model from {MODEL_PATH}")
        self.session = ort.InferenceSession(MODEL_PATH)
        print("Model loaded successfully")

    def _load_labels(self):
        """Load the genus-to-ID mapping."""
        if not os.path.exists(LABEL_MAPPING_PATH):
            raise FileNotFoundError(f"Label mapping not found at {LABEL_MAPPING_PATH}")

        with open(LABEL_MAPPING_PATH, 'r') as f:
            data = json.load(f)
            self.genus_to_id = data['genus_to_id']
            # Create reverse mapping (id -> genus)
            self.id_to_genus = {v: k for k, v in self.genus_to_id.items()}

        print(f"Loaded {len(self.genus_to_id)} genus labels")

    def preprocess_image(self, image: Image.Image) -> np.ndarray:
        """
        Preprocess an image for the Vision Transformer model.

        Args:
            image: PIL Image object

        Returns:
            Preprocessed image as numpy array with shape (1, 3, 224, 224)
        """
        # Resize to 224x224
        image = image.convert('RGB').resize((224, 224), Image.BILINEAR)

        # Convert to numpy array and normalize to [0, 1]
        img_array = np.array(image, dtype=np.float32) / 255.0

        # Standardize using ImageNet statistics
        # img_array shape: (224, 224, 3)
        img_array = (img_array - IMAGENET_MEAN) / IMAGENET_STD

        # Transpose to NCHW format: (3, 224, 224)
        img_array = img_array.transpose(2, 0, 1)

        # Add batch dimension: (1, 3, 224, 224)
        img_array = np.expand_dims(img_array, axis=0)

        return img_array

    def predict(self, image: Image.Image, confidence_threshold: float = 0.4) -> Optional[Tuple[str, float]]:
        """
        Predict the plant genus from an image.

        Args:
            image: PIL Image object
            confidence_threshold: Minimum confidence required to return a prediction

        Returns:
            Tuple of (genus_name, confidence) if confidence >= threshold, otherwise None
        """
        # Preprocess the image
        input_data = self.preprocess_image(image)

        # Run inference
        outputs = self.session.run(None, {'input': input_data})
        probabilities = outputs[0][0]  # Shape: (500,)

        # Get the predicted class and confidence
        predicted_id = int(np.argmax(probabilities))
        confidence = float(probabilities[predicted_id])

        # Check if confidence meets threshold
        if confidence < confidence_threshold:
            return None

        # Get the genus name
        genus_name = self.id_to_genus.get(predicted_id, f"Unknown_{predicted_id}")

        return (genus_name, confidence)

# Global instance of the service (loaded once at startup)
_vision_service: Optional[VisionTransformerService] = None

def get_vision_service() -> VisionTransformerService:
    """Get or create the global vision service instance."""
    global _vision_service
    if _vision_service is None:
        _vision_service = VisionTransformerService()
    return _vision_service
