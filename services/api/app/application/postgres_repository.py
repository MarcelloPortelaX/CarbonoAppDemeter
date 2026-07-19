from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.provenance import canonical_hash
from app.domain.schemas import (
    AssessmentRead,
    BoundaryConfirmationRead,
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
        # Lock not strictly needed for insert, but let's check existing
        result = await self.session.execute(select(PropertyModel).filter_by(id=creation_request.id))
        existing = result.scalar_one_or_none()
        land_use_val = creation_request.land_use.value if hasattr(creation_request.land_use, 'value') else creation_request.land_use
        
        if existing:
            if existing.name == creation_request.name and existing.municipality == creation_request.municipality and existing.land_use == land_use_val:
                return await self.get_property(creation_request.id) # type: ignore
            raise HTTPException(status_code=409, detail="Property with same ID but different canonical content already exists")

        stmt = insert(PropertyModel).values(
            id=creation_request.id,
            name=creation_request.name,
            municipality=creation_request.municipality,
            land_use=land_use_val,
            version=1
        )
        await self.session.execute(stmt)
        await self.session.commit()
        
        return await self.get_property(creation_request.id) # type: ignore

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
        from shapely.geometry import MultiPolygon, Polygon  # type: ignore
        from shapely.validation import make_valid  # type: ignore
        
        if not boundary_request.boundary_id:
            raise HTTPException(status_code=422, detail="boundary_id is required for idempotency")
            
        if len(boundary_request.points) < 3:
            raise HTTPException(status_code=422, detail="polygon requires at least three points")

        coords = [(p.longitude, p.latitude) for p in boundary_request.points]
        if coords[0] != coords[-1]:
            coords.append(coords[0])
            
        try:
            poly = Polygon(coords)
        except Exception as e:
            raise HTTPException(status_code=422, detail=f"invalid geometry: {e}")

        if not poly.is_valid:
            raise HTTPException(status_code=422, detail="geometry is invalid (e.g. self-intersecting)")
            
        if poly.is_empty:
            raise HTTPException(status_code=422, detail="geometry is empty")
            
        if poly.area == 0:
            raise HTTPException(status_code=422, detail="polygon has zero area")

        # Normalize orientation (exterior ring counter-clockwise)
        from shapely.geometry.polygon import orient  # type: ignore
        poly = orient(poly, sign=1.0)
        
        # Normalize start point of the ring to ensure deterministic WKT
        def normalize_ring(ring):
            coords = list(ring.coords)[:-1] # remove duplicate end point
            # Find the "smallest" coordinate to use as the start point
            min_idx = min(range(len(coords)), key=lambda i: (coords[i][0], coords[i][1]))
            normalized_coords = coords[min_idx:] + coords[:min_idx]
            normalized_coords.append(normalized_coords[0]) # add end point back
            return type(ring)(normalized_coords)
            
        poly = Polygon(normalize_ring(poly.exterior), [normalize_ring(interior) for interior in poly.interiors])

        if poly.geom_type == 'Polygon':
            poly = MultiPolygon([poly])
        elif poly.geom_type != 'MultiPolygon':
            raise HTTPException(status_code=422, detail=f"invalid geometry type resulting: {poly.geom_type}")
            
        wkt_str = poly.wkt
        input_hash = canonical_hash({"wkt": wkt_str})
        
        boundary_id = boundary_request.boundary_id

        # Lock the property for concurrency safety on version number
        await self.session.execute(select(PropertyModel.id).filter_by(id=property_id).with_for_update())

        result = await self.session.execute(select(BoundaryVersionModel).filter_by(id=boundary_id))
        existing_version = result.scalar_one_or_none()
        
        if existing_version:
            if existing_version.input_hash == input_hash:
                return BoundaryVersionRead(
                    id=existing_version.id,
                    property_id=existing_version.property_id,
                    version=existing_version.version,
                    area_ha=existing_version.area_ha,
                    perimeter_km=existing_version.perimeter_km,
                    input_hash=existing_version.input_hash,
                    created_at=existing_version.created_at
                )
            raise HTTPException(status_code=409, detail="Boundary with same ID but different geometry already exists")

        # Get latest version for this property
        result = await self.session.execute(
            select(BoundaryVersionModel)
            .filter_by(property_id=property_id)
            .order_by(BoundaryVersionModel.version.desc())
            .limit(1)
        )
        latest_boundary = result.scalar_one_or_none()
        new_version = (latest_boundary.version + 1) if latest_boundary else 1

        ewkt = f"SRID=4326;{wkt_str}"

        # Use text() to insert geometry explicitly instead of ORM add() to avoid parsing issues
        from sqlalchemy import text
        insert_stmt = text("""
            INSERT INTO boundary_versions (id, property_id, version, geometry, area_ha, perimeter_km, input_hash, is_confirmed, created_at)
            VALUES (:id, :property_id, :version, ST_GeomFromEWKT(:ewkt), 0.0, 0.0, :input_hash, false, NOW())
            RETURNING created_at
        """)
        
        result = await self.session.execute(insert_stmt, {
            "id": boundary_id,
            "property_id": property_id,
            "version": new_version,
            "ewkt": ewkt,
            "input_hash": input_hash
        })
        created_at = result.scalar()
        
        update_stmt = text("""
            UPDATE boundary_versions 
            SET area_ha = ST_Area(geometry::geography) / 10000, 
                perimeter_km = ST_Perimeter(geometry::geography) / 1000 
            WHERE id = :id
            RETURNING area_ha, perimeter_km
        """)
        
        result = await self.session.execute(update_stmt, {"id": boundary_id})
        row = result.fetchone()
        new_area = row[0] if row else 0.0
        new_perimeter = row[1] if row else 0.0
        
        await self.session.commit()
        
        return BoundaryVersionRead(
            id=boundary_id,
            property_id=property_id,
            version=new_version,
            area_ha=new_area,
            perimeter_km=new_perimeter,
            input_hash=input_hash,
            created_at=created_at  # type: ignore
        )

    async def confirm_boundary(self, property_id: UUID, boundary_id: UUID) -> BoundaryConfirmationRead:
        from sqlalchemy import text
        
        # Check property exists
        result = await self.session.execute(select(PropertyModel).filter_by(id=property_id))
        if not result.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="property not found")
            
        # Check boundary exists for this property
        result = await self.session.execute(
            select(BoundaryVersionModel).filter_by(id=boundary_id, property_id=property_id)
        )
        if not result.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="boundary not found for this property")
            
        # Unconfirm all others
        unconfirm_stmt = text("UPDATE boundary_versions SET is_confirmed = false WHERE property_id = :prop_id AND id != :id")
        await self.session.execute(unconfirm_stmt, {"prop_id": property_id, "id": boundary_id})
        
        # Confirm the specified one
        confirm_stmt = text("UPDATE boundary_versions SET is_confirmed = true WHERE id = :id")
        await self.session.execute(confirm_stmt, {"id": boundary_id})
        
        await self.session.commit()
        return BoundaryConfirmationRead(property_id=property_id, boundary_id=boundary_id, is_confirmed=True)

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
        
        # Load the actual persisted record to ensure we return the existing ID and timestamp
        result = await self.session.execute(
            select(AssessmentModel).filter_by(input_hash=item.input_hash)
        )
        record = result.scalar_one()
        from app.domain.schemas import EligibilityStatus
        return AssessmentRead(
            id=record.id,
            property_id=record.property_id,
            status=EligibilityStatus(record.status),
            score=record.score,
            reasons=record.reasons,
            pending=record.pending,
            ruleset_version=record.ruleset_version,
            input_hash=record.input_hash,
            created_at=record.created_at
        )

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
