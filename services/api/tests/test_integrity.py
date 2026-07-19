from uuid import uuid4

from app.application.passport_service import build_passport
from app.domain.eligibility import assess
from app.domain.integrity import GateStatus, IntegrityGateSet
from app.domain.provenance import ResultMaturity
from app.domain.schemas import AssessmentInput, LandUse


def sample_property() -> AssessmentInput:
    return AssessmentInput(
        property_id=uuid4(),
        land_use=LandUse.DEGRADED_PASTURE,
        has_possession_proof=True,
        intends_restoration=True,
        recent_clearing=False,
    )


def test_screening_passport_has_no_public_carbon_value():
    passport = build_passport(assess(sample_property()))
    assert passport.scenario.maturity == ResultMaturity.SCREENING
    assert passport.scenario.public_value() is None


def test_integrity_gate_set_blocks_until_all_internal_gates_pass():
    gates = IntegrityGateSet()
    assert gates.ready_for_external_validation() is False
    for gate in gates.gates:
        gate.status = (
            GateStatus.EXTERNAL_REQUIRED
            if gate.key == "independent_validation_verification"
            else GateStatus.PASSED
        )
    assert gates.ready_for_external_validation() is True
