import { usePropertyStore } from '../state/propertyStore';
import { createProperty, updateBoundary, confirmBoundary } from './api';

export async function processOutbox() {
  const state = usePropertyStore.getState();
  const outbox = [...state.outbox];
  const properties = state.properties;
  
  if (outbox.length === 0) return;

  for (const operation of outbox) {
    try {
      const property = properties.find((p) => p.id === operation.propertyId);
      
      if (!property) {
        // Obsolete operation for deleted property
        state.removeOperation(operation.id);
        continue;
      }

      if (operation.kind === 'create_property') {
        if (property.syncStatus !== 'synced') {
          await createProperty(property);
          state.updateSyncStatus(operation.propertyId, 'synced');
        }
      } else if (operation.kind === 'update_boundary') {
        // Only update boundary if the property creation is synced
        if (property.syncStatus === 'synced') {
          await updateBoundary(property.id, property.boundary);
        } else {
          // Skip for now, let create_property finish in next pass
          continue; 
        }
      } else if (operation.kind === 'confirm_boundary') {
        if (property.syncStatus === 'synced') {
          await confirmBoundary(property.id);
        } else {
          continue;
        }
      }
      
      // If we reach here without throwing, operation succeeded
      state.removeOperation(operation.id);

    } catch (e: any) {
      console.warn(`Failed to sync operation ${operation.id}:`, e);
      if (e.status && e.status >= 400 && e.status < 500) {
        // Unrecoverable business error (e.g. 422, 400). Stop retrying.
        state.updateSyncStatus(operation.propertyId, 'error');
        // We keep it in the outbox so the user can see it failed permanently or we can remove it.
        // For strict semantics: we remove it from outbox but mark property as error so user knows.
        state.removeOperation(operation.id);
      }
      // For 5xx or network errors, we leave it in the outbox to retry later.
    }
  }
}
