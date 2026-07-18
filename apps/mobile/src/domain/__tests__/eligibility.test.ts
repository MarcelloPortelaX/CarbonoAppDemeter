import { assessEligibility } from '../eligibility';
import type { Property } from '../types';

function property(overrides: Partial<Property> = {}): Property {
  return {
    id: 'test', name: 'Área', municipality: 'Lavras - MG', createdAt: '2026-07-17T00:00:00Z', syncStatus: 'local',
    points: [{ latitude: -21.2, longitude: -44.9 }, { latitude: -21.21, longitude: -44.91 }, { latitude: -21.22, longitude: -44.9 }],
    landUse: 'degraded_pasture', answers: { hasPossessionProof: true, intendsRestoration: true, recentClearing: false }, ...overrides
  };
}

test('classifies a well formed restoration candidate as preliminary potential', () => {
  expect(assessEligibility(property()).status).toBe('potential');
});

test('recent clearing blocks preliminary grouping', () => {
  expect(assessEligibility(property({ answers: { hasPossessionProof: true, intendsRestoration: true, recentClearing: true } })).status).toBe('not_ready');
});
