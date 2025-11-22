from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
# from sqlalchemy.orm import Session

# Import layers
from app.repository.plant_data_repository import PlantDataRepository
from app.repository.user_plant_repository import UserPlantRepository
from app.service.plant_data_service import PlantDataService
from app.service.user_plant_service import UserPlantService
from app.controller.plant_data_controller import PlantDataController
from app.controller.user_plant_controller import UserPlantController
from app.controller.vision_controller import VisionController
from app.controller.plant_classification_controller import router as classification_router
from app.service.plant_classification_service import initialize_model

# Create FastAPI app
app = FastAPI(
    title="IkigotchiGarden API", 
    version="1.0.0", 
    description="Plant care companion API with Supabase PostgreSQL backend"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# def get_plant_data_controller(db: Session = Depends(get_db)) -> PlantDataController:
#     plant_data_repo = PlantDataRepository()
#     plant_data_repo.set_db_session(db)
#     plant_data_service = PlantDataService(plant_data_repo)
#     return PlantDataController(plant_data_service)
#
# def get_user_plant_controller(db: Session = Depends(get_db)) -> UserPlantController:
#     user_plant_repo = UserPlantRepository()
#     user_plant_repo.set_db_session(db)
#     user_plant_service = UserPlantService(user_plant_repo)
#     plant_data_controller = PlantDataController(plant_data_service)
#     user_plant_controller = UserPlantController(user_plant_service)
#     return plant_data_controller, user_plant_controller

# Only register the classification router for now. Database-backed routers are disabled.
app.include_router(classification_router)

# Initialize ML model on startup
@app.on_event("startup")
async def startup_event():
    print("[App] Initializing plant classification model...")
    initialize_model()
    print("[App] Model initialization complete")

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "IkigotchiGarden API - Plant care companion with Supabase",
        "version": "1.0.0",
        "documentation": "/docs",
        "database": "Supabase PostgreSQL"
    }

# Health check
@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0", "database": "connected"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)