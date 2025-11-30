from fastapi import APIRouter, HTTPException, Response
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from app.services.taxonomy_service import taxonomy_service
from app.services.report_service import generate_pdf_report
from app.services.misp_service import create_misp_event
from app.db import get_collection
from app.models.incident import Incident
from app.utils.taxonomy_helpers import extract_all_codes_from_taxonomy_dict

router = APIRouter()

COLLECTION_NAME = "incidents"


def _doc_to_incident(doc: dict) -> Incident:
    """Converte un documento MongoDB in modello Incident"""
    if "_id" in doc:
        doc["id"] = doc.pop("_id")
    return Incident(**doc)


async def _get_incident(incident_id: str) -> Incident:
    """Helper per ottenere un incidente"""
    collection = get_collection(COLLECTION_NAME)
    incident = await collection.find_one({"_id": incident_id})
    if not incident:
        raise HTTPException(status_code=404, detail="Incidente non trovato")
    return _doc_to_incident(incident)


def _build_block_lookup():
    """Crea lookup table per i codici tassonomia"""
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
    """
    Raccoglie tutti i codici presenti nell'incidente insieme alla chiave tassonomia.

    Usa lo schema dinamico taxonomy_codes per iterare su tutte le chiavi/codici
    senza hardcoding dei predicati.
    """
    collected = []

    # Itera su tutte le chiavi tassonomia (es. "BC:IM", "TT:MA", "AC:IN:HW-CS")
    for taxonomy_key, codes_list in incident.taxonomy_codes.items():
        for code in codes_list:
            collected.append({
                "taxonomy_key": taxonomy_key,
                "code": code
            })

    return collected


@router.get("/{incident_id}/json")
async def export_incident_json(incident_id: str):
    """Esporta incidente in formato JSON"""
    incident = await _get_incident(incident_id)

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
            "taxonomy_key": item["taxonomy_key"],
            "label": info.get("label"),
            "description": info.get("description"),
            "macro": info.get("macro"),
            "macro_name": info.get("macro_name"),
            "predicate": info.get("predicate"),
            "predicate_name": info.get("predicate_name"),
            "subpredicate": info.get("subpredicate"),
            "subpredicate_name": info.get("subpredicate_name"),
            "detail": (incident.code_details or {}).get(item["code"]),
        })
    enriched["blocks"] = blocks

    return JSONResponse(
        content=jsonable_encoder(enriched),
        headers={"Content-Disposition": f'attachment; filename="incident_{incident_id}.json"'}
    )


@router.get("/{incident_id}/pdf")
async def export_incident_pdf(incident_id: str):
    """Esporta incidente in formato PDF"""
    incident = await _get_incident(incident_id)

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
async def export_incident_misp(incident_id: str):
    """Esporta incidente in formato MISP Event"""
    incident = await _get_incident(incident_id)

    # Crea evento MISP
    misp_event = create_misp_event(incident.model_dump(), taxonomy_service)

    return JSONResponse(content=misp_event)


@router.post("/{incident_id}/misp/push")
async def push_to_misp(incident_id: str):
    """Push dell'incidente su istanza MISP (richiede configurazione)"""
    await _get_incident(incident_id)

    # TODO: Implementare push verso MISP reale
    return {
        "message": "Funzionalità non ancora implementata",
        "status": "pending"
    }
