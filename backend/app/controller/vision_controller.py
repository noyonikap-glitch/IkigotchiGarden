"""
Vision controller for plant genus detection endpoints.
"""
from fastapi import APIRouter, File, UploadFile, HTTPException
from PIL import Image
import io
from app.service.vision_service import get_vision_service

class VisionController:
    """Controller for vision/AI-related endpoints."""

    def __init__(self):
        """Initialize the vision controller."""
        self.router = APIRouter(prefix="/api/vision", tags=["vision"])
        self._register_routes()

    def _register_routes(self):
        """Register all vision-related routes."""

        @self.router.post("/detect-genus")
        async def detect_genus(file: UploadFile = File(...)):
            """
            Detect plant genus from an uploaded image.

            Args:
                file: Uploaded image file

            Returns:
                {
                    "genus": str | null,
                    "confidence": float | null,
                    "message": str
                }
            """
            try:
                # Validate file type
                if not file.content_type or not file.content_type.startswith('image/'):
                    raise HTTPException(status_code=400, detail="File must be an image")

                # Read the image file
                contents = await file.read()
                image = Image.open(io.BytesIO(contents))

                # Get the vision service
                vision_service = get_vision_service()

                # Run inference with 0.4 confidence threshold
                result = vision_service.predict(image, confidence_threshold=0.4)

                if result is None:
                    return {
                        "genus": None,
                        "confidence": None,
                        "message": "No genus detected with sufficient confidence"
                    }

                genus, confidence = result
                return {
                    "genus": genus,
                    "confidence": round(confidence, 4),
                    "message": f"Detected genus: {genus} with {confidence*100:.2f}% confidence"
                }

            except Exception as e:
                print(f"Error during genus detection: {str(e)}")
                raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")
