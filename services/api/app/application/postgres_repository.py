from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.schemas import AssessmentRead, PropertyRead
from app.domain.passport import PassportRead
from app.persistence.models_v2 import PropertyModel, CalculationRunModel

class PostgresRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def save_property(self, item: PropertyRead) -> PropertyRead:
        db_item = PropertyModel(
            id=item.id,
            organization_id=item.organization_id,
            name=item.name,
            municipality=item.municipality,
            land_use=item.land_use.value if hasattr(item.land_use, 'value') else item.land_use,
            version=item.version,
            created_at=item.created_at
        )
        self.session.add(db_item)
        await self.session.commit()
        return item

    async def get_property(self, item_id: UUID) -> PropertyRead | None:
        result = await self.session.execute(select(PropertyModel).filter_by(id=item_id))
        db_item = result.scalar_one_or_none()
        if not db_item:
            return None
        return PropertyRead(
            id=db_item.id,
            organization_id=db_item.organization_id,
            name=db_item.name,
            municipality=db_item.municipality,
            land_use=db_item.land_use,
            version=db_item.version,
            created_at=db_item.created_at
        )

    async def list_properties(self) -> list[PropertyRead]:
        result = await self.session.execute(select(PropertyModel))
        return [
            PropertyRead(
                id=db_item.id,
                organization_id=db_item.organization_id,
                name=db_item.name,
                municipality=db_item.municipality,
                land_use=db_item.land_use,
                version=db_item.version,
                created_at=db_item.created_at
            ) for db_item in result.scalars().all()
        ]

    async def save_assessment(self, item: AssessmentRead) -> AssessmentRead:
        # TODO implement when models are ready for assessment
        return item

    async def latest_assessment(self, property_id: UUID) -> AssessmentRead | None:
        return None
