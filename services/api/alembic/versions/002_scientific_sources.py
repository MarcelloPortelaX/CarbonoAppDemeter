"""scientific sources

Revision ID: 002
Revises: 001
Create Date: 2026-07-19 00:16:00.000000

"""
from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = '002'
down_revision: str | None = '001'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table('scientific_sources',
    sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('methodology_id', sa.String(length=80), nullable=False),
    sa.Column('title', sa.String(length=200), nullable=False),
    sa.Column('version', sa.String(length=30), nullable=False),
    sa.Column('source_type', sa.String(length=60), nullable=False),
    sa.Column('url', sa.String(length=255), nullable=True),
    sa.Column('enabled_for_credit_calculation', sa.Boolean(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_scientific_sources_methodology_id'), 'scientific_sources', ['methodology_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_scientific_sources_methodology_id'), table_name='scientific_sources')
    op.drop_table('scientific_sources')
