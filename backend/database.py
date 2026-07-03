import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.exc import OperationalError

# Simple inline loader for .env file if it exists
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
if os.path.exists(env_path):
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, val = line.split("=", 1)
                os.environ[key.strip()] = val.strip().strip('"').strip("'")

# Fetch DATABASE_URL from environment (defaulting to a standard local PostgreSQL setup)
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/blinkit")

Base = declarative_base()
engine = None
SessionLocal = None

# Attempt to configure PostgreSQL, fall back to SQLite if unreachable
try:
    print(f"Attempting to connect to database at: {DATABASE_URL}")
    if DATABASE_URL.startswith("postgresql"):
        # We set a short connection timeout so we don't hang if Postgres is down
        temp_engine = create_engine(DATABASE_URL, connect_args={"connect_timeout": 3})
        # Test connection
        with temp_engine.connect() as conn:
            pass
        engine = temp_engine
        print("Successfully connected to PostgreSQL Database!")
    else:
        # SQLite or other specified
        engine = create_engine(DATABASE_URL)
        print(f"Connected to database using driver: {DATABASE_URL}")
except Exception as e:
    print(f"WARNING: PostgreSQL connection failed ({str(e)}).")
    print("Falling back to local self-healing SQLite database: sqlite:///./blinkit_backend.db")
    
    # Fallback to SQLite
    sqlite_url = "sqlite:///./blinkit_backend.db"
    # sqlite requires check_same_thread=False for multiple threads in FastAPI
    engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
