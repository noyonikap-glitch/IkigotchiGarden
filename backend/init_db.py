"""
Database initialization script for Supabase PostgreSQL
Run this script once to create tables and seed initial data
"""

from app.database import engine, Base
from app.models import PlantData, UserPlant
from sqlalchemy.orm import Session
from datetime import datetime

def create_tables():
    """Create all database tables"""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ Tables created successfully!")

def seed_plant_data():
    """Seed initial plant data"""
    print("Seeding plant data...")
    
    initial_plants = [
        PlantData(
            name="Snake Plant",
            scientific_name="Sansevieria trifasciata",
            description="Snake plants can survive in very low light and can go weeks without water. They're also known to purify air by removing toxins.",
            care_instructions="Water every 2-3 weeks, tolerates low light, well-draining soil",
            watering_frequency_days=14,
            sunlight_requirement="low",
            difficulty_level="easy",
            image_url="https://example.com/snake-plant.jpg"
        ),
        PlantData(
            name="Monstera",
            scientific_name="Monstera deliciosa",
            description="Monstera leaves develop their characteristic holes (fenestrations) as they mature. In the wild, they can grow up to 60 feet tall!",
            care_instructions="Water when top inch of soil is dry, bright indirect light, provide support for climbing",
            watering_frequency_days=7,
            sunlight_requirement="medium",
            difficulty_level="medium",
            image_url="https://example.com/monstera.jpg"
        ),
        PlantData(
            name="Fiddle Leaf Fig",
            scientific_name="Ficus lyrata",
            description="Fiddle leaf figs are native to western Africa and can grow up to 50 feet tall in their natural habitat. They're quite dramatic and will drop leaves if they're unhappy!",
            care_instructions="Consistent watering schedule, bright filtered light, stable environment, clean leaves regularly",
            watering_frequency_days=7,
            sunlight_requirement="high",
            difficulty_level="hard",
            image_url="https://example.com/fiddle-leaf-fig.jpg"
        ),
        PlantData(
            name="Pothos",
            scientific_name="Epipremnum aureum",
            description="Pothos are incredibly resilient and can grow in water indefinitely. They're often called 'devil's ivy' because they're nearly impossible to kill!",
            care_instructions="Water when soil feels dry, bright indirect light, can trail or climb",
            watering_frequency_days=5,
            sunlight_requirement="medium",
            difficulty_level="easy",
            image_url="https://example.com/pothos.jpg"
        ),
        PlantData(
            name="Peace Lily",
            scientific_name="Spathiphyllum wallisii",
            description="Peace lilies will dramatically droop their leaves when they need water, making them excellent communicators. They also bloom beautiful white flowers!",
            care_instructions="Keep soil consistently moist, medium to low light, mist leaves occasionally",
            watering_frequency_days=4,
            sunlight_requirement="medium",
            difficulty_level="medium",
            image_url="https://example.com/peace-lily.jpg"
        ),
        PlantData(
            name="Rubber Plant",
            scientific_name="Ficus elastica",
            description="Rubber plants were once used to make rubber before synthetic alternatives were developed. They can grow into massive trees outdoors!",
            care_instructions="Water when top inch of soil is dry, bright indirect light, clean leaves regularly",
            watering_frequency_days=10,
            sunlight_requirement="medium",
            difficulty_level="medium",
            image_url="https://example.com/rubber-plant.jpg"
        ),
        PlantData(
            name="Spider Plant",
            scientific_name="Chlorophytum comosum",
            description="Spider plants produce baby plants (spiderettes) that dangle from the mother plant like spiders on a web. They're excellent air purifiers!",
            care_instructions="Water when soil surface is dry, bright indirect light, propagate babies easily",
            watering_frequency_days=5,
            sunlight_requirement="medium",
            difficulty_level="easy",
            image_url="https://example.com/spider-plant.jpg"
        )
    ]
    
    db = Session(bind=engine)
    try:
        # Check if data already exists
        existing_count = db.query(PlantData).count()
        if existing_count > 0:
            print(f"⚠️  Plant data already exists ({existing_count} plants). Skipping seed.")
            return
        
        # Add all plants
        for plant in initial_plants:
            db.add(plant)
        
        db.commit()
        print(f"✅ Successfully seeded {len(initial_plants)} plants!")
        
    except Exception as e:
        print(f"❌ Error seeding data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("🌱 Initializing IkigotchiGarden Database...")
    create_tables()
    seed_plant_data()
    print("🎉 Database initialization complete!")