import os
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.orm import sessionmaker, declarative_base


DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./app.db")

# For SQLite we need check_same_thread, but postgres doesn't
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, future=True, echo=False, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, expire_on_commit=False, future=True)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def ensure_schema():
    """
    Best-effort piccolo aggiornamento schema senza migrazioni:
    aggiunge discovered_at se manca (postgres).
    """
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    if "incidents" not in tables:
        return

    columns = [col["name"] for col in inspector.get_columns("incidents")]
    if "discovered_at" not in columns:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE incidents ADD COLUMN discovered_at TIMESTAMP NULL"))
