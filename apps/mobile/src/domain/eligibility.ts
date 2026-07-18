import type { EligibilityResult, Property } from './types';

export const RULESET_VERSION = 'demeter-triage-0.1.0';

export function assessEligibility(property: Property): EligibilityResult {
  let score = 0;
  const reasons: string[] = [];
  const pending: string[] = [];

  if (['degraded_pasture', 'abandoned', 'agriculture'].includes(property.landUse)) {
    score += 35;
    reasons.push('O uso declarado pode justificar análise de restauração ou transição produtiva.');
  } else if (property.landUse === 'agroforestry') {
    score += 20;
    reasons.push('O sistema agroflorestal existente exige avaliação de linha de base e adicionalidade.');
  } else {
    reasons.push('Vegetação nativa existente não implica remoção adicional automaticamente.');
    pending.push('Avaliar conservação, conformidade e alternativas além de créditos de remoção.');
  }

  if (property.answers.intendsRestoration) {
    score += 30;
    reasons.push('Existe intenção declarada de aumentar ou restaurar cobertura vegetal.');
  } else {
    pending.push('Definir intervenção futura e responsável pela execução.');
  }

  if (property.answers.hasPossessionProof) {
    score += 25;
    reasons.push('Foi declarada existência de documento de vínculo com a área.');
  } else {
    pending.push('Comprovar vínculo, autorização e titularidade dos benefícios ambientais.');
  }

  if (property.answers.recentClearing) {
    score -= 45;
    reasons.push('Supressão recente declarada exige revisão técnica e jurídica antes de qualquer enquadramento.');
    pending.push('Verificar histórico de uso do solo e regularidade da supressão declarada.');
  }

  if (property.points.length < 3) pending.push('Completar perímetro geográfico válido.');
  pending.push('Validar linha de base, adicionalidade, permanência, vazamento e metodologia aplicável.');

  const normalized = Math.max(0, Math.min(100, score));
  if (property.answers.recentClearing || normalized < 30) {
    return { status: 'not_ready', title: 'Ainda não está pronta para agrupamento', summary: 'Há riscos ou lacunas que precisam de revisão antes da análise de projeto.', score: normalized, reasons, pending, rulesetVersion: RULESET_VERSION };
  }
  if (normalized < 70) {
    return { status: 'needs_review', title: 'Potencial condicionado', summary: 'A área pode seguir para revisão, mas faltam evidências e definições importantes.', score: normalized, reasons, pending, rulesetVersion: RULESET_VERSION };
  }
  return { status: 'potential', title: 'Potencial preliminar identificado', summary: 'A área possui sinais iniciais compatíveis com uma avaliação técnica de restauração ou agrofloresta.', score: normalized, reasons, pending, rulesetVersion: RULESET_VERSION };
}
