from fastapi import APIRouter, HTTPException, Depends
from typing import List
import uuid
from sqlalchemy.orm import Session
from app.models.incident import Incident, IncidentCreate, IncidentUpdate, IncidentSummary
from app.models.incident_db import IncidentORM
from app.db import get_db
from fastapi import Body

router = APIRouter()


def _to_incident_model(orm_obj: IncidentORM) -> Incident:
    return Incident(
        id=orm_obj.id,
        title=orm_obj.title,
        description=orm_obj.description,
        discovered_at=orm_obj.discovered_at,
        impact=orm_obj.impact or [],
        root_cause=orm_obj.root_cause,
        severity=orm_obj.severity,
        victim_geography=orm_obj.victim_geography or [],
        threat_types=orm_obj.threat_types or [],
        adversary_motivation=orm_obj.adversary_motivation,
        adversary_type=orm_obj.adversary_type,
        involved_assets=orm_obj.involved_assets or [],
        vectors=orm_obj.vectors or [],
        outlook=orm_obj.outlook,
        physical_security=orm_obj.physical_security or [],
        abusive_content=orm_obj.abusive_content or [],
        tags=orm_obj.tags or [],
        notes=orm_obj.notes,
        block_details=orm_obj.block_details or {},
        created_at=orm_obj.created_at,
        updated_at=orm_obj.updated_at,
    )


@router.post("/", response_model=Incident)
async def create_incident(incident: IncidentCreate, db: Session = Depends(get_db)):
    """Crea un nuovo incidente"""
    incident_id = str(uuid.uuid4())

    data = incident.model_dump()
    orm_obj = IncidentORM(
        id=incident_id,
        title=data["title"],
        description=data.get("description"),
        discovered_at=data.get("discovered_at"),
        impact=data.get("impact") or [],
        root_cause=data.get("root_cause"),
        severity=data.get("severity"),
        victim_geography=data.get("victim_geography") or [],
        threat_types=data.get("threat_types") or [],
        adversary_motivation=data.get("adversary_motivation"),
        adversary_type=data.get("adversary_type"),
        involved_assets=data.get("involved_assets") or [],
        vectors=data.get("vectors") or [],
        outlook=data.get("outlook"),
        physical_security=data.get("physical_security") or [],
        abusive_content=data.get("abusive_content") or [],
        tags=data.get("tags") or [],
        notes=data.get("notes"),
        block_details=data.get("block_details") or {},
    )
    db.add(orm_obj)
    db.commit()
    db.refresh(orm_obj)
    return _to_incident_model(orm_obj)


@router.get("/", response_model=List[IncidentSummary])
async def list_incidents(db: Session = Depends(get_db)):
    """Lista tutti gli incidenti (summary)"""
    incidents = db.query(IncidentORM).order_by(IncidentORM.created_at.desc()).all()
    summaries = [
        IncidentSummary(
            id=inc.id,
            title=inc.title,
            severity=inc.severity,
            created_at=inc.created_at,
            impact_count=len(inc.impact or []),
            threat_types_count=len(inc.threat_types or []),
        )
        for inc in incidents
    ]
    return summaries


@router.get("/{incident_id}", response_model=Incident)
async def get_incident(incident_id: str, db: Session = Depends(get_db)):
    """Ottieni dettagli di un incidente"""
    incident = db.get(IncidentORM, incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incidente non trovato")

    return _to_incident_model(incident)


@router.put("/{incident_id}", response_model=Incident)
async def update_incident(incident_id: str, incident_update: IncidentUpdate, db: Session = Depends(get_db)):
    """Aggiorna un incidente"""
    incident = db.get(IncidentORM, incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incidente non trovato")

    update_data = incident_update.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(incident, field, value)

    db.commit()
    db.refresh(incident)

    return _to_incident_model(incident)


@router.delete("/{incident_id}")
async def delete_incident(incident_id: str, db: Session = Depends(get_db)):
    """Elimina un incidente"""
    incident = db.get(IncidentORM, incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incidente non trovato")

    db.delete(incident)
    db.commit()
    return {"message": "Incidente eliminato con successo"}


@router.post("/import", response_model=Incident)
async def import_incident(payload: dict = Body(...), db: Session = Depends(get_db)):
    """
    Importa un incidente da un JSON esportato.
    Ignora campi di sistema (id, created_at, updated_at) e crea un nuovo record.
    """
    if not payload.get("title"):
        raise HTTPException(status_code=400, detail="Titolo mancante nel JSON")

    # Mappa i campi noti
    create_data = IncidentCreate(
        title=payload.get("title"),
        description=payload.get("description"),
        impact=payload.get("impact") or [],
        root_cause=payload.get("root_cause"),
        severity=payload.get("severity"),
        victim_geography=payload.get("victim_geography") or [],
        threat_types=payload.get("threat_types") or [],
        adversary_motivation=payload.get("adversary_motivation"),
        adversary_type=payload.get("adversary_type"),
        involved_assets=payload.get("involved_assets") or [],
        vectors=payload.get("vectors") or [],
        outlook=payload.get("outlook"),
        physical_security=payload.get("physical_security") or [],
        abusive_content=payload.get("abusive_content") or [],
        tags=payload.get("tags") or [],
        notes=payload.get("notes"),
        block_details=payload.get("block_details") or {},
        discovered_at=payload.get("discovered_at"),
    )

    return await create_incident(create_data, db)
