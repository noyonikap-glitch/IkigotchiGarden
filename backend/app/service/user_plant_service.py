from typing import List
from fastapi import HTTPException
from app.model import UserPlant
from app.repository.user_plant_repository import UserPlantRepository
from app.dto import UserPlantDto, UserPlantCreateDto, UserPlantUpdateDto

class UserPlantService:
    def __init__(self, repository: UserPlantRepository):
        self.repository = repository

    def get_all_user_plants(self) -> List[UserPlantDto]:
        plants = self.repository.find_all()
        return [self._to_dto(plant) for plant in plants]

    def get_user_plant_by_id(self, plant_id: str) -> UserPlantDto:
        plant = self.repository.find_by_id(plant_id)
        if not plant:
            raise HTTPException(status_code=404, detail="Plant not found")
        return self._to_dto(plant)

    def create_user_plant(self, create_dto: UserPlantCreateDto) -> UserPlantDto:
        plant_id = self.repository.generate_id()
        plant = UserPlant(id=plant_id, name=create_dto.name)
        saved_plant = self.repository.save(plant)
        return self._to_dto(saved_plant)

    def update_user_plant(self, plant_id: str, update_dto: UserPlantUpdateDto) -> UserPlantDto:
        existing_plant = self.repository.find_by_id(plant_id)
        if not existing_plant:
            raise HTTPException(status_code=404, detail="Plant not found")

        existing_plant.update_name(update_dto.name)
        updated_plant = self.repository.save(existing_plant)
        return self._to_dto(updated_plant)

    def delete_user_plant(self, plant_id: str) -> dict:
        existing_plant = self.repository.find_by_id(plant_id)
        if not existing_plant:
            raise HTTPException(status_code=404, detail="Plant not found")

        deleted = self.repository.delete_by_id(plant_id)
        if not deleted:
            raise HTTPException(status_code=500, detail="Failed to delete plant")

        return {"message": f"Plant '{existing_plant.name}' deleted successfully"}

    def _to_dto(self, plant: UserPlant) -> UserPlantDto:
        return UserPlantDto(
            id=plant.id,
            name=plant.name,
            created_at=plant.created_at,
            updated_at=plant.updated_at
        )