"""
Plant classification controller
"""
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from ..service.plant_classification_service import classify_plant, get_model_info, initialize_model

router = APIRouter(prefix="/api/classify", tags=["classification"])


@router.post("/plant")
async def classify_plant_image(file: UploadFile = File(...)):
    """
    Classify a plant from an uploaded image
    
    Args:
        file: Image file (JPEG, PNG, etc.)
        
    Returns:
        Classification results with top predictions
    """
    try:
        # Read image bytes
        image_bytes = await file.read()
        
        # Classify
        result = classify_plant(image_bytes)
        
        return JSONResponse(content=result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/model-info")
async def model_info():
    """Get information about the loaded model"""
    return get_model_info()


@router.post("/initialize")
async def initialize():
    """Initialize the model (called on startup)"""
    try:
        initialize_model()
        return {"status": "success", "message": "Model initialized"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
