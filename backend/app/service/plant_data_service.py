from typing import List, Optional
from fastapi import HTTPException
from app.models import PlantData
from app.repository.plant_data_repository import PlantDataRepository

class PlantDataService:
    def __init__(self, repository: PlantDataRepository):
        self.repository = repository

    def get_all_plants(self) -> List[PlantData]:
        """Get all plants from repository"""
        return self.repository.find_all()

    def get_plant_by_id(self, plant_id: int) -> Optional[PlantData]:
        """Get a plant by ID"""
        return self.repository.find_by_id(plant_id)

    def search_plant_by_name(self, name: str) -> List[PlantData]:
        """Search plants by name"""
        return self.repository.find_by_name(name)

    def create_plant(self, plant_data: dict) -> PlantData:
        """Create a new plant"""
        plant = PlantData(
            name=plant_data.get('name'),
            scientific_name=plant_data.get('scientific_name'),
            description=plant_data.get('description'),
            care_instructions=plant_data.get('care_instructions'),
            watering_frequency_days=plant_data.get('watering_frequency_days'),
            sunlight_requirement=plant_data.get('sunlight_requirement'),
            difficulty_level=plant_data.get('difficulty_level'),
            image_url=plant_data.get('image_url')
        )
        return self.repository.save(plant)

    def update_plant(self, plant_id: int, update_data: dict) -> Optional[PlantData]:
        """Update a plant"""
        return self.repository.update(plant_id, update_data)

    def delete_plant(self, plant_id: int) -> bool:
        """Delete a plant"""
        return self.repository.delete_by_id(plant_id)