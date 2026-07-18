from uuid import UUID

from fastapi import APIRouter, HTTPException, status

from app.application.memory_repository import repository
from app.domain.schemas import PropertyCreate, PropertyRead

router = APIRouter()


@router.post("", response_model=PropertyRead, status_code=status.HTTP_201_CREATED)
def create_property(payload: PropertyCreate) -> PropertyRead:
    item = PropertyRead(**payload.model_dump())
    return repository.save_property(item)


@router.get("", response_model=list[PropertyRead])
def list_properties() -> list[PropertyRead]:
    return repository.list_properties()


@router.get("/{property_id}", response_model=PropertyRead)
def get_property(property_id: UUID) -> PropertyRead:
    item = repository.get_property(property_id)
    if item is None:
        raise HTTPException(status_code=404, detail="property not found")
    return item
