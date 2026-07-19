import hashlib
import json

from app.domain.schemas import AssessmentRead, EligibilityStatus, LandUse, AssessmentInput

RULESET_VERSION = "demeter-triage-0.1.0"


def canonical_hash(value: AssessmentInput) -> str:
    payload = json.dumps(value.model_dump(mode="json"), sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def assess(property_data: AssessmentInput) -> AssessmentRead:
    score = 0
    reasons: list[str] = []
    pending: list[str] = []

    if property_data.land_use in {LandUse.DEGRADED_PASTURE, LandUse.ABANDONED, LandUse.AGRICULTURE}:
        score += 35
        reasons.append(
            "O uso declarado pode justificar análise de restauração ou transição produtiva."
        )
    elif property_data.land_use == LandUse.AGROFORESTRY:
        score += 20
        reasons.append("O sistema existente exige avaliação de linha de base e adicionalidade.")
    else:
        reasons.append("Vegetação nativa existente não implica remoção adicional automaticamente.")
        pending.append("Avaliar conservação e alternativas além de créditos de remoção.")

    if property_data.intends_restoration:
        score += 30
        reasons.append("Existe intenção declarada de aumentar ou restaurar cobertura vegetal.")
    else:
        pending.append("Definir intervenção futura e responsável pela execução.")

    if property_data.has_possession_proof:
        score += 25
        reasons.append("Foi declarada existência de documento de vínculo com a área.")
    else:
        pending.append("Comprovar vínculo e titularidade dos benefícios ambientais.")

    if property_data.recent_clearing:
        score -= 45
        reasons.append("Supressão recente exige revisão técnica e jurídica.")
        pending.append("Verificar histórico de uso do solo e regularidade da supressão.")

    pending.append("Validar linha de base, adicionalidade, permanência, vazamento e metodologia.")
    score = max(0, min(100, score))

    if property_data.recent_clearing or score < 30:
        status = EligibilityStatus.NOT_READY
    elif score < 70:
        status = EligibilityStatus.NEEDS_REVIEW
    else:
        status = EligibilityStatus.POTENTIAL

    return AssessmentRead(
        property_id=property_data.property_id,
        status=status,
        score=score,
        reasons=reasons,
        pending=pending,
        ruleset_version=RULESET_VERSION,
        input_hash=canonical_hash(property_data),
    )
