export type Coordinate = { latitude: number; longitude: number };
export type LandUse = 'degraded_pasture' | 'agriculture' | 'abandoned' | 'agroforestry' | 'native_vegetation';
export type EligibilityStatus = 'potential' | 'needs_review' | 'not_ready';
export type SyncStatus = 'local' | 'pending' | 'synced' | 'error';

export type TriageAnswers = {
  hasPossessionProof: boolean;
  intendsRestoration: boolean;
  recentClearing: boolean;
};

export type PropertyDraft = {
  name: string;
  municipality: string;
  points: Coordinate[];
  landUse: LandUse;
  answers: TriageAnswers;
};

export type Property = PropertyDraft & {
  id: string;
  createdAt: string;
  syncStatus: SyncStatus;
};

export type EligibilityResult = {
  status: EligibilityStatus;
  title: string;
  summary: string;
  score: number;
  reasons: string[];
  pending: string[];
  rulesetVersion: string;
};
