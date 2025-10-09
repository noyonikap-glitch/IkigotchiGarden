from fastapi import APIRouter, Query
from typing import List
from app.dto import PlantDataDto, PlantDataCreateDto, PlantDataUpdateDto
from app.service.plant_data_service import PlantDataService

class PlantDataController:
    def __init__(self, service: PlantDataService):
        self.service = service
        self.router = APIRouter(prefix="/api/plants", tags=["Plant Database"])
        self._setup_routes()

    def _setup_routes(self):
        @self.router.get("/", response_model=List[PlantDataDto])
        async def get_all_plants():
            """Get all plants from the database"""
            return self.service.get_all_plants()

        @self.router.get("/search", response_model=PlantDataDto)
        async def search_plant_by_name(name: str = Query(..., description="Plant name to search for")):
            """Search for a plant by name (case-insensitive partial match)"""
            return self.service.search_plant_by_name(name)

        @self.router.get("/find/{plant_name}", response_model=PlantDataDto)
        async def find_plant_by_name_path(plant_name: str):
            """Alternative search endpoint using path parameter"""
            return self.service.search_plant_by_name(plant_name)

        @self.router.get("/{plant_id}", response_model=PlantDataDto)
        async def get_plant_by_id(plant_id: str):
            """Get a specific plant by ID"""
            return self.service.get_plant_by_id(plant_id)

        @self.router.post("/", response_model=PlantDataDto)
        async def create_plant(plant: PlantDataCreateDto):
            """Create a new plant in the database"""
            return self.service.create_plant(plant)

        @self.router.put("/{plant_id}", response_model=PlantDataDto)
        async def update_plant(plant_id: str, plant_update: PlantDataUpdateDto):
            """Update a plant in the database"""
            return self.service.update_plant(plant_id, plant_update)

        @self.router.delete("/{plant_id}")
        async def delete_plant(plant_id: str):
            """Delete a plant from the database"""
            return self.service.delete_plant(plant_id)

        @self.router.get("/debug/all")
        async def debug_plants():
            """Debug endpoint to see all plants"""
            plants = self.service.get_all_plants()
            return {"plants": plants, "count": len(plants)}