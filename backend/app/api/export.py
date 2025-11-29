from fastapi import APIRouter, HTTPException, Response, Depends
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session
from app.services.taxonomy_service import taxonomy_service
from app.services.report_service import generate_pdf_report
from app.services.misp_service import create_misp_event
from app.db import get_db
from app.models.incident_db import IncidentORM
from app.models.incident import Incident

router = APIRouter()


def _get_incident(db: Session, incident_id: str) -> Incident:
    orm_incident = db.get(IncidentORM, incident_id)
    if not orm_incident:
        raise HTTPException(status_code=404, detail="Incidente non trovato")

    return Incident(
        id=orm_incident.id,
        title=orm_incident.title,
        description=orm_incident.description,
        impact=orm_incident.impact or [],
        root_cause=orm_incident.root_cause,
        severity=orm_incident.severity,
        victim_geography=orm_incident.victim_geography or [],
        threat_types=orm_incident.threat_types or [],
        adversary_motivation=orm_incident.adversary_motivation,
        adversary_type=orm_incident.adversary_type,
        involved_assets=orm_incident.involved_assets or [],
        vectors=orm_incident.vectors or [],
        outlook=orm_incident.outlook,
        physical_security=orm_incident.physical_security or [],
        abusive_content=orm_incident.abusive_content or [],
        tags=orm_incident.tags or [],
        notes=orm_incident.notes,
        block_details=orm_incident.block_details or {},
        created_at=orm_incident.created_at,
        updated_at=orm_incident.updated_at,
    )


def _build_block_lookup():
    taxonomy = taxonomy_service.get_taxonomy()
    lookup = {}
    for mc in taxonomy.get("taxonomy", {}).get("macrocategories", []):
        mc_code = mc.get("code")
        mc_name = mc.get("name", mc_code)
        for predicate in mc.get("predicates", []):
            pred_code = predicate.get("code")
            pred_name = predicate.get("name", pred_code)
            for value in predicate.get("values", []):
                lookup[value["code"]] = {
                    "label": value.get("label", ""),
                    "description": value.get("description", ""),
                    "macro": mc_code,
                    "macro_name": mc_name,
                    "predicate": pred_code,
                    "predicate_name": pred_name,
                    "subpredicate": None,
                    "subpredicate_name": None,
                }
            for subpred in predicate.get("subpredicates", []):
                sub_code = subpred.get("code")
                sub_name = subpred.get("name", sub_code)
                for value in subpred.get("values", []):
                    lookup[value["code"]] = {
                        "label": value.get("label", ""),
                        "description": value.get("description", ""),
                        "macro": mc_code,
                        "macro_name": mc_name,
                        "predicate": pred_code,
                        "predicate_name": pred_name,
                        "subpredicate": sub_code,
                        "subpredicate_name": sub_name,
                    }
    return lookup


def _collect_incident_codes(incident: Incident):
    """Raccoglie tutti i codici presenti nell'incidente insieme al campo di origine."""
    mapping = {
        "impact": incident.impact or [],
        "victim_geography": incident.victim_geography or [],
        "threat_types": incident.threat_types or [],
        "involved_assets": incident.involved_assets or [],
        "vectors": incident.vectors or [],
        "physical_security": incident.physical_security or [],
        "abusive_content": incident.abusive_content or [],
    }
    if incident.root_cause:
        mapping["root_cause"] = [incident.root_cause]
    if incident.severity:
        mapping["severity"] = [incident.severity]
    if incident.adversary_motivation:
        mapping["adversary_motivation"] = [incident.adversary_motivation]
    if incident.adversary_type:
        mapping["adversary_type"] = [incident.adversary_type]
    if incident.outlook:
        mapping["outlook"] = [incident.outlook]

    collected = []
    for field, codes in mapping.items():
        for code in codes:
            collected.append({"field": field, "code": code})
    return collected


@router.get("/{incident_id}/json")
async def export_incident_json(incident_id: str, db: Session = Depends(get_db)):
    """Esporta incidente in formato JSON"""
    incident = _get_incident(db, incident_id)

    # Arricchisci con informazioni della tassonomia
    enriched = {
        **incident.model_dump(),
        "taxonomy_version": "2.0",
        "taxonomy_source": "ACN"
    }

    # Aggiungi dettagli completi dei blocchi selezionati
    lookup = _build_block_lookup()
    blocks = []
    for item in _collect_incident_codes(incident):
        info = lookup.get(item["code"], {})
        blocks.append({
            "code": item["code"],
            "field": item["field"],
            "label": info.get("label"),
            "description": info.get("description"),
            "macro": info.get("macro"),
            "macro_name": info.get("macro_name"),
            "predicate": info.get("predicate"),
            "predicate_name": info.get("predicate_name"),
            "subpredicate": info.get("subpredicate"),
            "subpredicate_name": info.get("subpredicate_name"),
            "detail": (incident.block_details or {}).get(item["code"]),
        })
    enriched["blocks"] = blocks

    return JSONResponse(
        content=jsonable_encoder(enriched),
        headers={"Content-Disposition": f'attachment; filename="incident_{incident_id}.json"'}
    )


@router.get("/{incident_id}/pdf")
async def export_incident_pdf(incident_id: str, db: Session = Depends(get_db)):
    """Esporta incidente in formato PDF"""
    incident = _get_incident(db, incident_id)

    # Genera PDF
    pdf_bytes = generate_pdf_report(incident.model_dump(), taxonomy_service)

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=incident_{incident_id}.pdf"
        }
    )


@router.get("/{incident_id}/misp")
async def export_incident_misp(incident_id: str, db: Session = Depends(get_db)):
    """Esporta incidente in formato MISP Event"""
    incident = _get_incident(db, incident_id).model_dump()

    # Crea evento MISP
    misp_event = create_misp_event(incident, taxonomy_service)

    return JSONResponse(content=misp_event)


@router.post("/{incident_id}/misp/push")
async def push_to_misp(incident_id: str, db: Session = Depends(get_db)):
    """Push dell'incidente su istanza MISP (richiede configurazione)"""
    _get_incident(db, incident_id)

    # TODO: Implementare push verso MISP reale
    return {
        "message": "Funzionalità non ancora implementata",
        "status": "pending"
    }
