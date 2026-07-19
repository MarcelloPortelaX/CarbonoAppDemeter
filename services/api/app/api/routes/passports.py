from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import get_repository
from app.application.postgres_repository import PostgresRepository
from app.application.passport_service import build_passport
from app.domain.eligibility import assess
from app.domain.passport import PassportRead

router = APIRouter()


@router.get("/properties/{property_id}", response_model=PassportRead)
async def get_passport(
    property_id: UUID, repo: PostgresRepository = Depends(get_repository)
) -> PassportRead:
    property_data = await repo.get_property(property_id)
    if property_data is None:
        raise HTTPException(status_code=404, detail="property not found")
    assessment = assess(property_data)
    return build_passport(assessment)
