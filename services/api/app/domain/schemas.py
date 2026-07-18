from datetime import UTC, datetime
from enum import StrEnum
from uuid import UUID, uuid4

from pydantic import BaseModel, Field, model_validator


class LandUse(StrEnum):
    DEGRADED_PASTURE = "degraded_pasture"
    AGRICULTURE = "agriculture"
    ABANDONED = "abandoned"
    AGROFORESTRY = "agroforestry"
    NATIVE_VEGETATION = "native_vegetation"


class EligibilityStatus(StrEnum):
    POTENTIAL = "potential"
    NEEDS_REVIEW = "needs_review"
    NOT_READY = "not_ready"


class Position(BaseModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)


class PropertyCreate(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    name: str = Field(min_length=3, max_length=120)
    municipality: str = Field(min_length=2, max_length=160)
    points: list[Position] = Field(min_length=3, max_length=5000)
    land_use: LandUse
    has_possession_proof: bool = False
    intends_restoration: bool = False
    recent_clearing: bool = False

    @model_validator(mode="after")
    def validate_distinct_points(self):
        unique = {(point.latitude, point.longitude) for point in self.points}
        if len(unique) < 3:
            raise ValueError("polygon requires at least three distinct points")
        return self


class PropertyRead(PropertyCreate):
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class AssessmentRead(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    property_id: UUID
    status: EligibilityStatus
    score: int = Field(ge=0, le=100)
    reasons: list[str]
    pending: list[str]
    ruleset_version: str
    input_hash: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
