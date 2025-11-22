from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, Float
from sqlalchemy.sql import func
from app.database import Base

class PlantData(Base):
    __tablename__ = "plant_data"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    scientific_name = Column(String(150))
    description = Column(Text)
    care_instructions = Column(Text)
    watering_frequency_days = Column(Integer)
    sunlight_requirement = Column(String(50))  # "low", "medium", "high"
    difficulty_level = Column(String(20))      # "easy", "medium", "hard"
    image_url = Column(String(255))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class UserPlant(Base):
    __tablename__ = "user_plants"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(100), nullable=False, index=True)  # Can be device ID or user ID
    plant_data_id = Column(Integer, nullable=False)  # Reference to plant_data.id
    nickname = Column(String(100))
    date_planted = Column(DateTime(timezone=True))
    last_watered = Column(DateTime(timezone=True))
    last_fertilized = Column(DateTime(timezone=True))
    notes = Column(Text)
    is_active = Column(Boolean, default=True)
    custom_watering_frequency = Column(Integer)  # Override default frequency
    location = Column(String(100))  # "living room", "balcony", etc.
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())