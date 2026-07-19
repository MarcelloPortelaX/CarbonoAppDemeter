"""Add AssessmentModel and is_confirmed

Revision ID: 544c1fef07e6
Revises: 002
Create Date: 2026-07-18 22:38:22.795389

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import geoalchemy2


# revision identifiers, used by Alembic.
revision: str = '544c1fef07e6'
down_revision: Union[str, None] = '002'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add is_confirmed to boundary_versions
    op.add_column('boundary_versions', sa.Column('is_confirmed', sa.Boolean(), server_default='false', nullable=False))
    
    # Create assessments table
    op.create_table(
        'assessments',
        sa.Column('id', sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('property_id', sa.dialects.postgresql.UUID(as_uuid=True), sa.ForeignKey('properties.id', ondelete='CASCADE'), nullable=False),
        sa.Column('status', sa.String(length=40), nullable=False),
        sa.Column('score', sa.Integer(), nullable=False),
        sa.Column('reasons', sa.dialects.postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('pending', sa.dialects.postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('ruleset_version', sa.String(length=40), nullable=False),
        sa.Column('input_hash', sa.String(length=64), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index(op.f('ix_assessments_property_id'), 'assessments', ['property_id'], unique=False)
    op.create_index(op.f('ix_assessments_status'), 'assessments', ['status'], unique=False)
    op.create_index(op.f('ix_assessments_input_hash'), 'assessments', ['input_hash'], unique=True)


def downgrade() -> None:
    # Drop assessments table
    op.drop_index(op.f('ix_assessments_input_hash'), table_name='assessments')
    op.drop_index(op.f('ix_assessments_status'), table_name='assessments')
    op.drop_index(op.f('ix_assessments_property_id'), table_name='assessments')
    op.drop_table('assessments')
    
    # Remove is_confirmed
    op.drop_column('boundary_versions', 'is_confirmed')
