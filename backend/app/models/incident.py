from datetime import datetime
from typing import Optional, List, Dict
from pydantic import BaseModel, Field


class IncidentBase(BaseModel):
    """
    Modello base incidente con schema dinamico basato su tassonomia.

    Tutti i codici tassonomia sono organizzati in taxonomy_codes,
    raggruppati automaticamente per predicato/subpredicato.
    Questo rende il sistema completamente indipendente dalla struttura
    della tassonomia ACN.
    """
    title: str = Field(..., description="Titolo dell'incidente")
    description: Optional[str] = Field(None, description="Descrizione dettagliata")
    discovered_at: Optional[datetime] = Field(None, description="Data/Ora di scoperta dell'incidente")

    # SCHEMA DINAMICO - La chiave per l'indipendenza dalla taxonomy!
    taxonomy_codes: Dict[str, List[str]] = Field(
        default_factory=dict,
        description="Codici tassonomia raggruppati per predicato/subpredicato. "
                    "Esempi chiavi: 'BC:IM', 'TT:MA', 'AC:IN:HW-CS'"
    )

    # Dettagli e metadati
    code_details: Dict[str, str] = Field(
        default_factory=dict,
        description="Note/dettagli specifici per ogni codice (key = codice completo)"
    )
    tags: List[str] = Field(default_factory=list, description="Tag personalizzati")
    notes: Optional[str] = Field(None, description="Note aggiuntive generali")


class IncidentCreate(IncidentBase):
    """Modello per creazione incidente"""
    pass


class IncidentUpdate(BaseModel):
    """Modello per aggiornamento incidente - tutti i campi opzionali"""
    title: Optional[str] = None
    description: Optional[str] = None
    discovered_at: Optional[datetime] = None
    taxonomy_codes: Optional[Dict[str, List[str]]] = None
    code_details: Optional[Dict[str, str]] = None
    tags: Optional[List[str]] = None
    notes: Optional[str] = None


class Incident(IncidentBase):
    """Modello completo incidente con ID e timestamp"""
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        json_schema_extra = {
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "title": "Data Breach - Customer Database",
                "description": "Unauthorized access to customer database via phishing",
                "taxonomy_codes": {
                    "BC:IM": ["BC:IM_DA", "BC:IM_AC"],
                    "BC:SE": ["BC:SE_HI"],
                    "BC:VG": ["BC:VG_IT"],
                    "TT:SO": ["TT:SO_PH"],
                    "TT:MA": ["TT:MA_RA"],
                    "TA:AM": ["TA:AM_FI"],
                    "AC:IN:SW-DM": ["AC:IN_SW-DM_DB"],
                    "AC:IN:IT": ["AC:IN_IT_FI", "AC:IN_IT_PII"],
                    "AC:VE": ["AC:VE_EM"]
                },
                "code_details": {
                    "BC:IM_DA": "Lost 50k customer records",
                    "TT:SO_PH": "Spear phishing campaign via email"
                },
                "notes": "Incident reported by SOC team",
                "tags": ["phishing", "data-breach"],
                "created_at": "2024-01-15T10:30:00Z",
                "updated_at": "2024-01-15T10:30:00Z"
            }
        }


class IncidentSummary(BaseModel):
    """Riepilogo incidente per lista"""
    id: str
    title: str
    created_at: datetime

    # Conteggi dinamici per categoria
    bc_count: int = Field(description="Count codici BC (Baseline Characterization)")
    tt_count: int = Field(description="Count codici TT (Threat Type)")
    ta_count: int = Field(description="Count codici TA (Threat Actor)")
    ac_count: int = Field(description="Count codici AC (Additional Context)")

    # Severity per display veloce (primo codice BC:SE se presente)
    severity_code: Optional[str] = Field(None, description="Primo codice severity (BC:SE_*)")

    class Config:
        json_schema_extra = {
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "title": "Data Breach - Customer Database",
                "created_at": "2024-01-15T10:30:00Z",
                "bc_count": 4,
                "tt_count": 2,
                "ta_count": 1,
                "ac_count": 3,
                "severity_code": "BC:SE_HI"
            }
        }
