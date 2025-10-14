from typing import List, Optional
from fastapi import HTTPException
from app.model import PlantData
from app.repository.plant_data_repository import PlantDataRepository
from app.dto import PlantDataDto, PlantDataCreateDto, PlantDataUpdateDto

class PlantDataService:
    def __init__(self, repository: PlantDataRepository):
        self.repository = repository

    def get_all_plants(self) -> List[PlantDataDto]:
        plants = self.repository.find_all()
        return [self._to_dto(plant) for plant in plants]

    def get_plant_by_id(self, plant_id: str) -> PlantDataDto:
        plant = self.repository.find_by_id(plant_id)
        if not plant:
            raise HTTPException(status_code=404, detail="Plant not found")
        return self._to_dto(plant)

    def search_plant_by_name(self, name: str) -> PlantDataDto:
        plant = self.repository.find_by_name(name)
        if not plant:
            raise HTTPException(status_code=404, detail=f"Plant with name '{name}' not found")
        return self._to_dto(plant)

    def create_plant(self, create_dto: PlantDataCreateDto) -> PlantDataDto:
        plant_id = self.repository.generate_id()
        plant = PlantData(
            id=plant_id,
            name=create_dto.name,
            scientific_name=create_dto.scientific_name,
            fun_fact=create_dto.fun_fact,
            watering_period_days=create_dto.watering_period_days
        )
        saved_plant = self.repository.save(plant)
        return self._to_dto(saved_plant)

    def update_plant(self, plant_id: str, update_dto: PlantDataUpdateDto) -> PlantDataDto:
        existing_plant = self.repository.find_by_id(plant_id)
        if not existing_plant:
            raise HTTPException(status_code=404, detail="Plant not found")

        # Update fields if provided
        if update_dto.name is not None:
            existing_plant.name = update_dto.name
        if update_dto.scientific_name is not None:
            existing_plant.scientific_name = update_dto.scientific_name
        if update_dto.fun_fact is not None:
            existing_plant.fun_fact = update_dto.fun_fact
        if update_dto.watering_period_days is not None:
            existing_plant.watering_period_days = update_dto.watering_period_days

        updated_plant = self.repository.save(existing_plant)
        return self._to_dto(updated_plant)

    def delete_plant(self, plant_id: str) -> dict:
        existing_plant = self.repository.find_by_id(plant_id)
        if not existing_plant:
            raise HTTPException(status_code=404, detail="Plant not found")

        deleted = self.repository.delete_by_id(plant_id)
        if not deleted:
            raise HTTPException(status_code=500, detail="Failed to delete plant")

        return {"message": f"Plant '{existing_plant.name}' deleted successfully"}

    def _to_dto(self, plant: PlantData) -> PlantDataDto:
        return PlantDataDto(
            id=plant.id,
            name=plant.name,
            scientific_name=plant.scientific_name,
            fun_fact=plant.fun_fact,
            watering_period_days=plant.watering_period_days
        )