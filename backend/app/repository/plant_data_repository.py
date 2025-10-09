from typing import List, Optional
from sqlalchemy.orm import Session
from app.models import PlantData

class PlantDataRepository:
    def __init__(self):
        # Database session will be injected
        self.db: Optional[Session] = None
    
    def set_db_session(self, db: Session):
        """Set database session for this repository"""
        self.db = db
    
    def find_all(self) -> List[PlantData]:
        """Get all plant data"""
        if not self.db:
            raise RuntimeError("Database session not set")
        return self.db.query(PlantData).all()
    
    def find_by_id(self, plant_id: int) -> Optional[PlantData]:
        """Find plant by ID"""
        if not self.db:
            raise RuntimeError("Database session not set")
        return self.db.query(PlantData).filter(PlantData.id == plant_id).first()
    
    def find_by_name(self, name: str) -> List[PlantData]:
        """Find plants by name (case-insensitive partial match)"""
        if not self.db:
            raise RuntimeError("Database session not set")
        return self.db.query(PlantData).filter(
            PlantData.name.ilike(f"%{name}%")
        ).all()
    
    def save(self, plant_data: PlantData) -> PlantData:
        """Save plant data to database"""
        if not self.db:
            raise RuntimeError("Database session not set")
        self.db.add(plant_data)
        self.db.commit()
        self.db.refresh(plant_data)
        return plant_data
    
    def update(self, plant_id: int, updated_data: dict) -> Optional[PlantData]:
        """Update plant data"""
        if not self.db:
            raise RuntimeError("Database session not set")
        plant = self.find_by_id(plant_id)
        if plant:
            for key, value in updated_data.items():
                if hasattr(plant, key):
                    setattr(plant, key, value)
            self.db.commit()
            self.db.refresh(plant)
        return plant
    
    def delete_by_id(self, plant_id: int) -> bool:
        """Delete plant by ID"""
        if not self.db:
            raise RuntimeError("Database session not set")
        plant = self.find_by_id(plant_id)
        if plant:
            self.db.delete(plant)
            self.db.commit()
            return True
        return False
    
    def generate_id(self) -> int:
        """Generate next available ID"""
        if not self.db:
            raise RuntimeError("Database session not set")
        max_id = self.db.query(PlantData.id).order_by(PlantData.id.desc()).first()
        return (max_id[0] + 1) if max_id else 1