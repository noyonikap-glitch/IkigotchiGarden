from typing import Optional
from datetime import datetime

class PlantData:
    def __init__(self, id: str, name: str, scientific_name: str, fun_fact: str, watering_period_days: int):
        self.id = id
        self.name = name
        self.scientific_name = scientific_name
        self.fun_fact = fun_fact
        self.watering_period_days = watering_period_days

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "scientific_name": self.scientific_name,
            "fun_fact": self.fun_fact,
            "watering_period_days": self.watering_period_days
        }

class UserPlant:
    def __init__(self, id: str, name: str, created_at: str = None, updated_at: str = None):
        self.id = id
        self.name = name
        self.created_at = created_at or datetime.now().isoformat()
        self.updated_at = updated_at or datetime.now().isoformat()

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }

    def update_name(self, name: str):
        self.name = name
        self.updated_at = datetime.now().isoformat()