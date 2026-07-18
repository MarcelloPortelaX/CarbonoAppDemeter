from datetime import UTC, datetime
from enum import StrEnum
from uuid import UUID, uuid4

from pydantic import BaseModel, Field

from app.domain.integrity import IntegrityGateSet
from app.domain.provenance import CalculationProvenance, ResultMaturity
from app.domain.schemas import EligibilityStatus


class PassportStage(StrEnum):
    AREA = "area"
    ELIGIBILITY = "eligibility"
    DOCUMENTATION = "documentation"
    ANALYSIS = "analysis"
    EMISSION = "emission"


class CarbonScenario(BaseModel):
    maturity: ResultMaturity
    label: str
    value_tco2e: float | None = None
    lower_tco2e: float | None = None
    upper_tco2e: float | None = None
    horizon_years: int | None = None
    disclaimer: str
    provenance: CalculationProvenance | None = None

    def public_value(self) -> float | None:
        if self.maturity in {ResultMaturity.SCREENING}:
            return None
        return self.value_tco2e


class PassportRead(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    property_id: UUID
    eligibility: EligibilityStatus
    stage: PassportStage
    pending: list[str]
    integrity: IntegrityGateSet = Field(default_factory=IntegrityGateSet)
    scenario: CarbonScenario
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
