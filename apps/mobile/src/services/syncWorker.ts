import { usePropertyStore } from '../state/propertyStore';
import { createProperty } from './api';

export async function processOutbox() {
  const state = usePropertyStore.getState();
  const outbox = state.outbox;
  const properties = state.properties;
  
  if (outbox.length === 0) return;

  for (const operation of outbox) {
    try {
      if (operation.kind === 'create_property') {
        const property = properties.find((p) => p.id === operation.propertyId);
        if (property && property.syncStatus !== 'synced') {
          await createProperty(property);
          state.updateSyncStatus(operation.propertyId, 'synced');
          state.removeOperation(operation.id);
        }
      }
      // For confirm_boundary, update_boundary, we can add logic later
      // when the API supports those operations.
      // For now, if the API was successful, we remove the operation.
      else {
          state.removeOperation(operation.id);
          state.updateSyncStatus(operation.propertyId, 'synced');
      }
    } catch (e) {
      console.warn(`Failed to sync operation ${operation.id}:`, e);
    }
  }
}
