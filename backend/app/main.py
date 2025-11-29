import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.api import incidents, taxonomy, export
from app.db import Base, engine, ensure_schema

load_dotenv(dotenv_path=Path(".env"))

app = FastAPI(
    title="ICE - Incident Compliance Engine",
    description="Piattaforma per la generazione guidata di report di incidente in conformità con la Tassonomia Cyber ACN",
    version="1.0.0"
)

# CORS (configurabile via env, fallback su localhost)
origins_env = os.getenv("CORS_ORIGINS")
if origins_env:
    allowed_origins = [o.strip() for o in origins_env.split(",") if o.strip()]
else:
    # Fallback super-permissivo per sviluppo locale
    allowed_origins = ["*"]

# Se è presente "*" disattiviamo i credentials (richiesto dallo standard CORS)
allow_credentials = "*" not in allowed_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create tables (for dev/demo; in production prefer migrations)
Base.metadata.create_all(bind=engine)
ensure_schema()

# Routes
app.include_router(incidents.router, prefix="/api/incidents", tags=["incidents"])
app.include_router(taxonomy.router, prefix="/api/taxonomy", tags=["taxonomy"])
app.include_router(export.router, prefix="/api/export", tags=["export"])

@app.get("/")
async def root():
    return {
        "message": "ICE - Incident Compliance Engine API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
