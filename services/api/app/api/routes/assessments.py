from uuid import UUID

from fastapi import APIRouter, HTTPException, status

from app.application.memory_repository import repository
from app.domain.eligibility import assess
from app.domain.schemas import AssessmentRead

router = APIRouter()


@router.post(
    "/properties/{property_id}", response_model=AssessmentRead, status_code=status.HTTP_201_CREATED
)
def create_assessment(property_id: UUID) -> AssessmentRead:
    item = repository.get_property(property_id)
    if item is None:
        raise HTTPException(status_code=404, detail="property not found")
    assessment = assess(item)
    return repository.save_assessment(assessment)
