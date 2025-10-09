from typing import List, Optional
from app.model import UserPlant

class UserPlantRepository:
    def __init__(self):
        # Mock data - in production this would connect to a database
        self._user_plants = []

    def find_all(self) -> List[UserPlant]:
        return self._user_plants

    def find_by_id(self, plant_id: str) -> Optional[UserPlant]:
        return next((p for p in self._user_plants if p.id == plant_id), None)

    def save(self, plant: UserPlant) -> UserPlant:
        # Remove existing plant with same ID if exists
        self._user_plants = [p for p in self._user_plants if p.id != plant.id]
        self._user_plants.append(plant)
        return plant

    def delete_by_id(self, plant_id: str) -> bool:
        initial_length = len(self._user_plants)
        self._user_plants = [p for p in self._user_plants if p.id != plant_id]
        return len(self._user_plants) < initial_length

    def generate_id(self) -> str:
        return str(len(self._user_plants) + 1)