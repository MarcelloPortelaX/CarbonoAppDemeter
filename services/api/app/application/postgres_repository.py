from uuid import UUID

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession
from geoalchemy2.elements import WKTElement
import json
from datetime import UTC, datetime

from app.domain.schemas import AssessmentRead, PropertyRead, PropertyCreate, BoundaryCreate, BoundaryVersionRead, LandUse
from app.persistence.models_v2 import PropertyModel, BoundaryVersionModel
from app.domain.provenance import canonical_hash

class PostgresRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def save_property(self, creation_request: PropertyCreate) -> PropertyRead:
        stmt = insert(PropertyModel).values(
            id=creation_request.id,
            name=creation_request.name,
            municipality=creation_request.municipality,
            land_use=creation_request.land_use.value if hasattr(creation_request.land_use, 'value') else creation_request.land_use,
            version=1
        )
        
        stmt = stmt.on_conflict_do_nothing(index_elements=['id'])
        await self.session.execute(stmt)
        await self.session.commit()
        
        return await self.get_property(creation_request.id)

    async def get_property(self, property_id: UUID) -> PropertyRead | None:
        result = await self.session.execute(select(PropertyModel).filter_by(id=property_id))
        db_record = result.scalar_one_or_none()
        if not db_record:
            return None
            
        return PropertyRead(
            id=db_record.id,
            name=db_record.name,
            municipality=db_record.municipality,
            land_use=LandUse(db_record.land_use),
            version=db_record.version,
            created_at=db_record.created_at
        )

    async def list_properties(self) -> list[PropertyRead]:
        result = await self.session.execute(select(PropertyModel))
        return [
            PropertyRead(
                id=db_record.id,
                name=db_record.name,
                municipality=db_record.municipality,
                land_use=LandUse(db_record.land_use),
                version=db_record.version,
                created_at=db_record.created_at
            ) for db_record in result.scalars().all()
        ]

    async def save_boundary(self, property_id: UUID, boundary_request: BoundaryCreate) -> BoundaryVersionRead:
        payload_dict = {"points": [{"lat": p.latitude, "lon": p.longitude} for p in boundary_request.points]}
        input_hash = canonical_hash(payload_dict)

        result = await self.session.execute(
            select(BoundaryVersionModel)
            .filter_by(property_id=property_id)
            .order_by(BoundaryVersionModel.version.desc())
            .limit(1)
        )
        latest_boundary = result.scalar_one_or_none()
        
        if latest_boundary and latest_boundary.input_hash == input_hash:
            return BoundaryVersionRead(
                id=latest_boundary.id,
                property_id=latest_boundary.property_id,
                version=latest_boundary.version,
                area_ha=latest_boundary.area_ha,
                perimeter_km=latest_boundary.perimeter_km,
                input_hash=latest_boundary.input_hash,
                created_at=latest_boundary.created_at
            )
            
        new_version = (latest_boundary.version + 1) if latest_boundary else 1
        
        coords = [f"{p.longitude} {p.latitude}" for p in boundary_request.points]
        if coords[0] != coords[-1]:
            coords.append(coords[0])
        wkt = f"SRID=4326;POLYGON(({', '.join(coords)}))"
        geom = WKTElement(wkt, srid=4326)

        new_boundary = BoundaryVersionModel(
            property_id=property_id,
            version=new_version,
            geometry=geom,
            area_ha=0.0,
            perimeter_km=0.0,
            input_hash=input_hash
        )
        
        self.session.add(new_boundary)
        await self.session.commit()
        await self.session.refresh(new_boundary)
        
        return BoundaryVersionRead(
            id=new_boundary.id,
            property_id=new_boundary.property_id,
            version=new_boundary.version,
            area_ha=new_boundary.area_ha,
            perimeter_km=new_boundary.perimeter_km,
            input_hash=new_boundary.input_hash,
            created_at=new_boundary.created_at
        )

    async def save_assessment(self, item: AssessmentRead) -> AssessmentRead:
        return item

    async def latest_assessment(self, property_id: UUID) -> AssessmentRead | None:
        return None
