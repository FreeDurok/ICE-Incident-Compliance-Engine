import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from contextlib import asynccontextmanager
from app.api import incidents, taxonomy, export
from app.db import connect_to_mongo, close_mongo_connection

load_dotenv(dotenv_path=Path(".env"))


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gestisce startup e shutdown dell'applicazione"""
    # Startup
    await connect_to_mongo()
    yield
    # Shutdown
    await close_mongo_connection()


app = FastAPI(
    title="ICE - Incident Compliance Engine",
    description="Piattaforma per la generazione guidata di report di incidente seguendo la Tassonomia Cyber ACN",
    version="2.0.0",
    lifespan=lifespan
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

# Routes
app.include_router(incidents.router, prefix="/api/incidents", tags=["incidents"])
app.include_router(taxonomy.router, prefix="/api/taxonomy", tags=["taxonomy"])
app.include_router(export.router, prefix="/api/export", tags=["export"])


@app.get("/")
async def root():
    return {
        "message": "ICE - Incident Compliance Engine API",
        "version": "2.0.0",
        "database": "MongoDB",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy", "database": "MongoDB"}
