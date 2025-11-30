from typing import Dict, Any, List
from datetime import datetime


def create_misp_event(incident: Dict[str, Any], taxonomy_service) -> Dict[str, Any]:
    """Crea un evento MISP dall'incidente usando schema dinamico taxonomy_codes"""

    # Raccogli tutti i tag dalla tassonomia ACN usando lo schema dinamico
    tags = []
    taxonomy_codes = incident.get("taxonomy_codes", {})

    # Itera su tutte le chiavi e codici dinamicamente
    for taxonomy_key, codes_list in taxonomy_codes.items():
        for code in codes_list:
            tags.append(f"acn:{_code_to_misp_tag(code)}")

    # Determina threat level da severity (primo codice BC:SE se presente)
    severity_code = None
    bc_se_codes = taxonomy_codes.get("BC:SE", [])
    if bc_se_codes:
        severity_code = bc_se_codes[0]
    threat_level_id = _severity_to_threat_level(severity_code)

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
