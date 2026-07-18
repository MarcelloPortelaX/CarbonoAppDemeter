from app.domain.eligibility import RULESET_VERSION, assess
from app.domain.schemas import EligibilityStatus, LandUse, Position, PropertyCreate


def candidate(**overrides):
    data = {
        "name": "Área Piloto",
        "municipality": "Lavras - MG",
        "points": [
            Position(latitude=-21.2, longitude=-44.9),
            Position(latitude=-21.21, longitude=-44.91),
            Position(latitude=-21.22, longitude=-44.9),
        ],
        "land_use": LandUse.DEGRADED_PASTURE,
        "has_possession_proof": True,
        "intends_restoration": True,
        "recent_clearing": False,
    }
    data.update(overrides)
    return PropertyCreate(**data)


def test_candidate_has_preliminary_potential() -> None:
    result = assess(candidate())
    assert result.status == EligibilityStatus.POTENTIAL
    assert result.ruleset_version == RULESET_VERSION
    assert len(result.input_hash) == 64


def test_recent_clearing_blocks_candidate() -> None:
    result = assess(candidate(recent_clearing=True))
    assert result.status == EligibilityStatus.NOT_READY
