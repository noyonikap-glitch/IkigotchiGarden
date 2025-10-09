from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import layers
from app.repository.plant_data_repository import PlantDataRepository
from app.repository.user_plant_repository import UserPlantRepository
from app.service.plant_data_service import PlantDataService
from app.service.user_plant_service import UserPlantService
from app.controller.plant_data_controller import PlantDataController
from app.controller.user_plant_controller import UserPlantController

# Create FastAPI app
app = FastAPI(title="IkigotchiGarden API", version="1.0.0", description="Plant care companion API with layered architecture")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency injection setup
def setup_dependencies():
    # Repositories (Data Access Layer)
    plant_data_repo = PlantDataRepository()
    user_plant_repo = UserPlantRepository()
    
    # Services (Business Logic Layer)
    plant_data_service = PlantDataService(plant_data_repo)
    user_plant_service = UserPlantService(user_plant_repo)
    
    # Controllers (API Layer)
    plant_data_controller = PlantDataController(plant_data_service)
    user_plant_controller = UserPlantController(user_plant_service)
    
    return plant_data_controller, user_plant_controller

# Setup and register routers
plant_controller, user_controller = setup_dependencies()
app.include_router(plant_controller.router)
app.include_router(user_controller.router)

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "IkigotchiGarden API - Plant care companion",
        "version": "1.0.0",
        "documentation": "/docs"
    }

# Health check
@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3001)