from app.domain.passport import CarbonScenario, PassportRead, PassportStage
from app.domain.provenance import ResultMaturity
from app.domain.schemas import AssessmentRead

DISCLAIMER = (
    "Triagem técnica preliminar. Não representa validação, verificação, certificação, "
    "emissão ou promessa de comercialização de créditos de carbono."
)


def build_passport(assessment: AssessmentRead) -> PassportRead:
    stage = PassportStage.DOCUMENTATION if assessment.pending else PassportStage.ANALYSIS
    scenario = CarbonScenario(
        maturity=ResultMaturity.SCREENING,
        label="Quantificação ainda não habilitada",
        disclaimer=DISCLAIMER,
    )
    return PassportRead(
        property_id=assessment.property_id,
        eligibility=assessment.status,
        stage=stage,
        pending=assessment.pending,
        scenario=scenario,
    )
