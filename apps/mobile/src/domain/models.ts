export type PropertyStatus = 'analysis' | 'documentation' | 'eligible' | 'review';
export type CarbonResultState = 'blocked' | 'demo' | 'screening' | 'validated';
export type SyncStatus = 'local' | 'pending' | 'synced' | 'error';

export type Coordinate = { latitude: number; longitude: number };

export type PropertySummary = {
  id: string;
  name: string;
  municipality: string;
  state: string;
  areaHa: number;
  status: PropertyStatus;
  landUse: string;
  boundary: Coordinate[];
  syncStatus: SyncStatus;
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

export type SyncOperation = {
  id: string;
  propertyId: string;
  kind: 'create_property' | 'update_boundary' | 'confirm_boundary';
  createdAt: string;
  attempt: number;
};
