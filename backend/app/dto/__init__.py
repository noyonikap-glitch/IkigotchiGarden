from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class PlantDataDto(BaseModel):
    id: str
    name: str
    scientific_name: str
    fun_fact: str
    watering_period_days: int

class PlantDataCreateDto(BaseModel):
    name: str
    scientific_name: str
    fun_fact: str
    watering_period_days: int

class PlantDataUpdateDto(BaseModel):
    name: Optional[str] = None
    scientific_name: Optional[str] = None
    fun_fact: Optional[str] = None
    watering_period_days: Optional[int] = None

class UserPlantDto(BaseModel):
    id: str
    name: str
    created_at: str
    updated_at: str

class UserPlantCreateDto(BaseModel):
    name: str

class UserPlantUpdateDto(BaseModel):
    name: str

class ApiResponse(BaseModel):
    message: str
    data: Optional[dict] = None