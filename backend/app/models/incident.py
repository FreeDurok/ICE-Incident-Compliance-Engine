from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class IncidentBase(BaseModel):
    title: str = Field(..., description="Titolo dell'incidente")
    description: Optional[str] = Field(None, description="Descrizione dettagliata")
    discovered_at: Optional[datetime] = Field(None, description="Data/Ora di scoperta dell'incidente")

    # Baseline Characterization
    impact: List[str] = Field(default_factory=list, description="Codici Impact (BC:IM_*)")
    root_cause: Optional[str] = Field(None, description="Codice Root Cause (BC:RO_*)")
    severity: Optional[str] = Field(None, description="Codice Severity (BC:SE_*)")
    victim_geography: List[str] = Field(default_factory=list, description="Codici Geography (BC:VG_*)")

    # Threat Type
    threat_types: List[str] = Field(default_factory=list, description="Codici Threat Type (TT:*)")

    # Threat Actor
    adversary_motivation: Optional[str] = Field(None, description="Codice Motivation (TA:AM_*)")
    adversary_type: Optional[str] = Field(None, description="Codice Adversary Type (TA:AD_*)")

    # Additional Context
    involved_assets: List[str] = Field(default_factory=list, description="Codici Asset (AC:IN_*)")
    vectors: List[str] = Field(default_factory=list, description="Codici Vector (AC:VE_*)")
    outlook: Optional[str] = Field(None, description="Codice Outlook (AC:OU_*)")
    physical_security: List[str] = Field(default_factory=list, description="Codici Physical Security")
    abusive_content: List[str] = Field(default_factory=list, description="Codici Abusive Content")

    # Metadati
    tags: List[str] = Field(default_factory=list, description="Tag personalizzati")
    notes: Optional[str] = Field(None, description="Note aggiuntive")
    block_details: Dict[str, str] = Field(default_factory=dict, description="Dettagli testuali per singoli blocchi (key = codice blocco)")


class IncidentCreate(IncidentBase):
    pass


class IncidentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    impact: Optional[List[str]] = None
    root_cause: Optional[str] = None
    severity: Optional[str] = None
    victim_geography: Optional[List[str]] = None
    threat_types: Optional[List[str]] = None
    adversary_motivation: Optional[str] = None
    adversary_type: Optional[str] = None
    involved_assets: Optional[List[str]] = None
    vectors: Optional[List[str]] = None
    outlook: Optional[str] = None
    physical_security: Optional[List[str]] = None
    abusive_content: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    notes: Optional[str] = None
    block_details: Optional[Dict[str, str]] = None
    discovered_at: Optional[datetime] = None


class Incident(IncidentBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class IncidentSummary(BaseModel):
    """Riepilogo incidente per lista"""
    id: str
    title: str
    severity: Optional[str]
    created_at: datetime
    impact_count: int
    threat_types_count: int
