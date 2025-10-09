from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

# Import database and models
from app.database import get_db, engine
from app.models import Base

# Import layers
from app.repository.plant_data_repository import PlantDataRepository
from app.repository.user_plant_repository import UserPlantRepository
from app.service.plant_data_service import PlantDataService
from app.service.user_plant_service import UserPlantService
from app.controller.plant_data_controller import PlantDataController
from app.controller.user_plant_controller import UserPlantController

# Create database tables on startup
Base.metadata.create_all(bind=engine)

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

# Dependency injection setup with database session
def get_plant_data_controller(db: Session = Depends(get_db)) -> PlantDataController:
    # Repositories (Data Access Layer)
    plant_data_repo = PlantDataRepository()
    plant_data_repo.set_db_session(db)
    
    # Services (Business Logic Layer)
    plant_data_service = PlantDataService(plant_data_repo)
    
    # Controllers (Presentation Layer)
    return PlantDataController(plant_data_service)

def get_user_plant_controller(db: Session = Depends(get_db)) -> UserPlantController:
    # Repositories (Data Access Layer)
    user_plant_repo = UserPlantRepository()
    user_plant_repo.set_db_session(db)
    
    # Services (Business Logic Layer)
    user_plant_service = UserPlantService(user_plant_repo)
    
    # Controllers (Presentation Layer)
    return UserPlantController(user_plant_service)

# Create a single instance to register routes
temp_plant_controller = PlantDataController(None)  # Just for route registration
temp_user_controller = UserPlantController(None)   # Just for route registration

# Register route blueprints (controllers will be injected per request)
app.include_router(temp_plant_controller.router)
app.include_router(temp_user_controller.router)

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