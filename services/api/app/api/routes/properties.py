from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_repository
from app.application.postgres_repository import PostgresRepository
from app.domain.schemas import BoundaryConfirmationRead, BoundaryCreate, BoundaryVersionRead, PropertyCreate, PropertyRead

router = APIRouter()


@router.post("", response_model=PropertyRead, status_code=status.HTTP_201_CREATED)
async def create_property(
    creation_request: PropertyCreate, repo: PostgresRepository = Depends(get_repository)
) -> PropertyRead:
    return await repo.save_property(creation_request)


@router.get("", response_model=list[PropertyRead])
async def list_properties(repo: PostgresRepository = Depends(get_repository)) -> list[PropertyRead]:
    return await repo.list_properties()


@router.get("/{property_id}", response_model=PropertyRead)
async def get_property(
    property_id: UUID, repo: PostgresRepository = Depends(get_repository)
) -> PropertyRead:
    property_record = await repo.get_property(property_id)
    if property_record is None:
        raise HTTPException(status_code=404, detail="property not found")
    return property_record


@router.post("/{property_id}/boundaries", response_model=BoundaryVersionRead, status_code=status.HTTP_200_OK)
async def create_boundary(
    property_id: UUID, boundary_request: BoundaryCreate, repo: PostgresRepository = Depends(get_repository)
) -> BoundaryVersionRead:
    property_record = await repo.get_property(property_id)
    if property_record is None:
        raise HTTPException(status_code=404, detail="property not found")
        
    return await repo.save_boundary(property_id, boundary_request)

@router.post("/{property_id}/boundaries/{boundary_id}/confirm", response_model=BoundaryConfirmationRead, status_code=status.HTTP_200_OK)
async def confirm_boundary(
    property_id: UUID, boundary_id: UUID, repo: PostgresRepository = Depends(get_repository)
) -> BoundaryConfirmationRead:
    return await repo.confirm_boundary(property_id, boundary_id)
