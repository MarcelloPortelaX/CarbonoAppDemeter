import { z } from 'zod';

export type PropertyStatus = 'draft' | 'analysis' | 'documentation' | 'eligible' | 'review';
export type CarbonResultState = 'blocked' | 'demo' | 'screening' | 'validated';
export type RemoteStatus = 'local' | 'created' | 'error';

export type Coordinate = { latitude: number; longitude: number };

export type MapViewport = Coordinate & {
  latitudeDelta: number;
  longitudeDelta: number;
};

export const LandUseSchema = z.enum([
  'degraded_pasture',
  'agriculture',
  'abandoned',
  'agroforestry',
  'native_vegetation',
]);
export type LandUse = z.infer<typeof LandUseSchema>;

export const ApiPropertyReadSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  municipality: z.string(),
  land_use: LandUseSchema,
  version: z.number().int(),
  created_at: z.string(),
});
export type ApiPropertyRead = z.infer<typeof ApiPropertyReadSchema>;

export const ApiBoundaryVersionReadSchema = z.object({
  id: z.string().uuid(),
  property_id: z.string().uuid(),
  version: z.number().int(),
  area_ha: z.number(),
  perimeter_km: z.number(),
  input_hash: z.string(),
  created_at: z.string(),
});
export type ApiBoundaryVersionRead = z.infer<typeof ApiBoundaryVersionReadSchema>;

export const ApiBoundaryConfirmationReadSchema = z.object({
  property_id: z.string().uuid(),
  boundary_id: z.string().uuid(),
  is_confirmed: z.boolean(),
});
export type ApiBoundaryConfirmationRead = z.infer<typeof ApiBoundaryConfirmationReadSchema>;

export const ApiAssessmentCreateSchema = z.object({
  has_possession_proof: z.boolean(),
  intends_restoration: z.boolean(),
  recent_clearing: z.boolean(),
});
export type ApiAssessmentCreate = z.infer<typeof ApiAssessmentCreateSchema>;

export const SourceReferenceSchema = z.object({
  source_id: z.string(),
  title: z.string(),
  organization: z.string(),
  url: z.string(),
  version: z.string().nullable(),
  accessed_at: z.string(),
});

export const CalculationProvenanceSchema = z.object({
  run_id: z.string().uuid(),
  maturity: z.enum([
    'screening',
    'scenario',
    'estimate',
    'verified',
    'issued',
  ]),
  methodology_id: z.string(),
  methodology_version: z.string(),
  calculation_enabled: z.boolean(),
  input_hash: z.string(),
  code_version: z.string(),
  units: z.record(z.string(), z.string()),
  uncertainty: z
    .record(z.string(), z.union([z.number(), z.string()]))
    .nullable(),
  sources: z.array(SourceReferenceSchema),
  reviewer_id: z.string().nullable(),
  reviewed_at: z.string().nullable(),
  created_at: z.string(),
});
export type CalculationProvenance = z.infer<typeof CalculationProvenanceSchema>;

export const ApiPassportReadSchema = z.object({
  id: z.string().uuid(),
  property_id: z.string().uuid(),
  eligibility: z.enum(['potential', 'needs_review', 'not_ready']),
  stage: z.enum(['area', 'eligibility', 'documentation', 'analysis', 'emission']),
  pending: z.array(z.string()),
  integrity: z.object({
    gates: z.array(
      z.object({
        key: z.string(),
        status: z.enum(['not_started', 'in_review', 'passed', 'failed', 'external_required']),
        evidence_ids: z.array(z.string()),
        rationale: z.string().nullable(),
      })
    ),
  }),
  scenario: z.object({
    maturity: z.enum(['screening', 'scenario', 'estimate', 'verified', 'issued']),
    label: z.string(),
    value_tco2e: z.number().nullable(),
    lower_tco2e: z.number().nullable(),
    upper_tco2e: z.number().nullable(),
    horizon_years: z.number().nullable(),
    disclaimer: z.string(),
    provenance: CalculationProvenanceSchema.nullable(),
  }),
  created_at: z.string(),
  updated_at: z.string(),
});
export type ApiPassportRead = z.infer<typeof ApiPassportReadSchema>;

export type PropertySummary = {
  id: string;
  name: string | null;
  municipality: string | null;
  state: string | null;
  areaHa: number;
  status: PropertyStatus;
  landUse: LandUse | null;
  boundary: Coordinate[];
  mapViewport?: MapViewport;
  boundaryId?: string; // Stable UUID for boundary version
  remoteStatus: RemoteStatus;
  createdAt: string;
  demo?: boolean;
};

export type Passport = {
  propertyId: string;
  status: PropertyStatus;
  resultState: CarbonResultState;
  demoPotentialTco2e?: number;
  horizonYears?: number;
  pendingCount: number;
  currentStep: 0 | 1 | 2 | 3 | 4;
  disclaimer: string;
};

// Immutable Operations
export type ApiPropertyCreate = {
  id: string;
  name: string;
  municipality: string;
  land_use: LandUse;
};

export type ApiBoundaryCreate = {
  boundary_id?: string;
  points: Coordinate[];
};

export type CreatePropertyOperation = {
  id: string;
  kind: 'create_property';
  propertyId: string;
  payload: ApiPropertyCreate;
  status: 'pending' | 'retryable' | 'failed';
  attempt: number;
  createdAt: string;
  lastError?: string;
};

export type UpdateBoundaryOperation = {
  id: string;
  kind: 'update_boundary';
  propertyId: string;
  boundaryId: string;
  payload: ApiBoundaryCreate;
  status: 'pending' | 'retryable' | 'failed';
  attempt: number;
  createdAt: string;
  lastError?: string;
};

export type ConfirmBoundaryOperation = {
  id: string;
  kind: 'confirm_boundary';
  propertyId: string;
  boundaryId: string;
  status: 'pending' | 'retryable' | 'failed';
  attempt: number;
  createdAt: string;
  lastError?: string;
};

export type SubmitAssessmentOperation = {
  id: string;
  kind: 'submit_assessment';
  propertyId: string;
  payload: ApiAssessmentCreate;
  status: 'pending' | 'retryable' | 'failed';
  attempt: number;
  createdAt: string;
  lastError?: string;
};

export type SyncOperation = CreatePropertyOperation | UpdateBoundaryOperation | ConfirmBoundaryOperation | SubmitAssessmentOperation;
