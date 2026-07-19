import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { passports as demoPassports, properties as demoProperties } from '../data/demo';
import type { Coordinate, Passport, PropertySummary, SyncOperation } from '../domain/models';
import { areaHectares } from '../utils/geo';

import * as Crypto from 'expo-crypto';

const identifier = () => Crypto.randomUUID();

const queueOperation = (
  outbox: SyncOperation[],
  propertyId: string,
  kind: SyncOperation['kind'],
) => [
  ...outbox.filter((operation) => operation.propertyId !== propertyId || operation.kind !== kind),
  { id: identifier(), propertyId, kind, createdAt: new Date().toISOString(), attempt: 0 },
];

type PropertyState = {
  hydrated: boolean;
  properties: PropertySummary[];
  passports: Record<string, Passport>;
  outbox: SyncOperation[];
  setHydrated: (hydrated: boolean) => void;
  createProperty: () => string;
  addBoundaryPoint: (propertyId: string, point: Coordinate) => void;
  undoBoundaryPoint: (propertyId: string) => void;
  confirmBoundary: (propertyId: string) => void;
  removeOperation: (operationId: string) => void;
  updateSyncStatus: (propertyId: string, status: SyncStatus) => void;
};

export const usePropertyStore = create<PropertyState>()(
  persist(
    (set) => ({
      hydrated: false,
      properties: demoProperties,
      passports: demoPassports,
      outbox: [],
      setHydrated: (hydrated) => set({ hydrated }),
      createProperty: () => {
        const id = identifier();
        const property: PropertySummary = {
          id,
          name: 'Nova área',
          municipality: 'Município pendente',
          state: 'UF',
          areaHa: 0,
          status: 'review',
          landUse: 'Uso ainda não informado',
          boundary: [],
          syncStatus: 'local',
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          properties: [property, ...state.properties],
          outbox: queueOperation(state.outbox, id, 'create_property'),
        }));
        return id;
      },
      addBoundaryPoint: (propertyId, point) =>
        set((state) => ({
          properties: state.properties.map((property) => {
            if (property.id !== propertyId) return property;
            const boundary = [...property.boundary, point];
            return {
              ...property,
              boundary,
              areaHa: areaHectares(boundary),
              syncStatus: 'pending',
            };
          }),
          outbox: queueOperation(state.outbox, propertyId, 'update_boundary'),
        })),
      undoBoundaryPoint: (propertyId) =>
        set((state) => ({
          properties: state.properties.map((property) => {
            if (property.id !== propertyId) return property;
            const boundary = property.boundary.slice(0, -1);
            return { ...property, boundary, areaHa: areaHectares(boundary), syncStatus: 'pending' };
          }),
          outbox: queueOperation(state.outbox, propertyId, 'update_boundary'),
        })),
      confirmBoundary: (propertyId) =>
        set((state) => ({
          properties: state.properties.map((property) =>
            property.id === propertyId
              ? { ...property, status: 'analysis', syncStatus: 'pending' }
              : property,
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
          outbox: queueOperation(state.outbox, propertyId, 'confirm_boundary'),
        })),
      removeOperation: (operationId) =>
        set((state) => ({
          outbox: state.outbox.filter((op) => op.id !== operationId),
        })),
      updateSyncStatus: (propertyId, syncStatus) =>
        set((state) => ({
          properties: state.properties.map((p) =>
            p.id === propertyId ? { ...p, syncStatus } : p
          ),
        })),
    }),
    {
      name: 'demeter-carbono.mobile.v2',
      version: 2,
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
