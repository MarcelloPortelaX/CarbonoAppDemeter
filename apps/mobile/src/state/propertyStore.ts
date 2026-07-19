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
} from '../domain/models';
import { areaHectares } from '../utils/geo';
import * as Crypto from 'expo-crypto';

const identifier = () => Crypto.randomUUID();

export function isPropertyReadyForSync(property: PropertySummary): boolean {
  if (!property.name || !property.municipality || !property.landUse) return false;
  return true;
}

const isBoundaryReadyForSync = (points: Coordinate[]): boolean => {
  // Simple validation for MVP: must have at least 3 points and area > 0
  if (points.length < 3) return false;
  if (areaHectares(points) <= 0) return false;
  // Checking self-intersection in JS is complex for MVP, so we assume backend does it or user drew correctly.
  return true;
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
  submitAssessment: (propertyId: string, payload: import('../domain/models').ApiAssessmentCreate) => void;
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
            outbox: isBoundaryReadyForSync(property.boundary) 
              ? queueOperation(
                  queueOperation(state.outbox, {
                    id: identifier(),
                    propertyId,
                    boundaryId: property.boundaryId,
                    kind: 'update_boundary',
                    payload: { boundary_id: property.boundaryId, points: property.boundary },
                    createdAt: new Date().toISOString(),
                    attempt: 0,
                    status: 'pending',
                  }),
                  {
                    id: identifier(),
                    propertyId,
                    boundaryId: property.boundaryId,
                    kind: 'confirm_boundary',
                    createdAt: new Date().toISOString(),
                    attempt: 0,
                    status: 'pending',
                  }
                )
              : state.outbox,
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
      updateOperationStatus: (operationId, status, error) => {
        set((state) => ({
          outbox: state.outbox.map((op) =>
            op.id === operationId ? { ...op, status, lastError: error } : op
          ),
        }));
      },
      submitAssessment: (propertyId, payload) => {
        const id = identifier();
        set((state) => ({
          outbox: queueOperation(state.outbox, {
            id,
            kind: 'submit_assessment',
            propertyId,
            payload,
            status: 'pending',
            attempt: 0,
            createdAt: new Date().toISOString(),
          }),
        }));
      },
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
      migrate: (persistedState: unknown, version: number) => {
        try {
          if (!persistedState || typeof persistedState !== 'object') {
            return { properties: demoProperties, passports: demoPassports, outbox: [] } as unknown as PropertyState;
          }
          
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let state = persistedState as any;
          
          if (version < 3) {
            // Convert syncStatus to remoteStatus
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            state.properties = Array.isArray(state.properties) ? state.properties.map((p: any) => {
              const remoteStatus = p.syncStatus === 'synced' ? 'created' : (p.syncStatus === 'error' ? 'error' : 'local');
              delete p.syncStatus;
              return { ...p, remoteStatus };
            }) : [];
            // For operations, mark unknown ones as failed, though they should be compatible
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            state.outbox = Array.isArray(state.outbox) ? state.outbox.map((op: any) => ({
              ...op,
              status: op.status === 'failed' ? 'failed' : op.status || 'pending'
            })) : [];
          }
          
          // Ensure arrays/objects exist
          state.properties = Array.isArray(state.properties) ? state.properties : [];
          state.passports = state.passports && typeof state.passports === 'object' ? state.passports : {};
          state.outbox = Array.isArray(state.outbox) ? state.outbox : [];
          
          return state as PropertyState;
        } catch (e) {
          console.warn('Failed to migrate state, resetting to default', e);
          return {
            hydrated: true, // will be handled by onRehydrateStorage but safe to have
            properties: demoProperties,
            passports: demoPassports,
            outbox: [],
          } as unknown as PropertyState;
        }
      },
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.warn('Failed to hydrate state', error);
        }
        console.log('BOOT: store hydration');
        usePropertyStore.setState({ hydrated: true });
      },
    },
  ),
);
