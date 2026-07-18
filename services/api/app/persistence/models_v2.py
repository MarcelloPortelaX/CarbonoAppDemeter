"""Modelo de persistência alvo para a onda PostGIS.

Este módulo não é ativado automaticamente no MVP em memória. O Codex deve gerar migrations,
repositories e testes de integração antes de trocar o provider padrão.
"""

from datetime import datetime
from uuid import UUID, uuid4

from geoalchemy2 import Geometry
from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class PropertyModel(Base):
    __tablename__ = "properties"
    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    organization_id: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True), index=True)
    name: Mapped[str] = mapped_column(String(120))
    municipality: Mapped[str] = mapped_column(String(160))
    land_use: Mapped[str] = mapped_column(String(40), index=True)
    version: Mapped[int] = mapped_column(Integer, default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class BoundaryVersionModel(Base):
    __tablename__ = "boundary_versions"
    __table_args__ = (
        UniqueConstraint("property_id", "version", name="uq_boundary_property_version"),
    )
    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    property_id: Mapped[UUID] = mapped_column(
        ForeignKey("properties.id", ondelete="CASCADE"), index=True
    )
    version: Mapped[int] = mapped_column(Integer)
    geometry: Mapped[object] = mapped_column(
        Geometry("MULTIPOLYGON", srid=4326, spatial_index=True)
    )
    area_ha: Mapped[float] = mapped_column(Float)
    perimeter_km: Mapped[float] = mapped_column(Float)
    input_hash: Mapped[str] = mapped_column(String(64), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class EvidenceModel(Base):
    __tablename__ = "evidence"
    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    property_id: Mapped[UUID] = mapped_column(
        ForeignKey("properties.id", ondelete="CASCADE"), index=True
    )
    kind: Mapped[str] = mapped_column(String(60), index=True)
    object_key: Mapped[str] = mapped_column(Text)
    sha256: Mapped[str] = mapped_column(String(64), index=True)
    metadata_json: Mapped[dict] = mapped_column(JSONB, default=dict)
    captured_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class CalculationRunModel(Base):
    __tablename__ = "calculation_runs"
    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    property_id: Mapped[UUID] = mapped_column(
        ForeignKey("properties.id", ondelete="CASCADE"), index=True
    )
    methodology_id: Mapped[str] = mapped_column(String(80), index=True)
    methodology_version: Mapped[str] = mapped_column(String(30))
    maturity: Mapped[str] = mapped_column(String(30), index=True)
    calculation_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    inputs: Mapped[dict] = mapped_column(JSONB)
    outputs: Mapped[dict] = mapped_column(JSONB)
    uncertainty: Mapped[dict | None] = mapped_column(JSONB)
    input_hash: Mapped[str] = mapped_column(String(64), index=True)
    reviewer_id: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True))
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class AuditEventModel(Base):
    __tablename__ = "audit_events_v2"
    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    correlation_id: Mapped[str] = mapped_column(String(80), index=True)
    actor_id: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True), index=True)
    entity_type: Mapped[str] = mapped_column(String(80), index=True)
    entity_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), index=True)
    action: Mapped[str] = mapped_column(String(80), index=True)
    payload: Mapped[dict] = mapped_column(JSONB)
    previous_hash: Mapped[str | None] = mapped_column(String(64))
    event_hash: Mapped[str] = mapped_column(String(64), unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
