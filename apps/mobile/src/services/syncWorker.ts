import { usePropertyStore } from '../state/propertyStore';
import { createProperty, updateBoundary, confirmBoundary, ApiError } from './api';

export async function processOutbox() {
  const state = usePropertyStore.getState();
  const outbox = [...state.outbox];
  const properties = state.properties;
  
  if (outbox.length === 0) return;

  for (const operation of outbox) {
    try {
      const property = properties.find((p) => p.id === operation.propertyId);
      
      if (!property) {
        // Obsolete operation for deleted property, but we must log it before dropping
        console.warn(`Dropping operation ${operation.id} because property ${operation.propertyId} was deleted locally`);
        state.removeOperation(operation.id);
        continue;
      }

      if (operation.kind === 'create_property') {
        if (property.syncStatus !== 'synced') {
          await createProperty(operation.payload);
          state.updateSyncStatus(operation.propertyId, 'synced');
        }
      } else if (operation.kind === 'update_boundary') {
        // Only update boundary if the property creation is synced
        if (property.syncStatus === 'synced') {
          const result = await updateBoundary(operation.propertyId, operation.payload);
          state.setBoundaryId(operation.propertyId, result.id);
        } else if (property.syncStatus === 'error') {
          // If property creation failed permanently, we can't sync boundary
          throw new ApiError('Property creation failed previously', 422);
        } else {
          // Skip for now, let create_property finish in next pass
          continue; 
        }
      } else if (operation.kind === 'confirm_boundary') {
        if (property.syncStatus === 'synced' && property.boundaryId) {
          await confirmBoundary(operation.propertyId, operation.boundaryId);
        } else if (property.syncStatus === 'error') {
          throw new ApiError('Property creation failed previously', 422);
        } else {
          continue;
        }
      }
      
      // If we reach here without throwing, operation succeeded
      state.removeOperation(operation.id);

    } catch (e: unknown) {
      console.warn(`Failed to sync operation ${operation.id}:`, e);
      state.incrementOperationAttempt(operation.id);
      
      if (e instanceof ApiError) {
        if (e.status === 409) {
          // Conflict. By semantics, this might mean already created or modified externally.
          // For now, treat as synced to avoid blocking if it's idempotent retry.
          // Or treat as unrecoverable if content mismatched.
          // The backend idempotency handles duplicates (returns 200). If 409, it's a real conflict.
          state.updateSyncStatus(operation.propertyId, 'error');
          state.markOperationFailed(operation.id, e.message);
        } else if (e.status >= 400 && e.status < 500 && e.status !== 401 && e.status !== 403) {
          // Unrecoverable business error (e.g. 422, 400). Stop retrying.
          state.updateSyncStatus(operation.propertyId, 'error');
          // Preserve operation for diagnosis
          state.markOperationFailed(operation.id, e.message);
        }
      }
      // For 5xx or network errors, we leave it in the outbox to retry later (status remains pending or retryable).
    }
  }
}
