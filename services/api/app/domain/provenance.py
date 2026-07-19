import hashlib
import json
from datetime import UTC, datetime
from enum import StrEnum
from typing import Any

from pydantic import BaseModel, Field


class ResultMaturity(StrEnum):
    SCREENING = "screening"
    SCENARIO = "scenario"
    ESTIMATE = "estimate"
    VERIFIED = "verified"
    ISSUED = "issued"


class SourceReference(BaseModel):
    source_id: str = Field(min_length=3)
    title: str
    organization: str
    url: str
    version: str | None = None
    accessed_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class CalculationProvenance(BaseModel):
    run_id: str
    maturity: ResultMaturity
    methodology_id: str
    methodology_version: str
    calculation_enabled: bool
    input_hash: str
    code_version: str
    units: dict[str, str]
    uncertainty: dict[str, float | str] | None = None
    sources: list[SourceReference]
    reviewer_id: str | None = None
    reviewed_at: datetime | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    def may_show_as_credit(self) -> bool:
        return self.maturity == ResultMaturity.ISSUED and self.reviewer_id is not None


def canonical_hash(document: Any) -> str:
    serialized = json.dumps(document, sort_keys=True, separators=(",", ":"), default=str)
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()
