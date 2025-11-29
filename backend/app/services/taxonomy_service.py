import json
from typing import Dict, List, Optional, Any
from pathlib import Path


class TaxonomyService:
    """Servizio per gestire la tassonomia ACN"""

    def __init__(self):
        self.taxonomy_path = Path("/app/ACN_Taxonomy.json")
        self.misp_taxonomy_path = Path("/app/MISP_ACN_Taxonomy.json")
        self._taxonomy_data = None
        self._misp_taxonomy_data = None
        self._load_taxonomy()

    def _load_taxonomy(self):
        """Carica i dati della tassonomia"""
        with open(self.taxonomy_path, 'r', encoding='utf-8') as f:
            self._taxonomy_data = json.load(f)

        with open(self.misp_taxonomy_path, 'r', encoding='utf-8') as f:
            self._misp_taxonomy_data = json.load(f)

    def get_taxonomy(self) -> Dict[str, Any]:
        """Ritorna l'intera tassonomia"""
        return self._taxonomy_data

    def get_macrocategories(self) -> List[Dict[str, Any]]:
        """Ritorna tutte le macrocategorie"""
        return self._taxonomy_data.get("taxonomy", {}).get("macrocategories", [])

    def get_macrocategory(self, code: str) -> Optional[Dict[str, Any]]:
        """Ritorna una specifica macrocategoria"""
        for mc in self.get_macrocategories():
            if mc["code"] == code:
                return mc
        return None

    def get_predicates(self, macrocategory_code: str) -> List[Dict[str, Any]]:
        """Ritorna i predicati di una macrocategoria"""
        mc = self.get_macrocategory(macrocategory_code)
        if mc:
            return mc.get("predicates", [])
        return []

    def get_predicate(self, macrocategory_code: str, predicate_code: str) -> Optional[Dict[str, Any]]:
        """Ritorna un predicato specifico"""
        predicates = self.get_predicates(macrocategory_code)
        for pred in predicates:
            if pred["code"] == predicate_code:
                return pred
        return None

    def get_values(self, macrocategory_code: str, predicate_code: str) -> List[Dict[str, Any]]:
        """Ritorna i valori di un predicato"""
        pred = self.get_predicate(macrocategory_code, predicate_code)
        if pred:
            return pred.get("values", [])
        return []

    def get_wizard_structure(self) -> List[Dict[str, Any]]:
        """Ritorna la struttura per il wizard step-by-step"""
        return [
            {
                "step": 1,
                "title": "Baseline Characterization",
                "description": "Caratterizzazione dell'incidente",
                "macrocategory": "BC",
                "predicates": ["IM", "RO", "SE", "VG"]
            },
            {
                "step": 2,
                "title": "Threat Type",
                "description": "Tipologia di minaccia",
                "macrocategory": "TT",
                "predicates": ["AC", "AV", "BA", "FR", "DE", "IG", "MA", "SO", "VU"]
            },
            {
                "step": 3,
                "title": "Threat Actor",
                "description": "Attore della minaccia",
                "macrocategory": "TA",
                "predicates": ["AM", "AD"]
            },
            {
                "step": 4,
                "title": "Additional Context",
                "description": "Contesto aggiuntivo",
                "macrocategory": "AC",
                "predicates": ["AB", "AS", "IN", "OU", "PH", "VE"]
            }
        ]

    def validate_code(self, code: str) -> bool:
        """Valida se un codice esiste nella tassonomia"""
        # Estrai macrocategoria e predicato dal codice (es: BC:IM_AC)
        if ":" not in code:
            return False

        parts = code.split(":")
        if len(parts) != 2:
            return False

        mc_code = parts[0]
        rest = parts[1]

        # Cerca nel taxonomy
        mc = self.get_macrocategory(mc_code)
        if not mc:
            return False

        # Cerca tra i predicati
        for predicate in mc.get("predicates", []):
            # Controlla valori diretti
            for value in predicate.get("values", []):
                if value["code"] == code:
                    return True

            # Controlla subpredicates
            for subpred in predicate.get("subpredicates", []):
                for value in subpred.get("values", []):
                    if value["code"] == code:
                        return True

        return False

    def get_misp_taxonomy(self) -> Dict[str, Any]:
        """Ritorna la tassonomia MISP"""
        return self._misp_taxonomy_data

    def map_to_misp_format(self, incident_data: Dict[str, Any]) -> Dict[str, Any]:
        """Mappa un incidente nel formato MISP"""
        # TODO: Implementare la mappatura completa
        tags = []

        # Mappa impact
        for impact_code in incident_data.get("impact", []):
            tags.append(self._code_to_misp_tag(impact_code))

        # Mappa altri campi...

        return {
            "Event": {
                "info": incident_data.get("title", ""),
                "threat_level_id": self._severity_to_threat_level(incident_data.get("severity")),
                "analysis": "1",  # Ongoing
                "Tag": [{"name": tag} for tag in tags if tag]
            }
        }

    def _code_to_misp_tag(self, code: str) -> Optional[str]:
        """Converte un codice ACN in tag MISP"""
        # Formato: acn:predicate="value"
        # Esempio: BC:IM_AC -> acn:impact="account-compromise"
        if ":" not in code:
            return None

        # TODO: implementare mappatura completa usando MISP_ACN_Taxonomy.json
        return f"acn:{code}"

    def _severity_to_threat_level(self, severity: Optional[str]) -> str:
        """Mappa severity ACN a threat_level MISP"""
        mapping = {
            "BC:SE_HI": "1",  # High
            "BC:SE_ME": "2",  # Medium
            "BC:SE_LO": "3",  # Low
            "BC:SE_NO": "4"   # Undefined
        }
        return mapping.get(severity, "4")


# Singleton
taxonomy_service = TaxonomyService()
