from fastapi import APIRouter
from typing import List
from app.dto import UserPlantDto, UserPlantCreateDto, UserPlantUpdateDto
from app.service.user_plant_service import UserPlantService

class UserPlantController:
    def __init__(self, service: UserPlantService):
        self.service = service
        self.router = APIRouter(prefix="/api/user-plants", tags=["User Plants"])
        self._setup_routes()

    def _setup_routes(self):
        @self.router.get("/", response_model=List[UserPlantDto])
        async def get_all_user_plants():
            """Get all user plants"""
            return self.service.get_all_user_plants()

        @self.router.get("/{plant_id}", response_model=UserPlantDto)
        async def get_user_plant_by_id(plant_id: str):
            """Get a specific user plant by ID"""
            return self.service.get_user_plant_by_id(plant_id)

        @self.router.post("/", response_model=UserPlantDto)
        async def create_user_plant(plant: UserPlantCreateDto):
            """Create a new user plant"""
            return self.service.create_user_plant(plant)

        @self.router.put("/{plant_id}", response_model=UserPlantDto)
        async def update_user_plant(plant_id: str, plant_update: UserPlantUpdateDto):
            """Update a user plant"""
            return self.service.update_user_plant(plant_id, plant_update)

        @self.router.delete("/{plant_id}")
        async def delete_user_plant(plant_id: str):
            """Delete a user plant"""
            return self.service.delete_user_plant(plant_id)