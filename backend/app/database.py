import os
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Database URL from Supabase
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    # Fallback for local development
    DATABASE_URL = "postgresql://username:password@localhost/dbname"
    logger.warning("⚠️  Using fallback DATABASE_URL. Please set your Supabase connection string.")
else:
    # Hide password in logs for security
    safe_url = DATABASE_URL.replace(DATABASE_URL.split('@')[0].split(':')[-1], '***')
    logger.info(f"🔗 Database URL configured: {safe_url}")

# Create SQLAlchemy engine
engine = create_engine(DATABASE_URL)

# Test connection on startup
try:
    with engine.connect() as connection:
        result = connection.execute(text("SELECT version()"))
        version = result.fetchone()[0]
        logger.info(f"✅ Successfully connected to Supabase PostgreSQL!")
        logger.info(f"📊 Database version: {version[:50]}...")
except Exception as e:
    logger.error(f"❌ Failed to connect to database: {e}")

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Base class for models
Base = declarative_base()

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()