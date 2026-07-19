"""initial schema

Revision ID: 001
Revises: 
Create Date: 2026-07-19 00:15:00.000000

"""
from collections.abc import Sequence

import geoalchemy2
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = '001'
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # enable postgis extension
    op.execute('CREATE EXTENSION IF NOT EXISTS postgis')

    op.create_table('properties',
    sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('organization_id', postgresql.UUID(as_uuid=True), nullable=True),
    sa.Column('name', sa.String(length=120), nullable=False),
    sa.Column('municipality', sa.String(length=160), nullable=False),
    sa.Column('land_use', sa.String(length=40), nullable=False),
    sa.Column('version', sa.Integer(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_properties_land_use'), 'properties', ['land_use'], unique=False)
    op.create_index(op.f('ix_properties_organization_id'), 'properties', ['organization_id'], unique=False)

    op.create_table('audit_events_v2',
    sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('correlation_id', sa.String(length=80), nullable=False),
    sa.Column('actor_id', postgresql.UUID(as_uuid=True), nullable=True),
    sa.Column('entity_type', sa.String(length=80), nullable=False),
    sa.Column('entity_id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('action', sa.String(length=80), nullable=False),
    sa.Column('payload', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
    sa.Column('previous_hash', sa.String(length=64), nullable=True),
    sa.Column('event_hash', sa.String(length=64), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('event_hash')
    )
    op.create_index(op.f('ix_audit_events_v2_action'), 'audit_events_v2', ['action'], unique=False)
    op.create_index(op.f('ix_audit_events_v2_actor_id'), 'audit_events_v2', ['actor_id'], unique=False)
    op.create_index(op.f('ix_audit_events_v2_correlation_id'), 'audit_events_v2', ['correlation_id'], unique=False)
    op.create_index(op.f('ix_audit_events_v2_entity_id'), 'audit_events_v2', ['entity_id'], unique=False)
    op.create_index(op.f('ix_audit_events_v2_entity_type'), 'audit_events_v2', ['entity_type'], unique=False)

    op.create_table('boundary_versions',
    sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('property_id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('version', sa.Integer(), nullable=False),
    sa.Column('geometry', geoalchemy2.types.Geometry(geometry_type='MULTIPOLYGON', srid=4326, from_text='ST_GeomFromEWKT', name='geometry', nullable=False)),
    sa.Column('area_ha', sa.Float(), nullable=False),
    sa.Column('perimeter_km', sa.Float(), nullable=False),
    sa.Column('input_hash', sa.String(length=64), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['property_id'], ['properties.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('property_id', 'version', name='uq_boundary_property_version')
    )
    op.create_index(op.f('ix_boundary_versions_input_hash'), 'boundary_versions', ['input_hash'], unique=False)
    op.create_index(op.f('ix_boundary_versions_property_id'), 'boundary_versions', ['property_id'], unique=False)

    op.create_table('calculation_runs',
    sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('property_id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('methodology_id', sa.String(length=80), nullable=False),
    sa.Column('methodology_version', sa.String(length=30), nullable=False),
    sa.Column('maturity', sa.String(length=30), nullable=False),
    sa.Column('calculation_enabled', sa.Boolean(), nullable=False),
    sa.Column('inputs', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
    sa.Column('outputs', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
    sa.Column('uncertainty', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.Column('input_hash', sa.String(length=64), nullable=False),
    sa.Column('reviewer_id', postgresql.UUID(as_uuid=True), nullable=True),
    sa.Column('reviewed_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['property_id'], ['properties.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_calculation_runs_input_hash'), 'calculation_runs', ['input_hash'], unique=False)
    op.create_index(op.f('ix_calculation_runs_maturity'), 'calculation_runs', ['maturity'], unique=False)
    op.create_index(op.f('ix_calculation_runs_methodology_id'), 'calculation_runs', ['methodology_id'], unique=False)
    op.create_index(op.f('ix_calculation_runs_property_id'), 'calculation_runs', ['property_id'], unique=False)

    op.create_table('evidence',
    sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('property_id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('kind', sa.String(length=60), nullable=False),
    sa.Column('object_key', sa.Text(), nullable=False),
    sa.Column('sha256', sa.String(length=64), nullable=False),
    sa.Column('metadata_json', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
    sa.Column('captured_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['property_id'], ['properties.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_evidence_kind'), 'evidence', ['kind'], unique=False)
    op.create_index(op.f('ix_evidence_property_id'), 'evidence', ['property_id'], unique=False)
    op.create_index(op.f('ix_evidence_sha256'), 'evidence', ['sha256'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_evidence_sha256'), table_name='evidence')
    op.drop_index(op.f('ix_evidence_property_id'), table_name='evidence')
    op.drop_index(op.f('ix_evidence_kind'), table_name='evidence')
    op.drop_table('evidence')
    op.drop_index(op.f('ix_calculation_runs_property_id'), table_name='calculation_runs')
    op.drop_index(op.f('ix_calculation_runs_methodology_id'), table_name='calculation_runs')
    op.drop_index(op.f('ix_calculation_runs_maturity'), table_name='calculation_runs')
    op.drop_index(op.f('ix_calculation_runs_input_hash'), table_name='calculation_runs')
    op.drop_table('calculation_runs')
    op.drop_index(op.f('ix_boundary_versions_property_id'), table_name='boundary_versions')
    op.drop_index(op.f('ix_boundary_versions_input_hash'), table_name='boundary_versions')
    op.drop_table('boundary_versions')
    op.drop_index(op.f('ix_audit_events_v2_entity_type'), table_name='audit_events_v2')
    op.drop_index(op.f('ix_audit_events_v2_entity_id'), table_name='audit_events_v2')
    op.drop_index(op.f('ix_audit_events_v2_correlation_id'), table_name='audit_events_v2')
    op.drop_index(op.f('ix_audit_events_v2_actor_id'), table_name='audit_events_v2')
    op.drop_index(op.f('ix_audit_events_v2_action'), table_name='audit_events_v2')
    op.drop_table('audit_events_v2')
    op.drop_index(op.f('ix_properties_organization_id'), table_name='properties')
    op.drop_index(op.f('ix_properties_land_use'), table_name='properties')
    op.drop_table('properties')
