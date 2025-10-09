from typing import List, Optional
from app.model import PlantData

class PlantDataRepository:
    def __init__(self):
        # Mock data - in production this would connect to a database
        self._plants = [
            PlantData("1", "snake plant", "Sansevieria trifasciata",
                     "Snake plants can survive in very low light and can go weeks without water. They're also known to purify air by removing toxins.", 7),
            PlantData("2", "monstera", "Monstera deliciosa",
                     "Monstera leaves develop their characteristic holes (fenestrations) as they mature. In the wild, they can grow up to 60 feet tall!", 4),
            PlantData("3", "fiddle leaf fig", "Ficus lyrata",
                     "Fiddle leaf figs are native to western Africa and can grow up to 50 feet tall in their natural habitat. They're quite dramatic and will drop leaves if they're unhappy!", 5),
            PlantData("4", "pothos", "Epipremnum aureum",
                     "Pothos are incredibly resilient and can grow in water indefinitely. They're often called 'devil's ivy' because they're nearly impossible to kill!", 6),
            PlantData("5", "peace lily", "Spathiphyllum wallisii",
                     "Peace lilies will dramatically droop their leaves when they need water, making them excellent communicators. They also bloom beautiful white flowers!", 3),
            PlantData("6", "rubber plant", "Ficus elastica",
                     "Rubber plants were once used to make rubber before synthetic alternatives were developed. They can grow into massive trees outdoors!", 5),
            PlantData("7", "spider plant", "Chlorophytum comosum",
                     "Spider plants produce baby plants (spiderettes) that dangle from the mother plant like spiders on a web. They're excellent air purifiers!", 4)
        ]

    def find_all(self) -> List[PlantData]:
        return self._plants

    def find_by_id(self, plant_id: str) -> Optional[PlantData]:
        return next((p for p in self._plants if p.id == plant_id), None)

    def find_by_name(self, name: str) -> Optional[PlantData]:
        name_lower = name.lower()
        return next((p for p in self._plants if name_lower in p.name.lower()), None)

    def save(self, plant: PlantData) -> PlantData:
        # Remove existing plant with same ID if exists
        self._plants = [p for p in self._plants if p.id != plant.id]
        self._plants.append(plant)
        return plant

    def delete_by_id(self, plant_id: str) -> bool:
        initial_length = len(self._plants)
        self._plants = [p for p in self._plants if p.id != plant_id]
        return len(self._plants) < initial_length

    def generate_id(self) -> str:
        return str(len(self._plants) + 1)