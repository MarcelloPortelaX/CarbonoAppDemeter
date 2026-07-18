from enum import StrEnum

from pydantic import BaseModel, Field


class GateStatus(StrEnum):
    NOT_STARTED = "not_started"
    IN_REVIEW = "in_review"
    PASSED = "passed"
    FAILED = "failed"
    EXTERNAL_REQUIRED = "external_required"


class IntegrityGate(BaseModel):
    key: str
    status: GateStatus = GateStatus.NOT_STARTED
    evidence_ids: list[str] = Field(default_factory=list)
    rationale: str | None = None


REQUIRED_GATE_KEYS = (
    "applicability",
    "legal_rights",
    "baseline",
    "additionality",
    "project_boundary",
    "leakage",
    "permanence",
    "robust_quantification",
    "no_double_counting",
    "safeguards",
    "independent_validation_verification",
)


class IntegrityGateSet(BaseModel):
    gates: list[IntegrityGate] = Field(
        default_factory=lambda: [IntegrityGate(key=key) for key in REQUIRED_GATE_KEYS]
    )

    def blocking_keys(self) -> list[str]:
        return [gate.key for gate in self.gates if gate.status not in {GateStatus.PASSED}]

    def ready_for_external_validation(self) -> bool:
        for gate in self.gates:
            if gate.key == "independent_validation_verification":
                continue
            if gate.status != GateStatus.PASSED:
                return False
        return True
