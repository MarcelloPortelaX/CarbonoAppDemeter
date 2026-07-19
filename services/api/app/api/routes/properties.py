from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_repository
from app.application.postgres_repository import PostgresRepository
from app.domain.schemas import PropertyCreate, PropertyRead

router = APIRouter()


@router.post("", response_model=PropertyRead, status_code=status.HTTP_201_CREATED)
async def create_property(
    payload: PropertyCreate, repo: PostgresRepository = Depends(get_repository)
) -> PropertyRead:
    item = PropertyRead(**payload.model_dump())
    return await repo.save_property(item)


@router.get("", response_model=list[PropertyRead])
async def list_properties(repo: PostgresRepository = Depends(get_repository)) -> list[PropertyRead]:
    return await repo.list_properties()


@router.get("/{property_id}", response_model=PropertyRead)
async def get_property(
    property_id: UUID, repo: PostgresRepository = Depends(get_repository)
) -> PropertyRead:
    item = await repo.get_property(property_id)
    if item is None:
        raise HTTPException(status_code=404, detail="property not found")
    return item
