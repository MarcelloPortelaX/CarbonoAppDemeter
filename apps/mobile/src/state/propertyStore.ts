import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { passports as demoPassports, properties as demoProperties } from '../data/demo';
import type { 
  Coordinate, 
  Passport, 
  PropertySummary, 
  SyncOperation, 
  RemoteStatus,
  ApiPropertyCreate,
  ApiBoundaryCreate
} from '../domain/models';
import { areaHectares } from '../utils/geo';
import * as Crypto from 'expo-crypto';

const identifier = () => Crypto.randomUUID();

export function isPropertyReadyForSync(property: PropertySummary): boolean {
  if (!property.name || !property.municipality || !property.landUse) return false;
  return true;
}

const queueOrUpdateBoundaryOperation = (
  outbox: SyncOperation[],
  propertyId: string,
  boundaryId: string,
  points: Coordinate[]
) => {
  // If there's already an un-synced update_boundary for this boundaryId, just update its payload
  const existingIndex = outbox.findIndex(op => op.kind === 'update_boundary' && op.propertyId === propertyId && op.boundaryId === boundaryId);
  if (existingIndex >= 0) {
    const newOutbox = [...outbox];
    const op = newOutbox[existingIndex] as UpdateBoundaryOperation;
    newOutbox[existingIndex] = { ...op, payload: { boundary_id: boundaryId, points } };
    return newOutbox;
  }
  
  // Otherwise, queue a new one
  return queueOperation(outbox, {
    id: identifier(),
    propertyId,
    boundaryId,
    kind: 'update_boundary',
    payload: { boundary_id: boundaryId, points },
    createdAt: new Date().toISOString(),
    attempt: 0,
    status: 'pending',
  });
};

const queueOperation = (
  outbox: SyncOperation[],
  operation: SyncOperation
) => [
  ...outbox.filter((op) => op.propertyId !== operation.propertyId || op.kind !== operation.kind),
  operation,
];

type PropertyState = {
  hydrated: boolean;
  properties: PropertySummary[];
  passports: Record<string, Passport>;
  outbox: SyncOperation[];
  setHydrated: (hydrated: boolean) => void;
  createPropertyDraft: () => string;
  updatePropertyDraft: (id: string, updates: Partial<PropertySummary>) => void;
  submitPropertyForSync: (id: string) => void;
  addBoundaryPoint: (propertyId: string, point: Coordinate) => void;
  undoBoundaryPoint: (propertyId: string) => void;
  confirmBoundary: (propertyId: string) => void;
  removeOperation: (operationId: string) => void;
  updateRemoteStatus: (propertyId: string, status: RemoteStatus) => void;
  setBoundaryId: (propertyId: string, boundaryId: string) => void;
  incrementOperationAttempt: (operationId: string) => void;
  updateOperationStatus: (operationId: string, status: 'pending' | 'retryable' | 'failed', error?: string) => void;
};

