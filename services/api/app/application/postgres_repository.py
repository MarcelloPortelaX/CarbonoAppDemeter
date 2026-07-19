from uuid import UUID, uuid4

from fastapi import HTTPException
from geoalchemy2.elements import WKTElement
from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.provenance import canonical_hash
from app.domain.schemas import (
    AssessmentRead,
    BoundaryCreate,
    BoundaryVersionRead,
    LandUse,
    PropertyCreate,
    PropertyRead,
)
from app.persistence.models_v2 import AssessmentModel, BoundaryVersionModel, PropertyModel


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
        
        result = await self.get_property(creation_request.id)
        if result is None:
            raise HTTPException(status_code=500, detail="Failed to save property")
        return result

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
        unique_points = []
        for p in boundary_request.points:
            if not unique_points or (unique_points[-1].latitude != p.latitude or unique_points[-1].longitude != p.longitude):
                unique_points.append(p)
        if unique_points and unique_points[0].latitude == unique_points[-1].latitude and unique_points[0].longitude == unique_points[-1].longitude:
            unique_points.pop()

        if len(unique_points) < 3:
            raise HTTPException(status_code=422, detail="polygon requires at least three distinct points")

        min_idx = min(range(len(unique_points)), key=lambda i: (unique_points[i].latitude, unique_points[i].longitude))
        rotated = unique_points[min_idx:] + unique_points[:min_idx]

        payload_dict = {"points": [{"lat": p.latitude, "lon": p.longitude} for p in rotated]}
        input_hash = canonical_hash(payload_dict)

        result = await self.session.execute(
            select(BoundaryVersionModel)
            .filter_by(property_id=property_id)
            .order_by(BoundaryVersionModel.version.desc())
            .limit(1)
        )
        latest_boundary = result.scalar_one_or_none()
        
        # Avoid duplication of geometry
        if latest_boundary and latest_boundary.input_hash == input_hash:
            # If the user sends a new boundary_id but same geometry, we might want to still return the old one
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
        
        coords = [f"{p.longitude} {p.latitude}" for p in unique_points]
        coords.append(coords[0]) # close ring
        wkt = f"SRID=4326;POLYGON(({', '.join(coords)}))"
        geom = WKTElement(wkt, srid=4326)

        new_boundary = BoundaryVersionModel(
            id=boundary_request.boundary_id or uuid4(),
            property_id=property_id,
            version=new_version,
            geometry=geom,
            area_ha=0.0,
            perimeter_km=0.0,
            input_hash=input_hash,
            is_confirmed=False
        )
        
        self.session.add(new_boundary)
        await self.session.commit()
        await self.session.refresh(new_boundary)
        
        # Actually better to just use raw SQL for the update to avoid type hinting issues:
        await self.session.execute(
            func.text("UPDATE boundary_versions SET area_ha = ST_Area(geometry::geography) / 10000, perimeter_km = ST_Perimeter(geometry::geography) / 1000 WHERE id = :id")
            .bindparams(id=new_boundary.id)
        )
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

    async def confirm_boundary(self, property_id: UUID, boundary_id: UUID) -> None:
        property_record = await self.get_property(property_id)
        if not property_record:
            raise HTTPException(status_code=404, detail="property not found")
            
        boundary_record = await self.session.execute(
            select(BoundaryVersionModel).filter_by(id=boundary_id, property_id=property_id)
        )
        if not boundary_record.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="boundary not found for this property")
            
        # Unconfirm all others
        await self.session.execute(
            func.text("UPDATE boundary_versions SET is_confirmed = false WHERE property_id = :prop_id").bindparams(prop_id=property_id)
        )
        # Confirm the specified one
        await self.session.execute(
            func.text("UPDATE boundary_versions SET is_confirmed = true WHERE id = :id").bindparams(id=boundary_id)
        )
        await self.session.commit()

    async def save_assessment(self, item: AssessmentRead) -> AssessmentRead:
        stmt = insert(AssessmentModel).values(
            id=item.id,
            property_id=item.property_id,
            status=item.status.value if hasattr(item.status, 'value') else item.status,
            score=item.score,
            reasons=item.reasons,
            pending=item.pending,
            ruleset_version=item.ruleset_version,
            input_hash=item.input_hash,
            created_at=item.created_at
        )
        stmt = stmt.on_conflict_do_nothing(index_elements=['input_hash'])
        await self.session.execute(stmt)
        await self.session.commit()
        return item

    async def latest_assessment(self, property_id: UUID) -> AssessmentRead | None:
        from app.domain.schemas import EligibilityStatus
        result = await self.session.execute(
            select(AssessmentModel)
            .filter_by(property_id=property_id)
            .order_by(AssessmentModel.created_at.desc())
            .limit(1)
        )
        db_record = result.scalar_one_or_none()
        if not db_record:
            return None
        return AssessmentRead(
            id=db_record.id,
            property_id=db_record.property_id,
            status=EligibilityStatus(db_record.status),
            score=db_record.score,
            reasons=db_record.reasons,
            pending=db_record.pending,
            ruleset_version=db_record.ruleset_version,
            input_hash=db_record.input_hash,
            created_at=db_record.created_at
        )
