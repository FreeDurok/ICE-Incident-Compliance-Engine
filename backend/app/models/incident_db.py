from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy import Column, String, DateTime, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.types import JSON
from app.db import Base


# Use JSONB if available (Postgres), otherwise fallback to generic JSON for other engines
JSONType = JSONB().with_variant(JSON(), "sqlite")


class IncidentORM(Base):
    __tablename__ = "incidents"

    id = Column(String, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    impact = Column(JSONType, default=list)
    root_cause = Column(String(64), nullable=True)
    severity = Column(String(64), nullable=True)
    victim_geography = Column(JSONType, default=list)

    threat_types = Column(JSONType, default=list)

    adversary_motivation = Column(String(64), nullable=True)
    adversary_type = Column(String(64), nullable=True)

    involved_assets = Column(JSONType, default=list)
    vectors = Column(JSONType, default=list)
    outlook = Column(String(64), nullable=True)
    physical_security = Column(JSONType, default=list)
    abusive_content = Column(JSONType, default=list)

    tags = Column(JSONType, default=list)
    notes = Column(Text, nullable=True)
    block_details = Column(JSONType, default=dict)
    discovered_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