export const usePropertyStore = create<PropertyState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      properties: demoProperties,
      passports: demoPassports,
      outbox: [],
      setHydrated: (hydrated) => set({ hydrated }),
      createPropertyDraft: () => {
        const id = identifier();
        const property: PropertySummary = {
          id,
          name: null,
          municipality: null,
          state: null,
          areaHa: 0,
          status: 'draft',
          landUse: null,
          boundary: [],
          remoteStatus: 'local',
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          properties: [property, ...state.properties],
        }));
        return id;
      },
      updatePropertyDraft: (id, updates) => {
        set((state) => ({
          properties: state.properties.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        }));
      },
      submitPropertyForSync: (id) => {
        const state = get();
        const property = state.properties.find((p) => p.id === id);
        if (!property) return;
        if (!isPropertyReadyForSync(property)) return;

        const payload: ApiPropertyCreate = {
          id: property.id,
          name: property.name!,
          municipality: property.municipality!,
          land_use: property.landUse!,
        };

        set((state) => ({
          properties: state.properties.map((p) => (p.id === id ? { ...p, status: 'analysis', remoteStatus: 'local' } : p)),
          outbox: queueOperation(state.outbox, {
            id: identifier(),
            propertyId: id,
            kind: 'create_property',
            payload,
            createdAt: new Date().toISOString(),
            attempt: 0,
            status: 'pending',
          }),
        }));
      },
      addBoundaryPoint: (propertyId, point) => {
        set((state) => {
          const property = state.properties.find((p) => p.id === propertyId);
          if (!property) return state;
          
          const boundary = [...property.boundary, point];
          // If we don't have a local boundaryId yet, generate one
          const boundaryId = property.boundaryId || identifier();
          
          const updatedProperty = { ...property, boundary, areaHa: areaHectares(boundary), boundaryId };
          
          return {
            properties: state.properties.map((p) => (p.id === propertyId ? updatedProperty : p)),
            outbox: queueOrUpdateBoundaryOperation(state.outbox, propertyId, boundaryId, boundary),
          };
        });
      },
      undoBoundaryPoint: (propertyId) => {
        set((state) => {
          const property = state.properties.find((p) => p.id === propertyId);
          if (!property) return state;
          
          const boundary = property.boundary.slice(0, -1);
          const boundaryId = property.boundaryId || identifier();
          const updatedProperty = { ...property, boundary, areaHa: areaHectares(boundary), boundaryId };

          return {
            properties: state.properties.map((p) => (p.id === propertyId ? updatedProperty : p)),
            outbox: queueOrUpdateBoundaryOperation(state.outbox, propertyId, boundaryId, boundary),
          };
        });
      },
      confirmBoundary: (propertyId) => {
        set((state) => {
          const property = state.properties.find((p) => p.id === propertyId);
          if (!property || !property.boundaryId) return state; 

          return {
            properties: state.properties.map((p) =>
              p.id === propertyId
                ? { ...p, status: 'analysis', boundaryId: undefined } // Clear boundaryId so next edit starts a new version
                : p,
            ),
            passports: {
              ...state.passports,
              [propertyId]: {
                propertyId,
                status: 'analysis',
                resultState: 'blocked',
                pendingCount: 3,
                currentStep: 1,
                disclaimer:
                  'Quantificação ainda não habilitada. Esta triagem não representa emissão de créditos.',
              },
            },
            outbox: queueOperation(state.outbox, {
              id: identifier(),
              propertyId,
              boundaryId: property.boundaryId,
              kind: 'confirm_boundary',
              createdAt: new Date().toISOString(),
              attempt: 0,
              status: 'pending',
            }),
          };
        });
      },
      removeOperation: (operationId) =>
        set((state) => ({
          outbox: state.outbox.filter((op) => op.id !== operationId),
        })),
      updateRemoteStatus: (propertyId, remoteStatus) =>
        set((state) => ({
          properties: state.properties.map((p) =>
            p.id === propertyId ? { ...p, remoteStatus } : p
          ),
        })),
      setBoundaryId: (propertyId, boundaryId) =>
        set((state) => ({
          properties: state.properties.map((p) =>
            p.id === propertyId ? { ...p, boundaryId } : p
          ),
        })),
      incrementOperationAttempt: (operationId) => 
        set((state) => ({
          outbox: state.outbox.map((op) => 
            op.id === operationId ? { ...op, attempt: op.attempt + 1 } : op
          ),
        })),
      updateOperationStatus: (operationId, status, error) =>
        set((state) => ({
          outbox: state.outbox.map((op) => 
            op.id === operationId ? { ...op, status, lastError: error } : op
          ),
        })),
    }),
    {
      name: 'demeter-carbono.mobile.v3', // Incremented version as requested
      version: 3,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        properties: state.properties,
        passports: state.passports,
        outbox: state.outbox,
      }),
      onRehydrateStorage: () => (state) => state?.setHydrated(true),
    },
  ),
);
