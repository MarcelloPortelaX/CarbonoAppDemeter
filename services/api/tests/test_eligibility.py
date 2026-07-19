from uuid import uuid4
from app.domain.eligibility import RULESET_VERSION, assess
from app.domain.schemas import EligibilityStatus, LandUse, AssessmentInput


def candidate(**overrides):
    data = {
        "property_id": uuid4(),
        "land_use": LandUse.DEGRADED_PASTURE,
        "has_possession_proof": True,
        "intends_restoration": True,
        "recent_clearing": False,
    }
    data.update(overrides)
    return AssessmentInput(**data)


def test_candidate_has_preliminary_potential() -> None:
    result = assess(candidate())
    assert result.status == EligibilityStatus.POTENTIAL
    assert result.ruleset_version == RULESET_VERSION
    assert len(result.input_hash) == 64


def test_recent_clearing_blocks_candidate() -> None:
    result = assess(candidate(recent_clearing=True))
    assert result.status == EligibilityStatus.NOT_READY
