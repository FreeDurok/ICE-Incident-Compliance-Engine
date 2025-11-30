from fastapi import APIRouter, HTTPException, Body
from typing import List
import uuid
from datetime import datetime
from app.models.incident import Incident, IncidentCreate, IncidentUpdate, IncidentSummary
from app.db import get_collection
from app.utils.taxonomy_helpers import count_codes_by_category, extract_all_codes_from_taxonomy_dict

router = APIRouter()

COLLECTION_NAME = "incidents"


def _doc_to_incident(doc: dict) -> Incident:
    """Converte un documento MongoDB in modello Incident"""
    if "_id" in doc:
        doc["id"] = doc.pop("_id")
    return Incident(**doc)


@router.post("/", response_model=Incident)
async def create_incident(incident: IncidentCreate):
    """Crea un nuovo incidente"""
    collection = get_collection(COLLECTION_NAME)

    incident_id = str(uuid.uuid4())
    now = datetime.utcnow()

    doc = incident.model_dump()
    doc["_id"] = incident_id
    doc["created_at"] = now
    doc["updated_at"] = now

    await collection.insert_one(doc)

    inserted = await collection.find_one({"_id": incident_id})
    return _doc_to_incident(inserted)


@router.get("/", response_model=List[IncidentSummary])
async def list_incidents():
    """Lista tutti gli incidenti (summary)"""
    collection = get_collection(COLLECTION_NAME)

    cursor = collection.find().sort("created_at", -1)
    incidents = await cursor.to_list(length=None)

    summaries = []
    for inc in incidents:
        # Calcola count per categoria usando helper
        taxonomy_codes = inc.get("taxonomy_codes", {})
        counts = count_codes_by_category(taxonomy_codes)

        # Estrai severity (primo codice BC:SE se presente)
        severity_code = None
        bc_se_codes = taxonomy_codes.get("BC:SE", [])
        if bc_se_codes:
            severity_code = bc_se_codes[0]

        summaries.append(IncidentSummary(
            id=inc["_id"],
            title=inc["title"],
            created_at=inc["created_at"],
            bc_count=counts.get("BC", 0),
            tt_count=counts.get("TT", 0),
            ta_count=counts.get("TA", 0),
            ac_count=counts.get("AC", 0),
            severity_code=severity_code
        ))

    return summaries


@router.get("/{incident_id}", response_model=Incident)
async def get_incident(incident_id: str):
    """Ottieni dettagli di un incidente"""
    collection = get_collection(COLLECTION_NAME)

    incident = await collection.find_one({"_id": incident_id})
    if not incident:
        raise HTTPException(status_code=404, detail="Incidente non trovato")

    return _doc_to_incident(incident)


@router.put("/{incident_id}", response_model=Incident)
async def update_incident(incident_id: str, incident_update: IncidentUpdate):
    """Aggiorna un incidente"""
    collection = get_collection(COLLECTION_NAME)

    # Verifica che esista
    existing = await collection.find_one({"_id": incident_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Incidente non trovato")

    # Prepara update
    update_data = incident_update.model_dump(exclude_unset=True)
    if update_data:
        update_data["updated_at"] = datetime.utcnow()
        await collection.update_one(
            {"_id": incident_id},
            {"$set": update_data}
        )

    # Rileggi documento aggiornato
    updated = await collection.find_one({"_id": incident_id})
    return _doc_to_incident(updated)


@router.delete("/{incident_id}")
async def delete_incident(incident_id: str):
    """Elimina un incidente"""
    collection = get_collection(COLLECTION_NAME)

    result = await collection.delete_one({"_id": incident_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Incidente non trovato")

    return {"message": "Incidente eliminato con successo"}


@router.post("/import", response_model=Incident)
async def import_incident(payload: dict = Body(...)):
    """
    Importa un incidente da un JSON esportato.
    Ignora campi di sistema (id, created_at, updated_at) e crea un nuovo record.
    """
    if not payload.get("title"):
        raise HTTPException(status_code=400, detail="Titolo mancante nel JSON")

    # Rimuovi campi di sistema se presenti
    payload.pop("id", None)
    payload.pop("_id", None)
    payload.pop("created_at", None)
    payload.pop("updated_at", None)

    # Crea incidente con i dati importati
    try:
        create_data = IncidentCreate(**payload)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Dati non validi: {str(e)}")

    return await create_incident(create_data)
