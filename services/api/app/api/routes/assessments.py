from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_repository
from app.application.postgres_repository import PostgresRepository
from app.domain.eligibility import assess
from app.domain.schemas import AssessmentRead

router = APIRouter()


@router.post(
    "/properties/{property_id}", response_model=AssessmentRead, status_code=status.HTTP_201_CREATED
)
async def create_assessment(
    property_id: UUID, repo: PostgresRepository = Depends(get_repository)
) -> AssessmentRead:
    item = await repo.get_property(property_id)
    if item is None:
        raise HTTPException(status_code=404, detail="property not found")
    assessment = assess(item)
    return await repo.save_assessment(assessment)
