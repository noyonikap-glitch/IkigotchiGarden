from fastapi import APIRouter, Query, Depends, HTTPException
from typing import List
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import PlantData
from app.service.plant_data_service import PlantDataService
from app.repository.plant_data_repository import PlantDataRepository

class PlantDataController:
    def __init__(self, service: PlantDataService = None):
        self.router = APIRouter(prefix="/api/plants", tags=["Plant Database"])
        self._setup_routes()

    def _setup_routes(self):
        @self.router.get("/", response_model=List[dict])
        async def get_all_plants(db: Session = Depends(get_db)):
            """Get all plants from the database"""
            try:
                repo = PlantDataRepository()
                repo.set_db_session(db)
                service = PlantDataService(repo)
                plants = service.get_all_plants()
                return [self._plant_to_dict(plant) for plant in plants]
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

        @self.router.get("/search", response_model=List[dict])
        async def search_plant_by_name(name: str = Query(..., description="Plant name to search for"), db: Session = Depends(get_db)):
            """Search for a plant by name (case-insensitive partial match)"""
            try:
                repo = PlantDataRepository()
                repo.set_db_session(db)
                service = PlantDataService(repo)
                plants = service.search_plant_by_name(name)
                return [self._plant_to_dict(plant) for plant in plants]
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

        @self.router.get("/{plant_id}", response_model=dict)
        async def get_plant_by_id(plant_id: int, db: Session = Depends(get_db)):
            """Get a specific plant by ID"""
            try:
                repo = PlantDataRepository()
                repo.set_db_session(db)
                service = PlantDataService(repo)
                plant = service.get_plant_by_id(plant_id)
                if not plant:
                    raise HTTPException(status_code=404, detail="Plant not found")
                return self._plant_to_dict(plant)
            except HTTPException:
                raise
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    def _plant_to_dict(self, plant: PlantData) -> dict:
        """Convert SQLAlchemy model to dictionary"""
        return {
            "id": plant.id,
            "name": plant.name,
            "scientific_name": plant.scientific_name,
            "description": plant.description,
            "care_instructions": plant.care_instructions,
            "watering_frequency_days": plant.watering_frequency_days,
            "sunlight_requirement": plant.sunlight_requirement,
            "difficulty_level": plant.difficulty_level,
            "image_url": plant.image_url,
            "created_at": plant.created_at.isoformat() if plant.created_at else None,
            "updated_at": plant.updated_at.isoformat() if plant.updated_at else None
        }