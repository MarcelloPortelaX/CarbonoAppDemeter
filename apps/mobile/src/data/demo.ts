import { Passport, PropertySummary } from '../domain/models';

export const properties: PropertySummary[] = [
  {
    id: 'boa-esperanca', name: 'Fazenda Boa Esperança', municipality: 'São Gabriel do Oeste', state: 'MS',
    areaHa: 420.35, status: 'analysis', landUse: 'Pastagem degradada', syncStatus: 'synced',
    createdAt: '2026-07-01T09:00:00.000Z', demo: true,
    boundary: [
      { latitude: -19.4200, longitude: -54.5700 }, { latitude: -19.4140, longitude: -54.5580 },
      { latitude: -19.4240, longitude: -54.5510 }, { latitude: -19.4330, longitude: -54.5580 },
      { latitude: -19.4370, longitude: -54.5680 }, { latitude: -19.4290, longitude: -54.5760 },
    ],
  },
  {
    id: 'verde-vivo', name: 'Sítio Verde Vivo', municipality: 'Corumbá', state: 'MS', areaHa: 180,
    status: 'documentation', landUse: 'Agrofloresta', boundary: [], syncStatus: 'pending',
    createdAt: '2026-07-03T14:30:00.000Z', demo: true,
  },
  {
    id: 'santa-clara', name: 'Fazenda Santa Clara', municipality: 'Rio Verde', state: 'GO', areaHa: 310,
    status: 'eligible', landUse: 'Área em restauração', boundary: [], syncStatus: 'synced',
    createdAt: '2026-07-05T11:15:00.000Z', demo: true,
  },
];

export const passports: Record<string, Passport> = {
  'boa-esperanca': {
    propertyId: 'boa-esperanca', status: 'analysis', resultState: 'demo', demoPotentialTco2e: 2850,
    horizonYears: 20, pendingCount: 2, currentStep: 2,
    disclaimer: 'Cenário demonstrativo. Não representa crédito emitido, certificado ou disponível para venda.',
  },
};
