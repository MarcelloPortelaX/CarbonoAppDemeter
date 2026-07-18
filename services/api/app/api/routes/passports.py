from uuid import UUID

from fastapi import APIRouter, HTTPException

from app.application.memory_repository import repository
from app.application.passport_service import build_passport
from app.domain.eligibility import assess
from app.domain.passport import PassportRead

router = APIRouter()


@router.get("/properties/{property_id}", response_model=PassportRead)
def get_passport(property_id: UUID) -> PassportRead:
    property_data = repository.get_property(property_id)
    if property_data is None:
        raise HTTPException(status_code=404, detail="property not found")
    assessment = assess(property_data)
    return build_passport(assessment)
