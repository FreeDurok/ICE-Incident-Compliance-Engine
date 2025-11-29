from typing import Dict, Any, List
from datetime import datetime


def create_misp_event(incident: Dict[str, Any], taxonomy_service) -> Dict[str, Any]:
    """Crea un evento MISP dall'incidente"""

    # Raccogli tutti i tag dalla tassonomia ACN
    tags = []

    # Impact tags
    for impact_code in incident.get("impact", []):
        tags.append(f"acn:{_code_to_misp_tag(impact_code)}")

    # Root cause
    if incident.get("root_cause"):
        tags.append(f"acn:{_code_to_misp_tag(incident['root_cause'])}")

    # Severity
    if incident.get("severity"):
        tags.append(f"acn:{_code_to_misp_tag(incident['severity'])}")

    # Geography
    for geo_code in incident.get("victim_geography", []):
        tags.append(f"acn:{_code_to_misp_tag(geo_code)}")

    # Threat types
    for tt_code in incident.get("threat_types", []):
        tags.append(f"acn:{_code_to_misp_tag(tt_code)}")

    # Adversary
    if incident.get("adversary_motivation"):
        tags.append(f"acn:{_code_to_misp_tag(incident['adversary_motivation'])}")

    if incident.get("adversary_type"):
        tags.append(f"acn:{_code_to_misp_tag(incident['adversary_type'])}")

    # Vectors
    for vec_code in incident.get("vectors", []):
        tags.append(f"acn:{_code_to_misp_tag(vec_code)}")

    # Determina threat level da severity
    threat_level_id = _severity_to_threat_level(incident.get("severity"))

    # Crea evento MISP
    misp_event = {
        "Event": {
            "info": incident.get("title", "Incident Report"),
            "threat_level_id": threat_level_id,
            "analysis": "1",  # 0=Initial, 1=Ongoing, 2=Completed
            "date": datetime.utcnow().strftime("%Y-%m-%d"),
            "published": False,
            "Tag": [{"name": tag} for tag in tags],
            "Attribute": []
        }
    }

    # Aggiungi descrizione come attributo
    if incident.get("description"):
        misp_event["Event"]["Attribute"].append({
            "type": "text",
            "category": "Other",
            "value": incident["description"],
            "comment": "Incident description",
            "to_ids": False
        })

    # Aggiungi note
    if incident.get("notes"):
        misp_event["Event"]["Attribute"].append({
            "type": "text",
            "category": "Internal reference",
            "value": incident["notes"],
            "comment": "Additional notes",
            "to_ids": False
        })

    return misp_event


def _code_to_misp_tag(code: str) -> str:
    """Converte codice ACN in formato tag MISP"""
    # Rimuovi il prefisso macrocategoria (es: BC:IM_AC -> IM_AC)
    if ":" in code:
        _, value = code.split(":", 1)
    else:
        value = code

    # Converti in formato MISP (lowercase con trattini)
    # Es: IM_AC -> impact="account-compromise"
    return value.lower().replace("_", "-")


def _severity_to_threat_level(severity: str | None) -> str:
    """Mappa severity ACN a threat_level_id MISP"""
    mapping = {
        "BC:SE_HI": "1",  # High
        "BC:SE_ME": "2",  # Medium
        "BC:SE_LO": "3",  # Low
        "BC:SE_NO": "4"   # Undefined
    }
    return mapping.get(severity, "4")
