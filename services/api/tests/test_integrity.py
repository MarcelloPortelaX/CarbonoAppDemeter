from app.application.passport_service import build_passport
from app.domain.eligibility import assess
from app.domain.integrity import GateStatus, IntegrityGateSet
from app.domain.provenance import ResultMaturity
from app.domain.schemas import LandUse, Position, PropertyCreate


def sample_property() -> PropertyCreate:
    return PropertyCreate(
        name="Área sintética",
        municipality="Lavras",
        points=[
            Position(latitude=-21.24, longitude=-44.99),
            Position(latitude=-21.24, longitude=-44.98),
            Position(latitude=-21.25, longitude=-44.98),
        ],
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
