import { z } from 'zod';
import { usePropertyStore } from '../state/propertyStore';
import { createProperty, updateBoundary, confirmBoundary, ApiError } from './api';

export async function processOutbox() {
  const state = usePropertyStore.getState();
  const outbox = [...state.outbox];
  const properties = state.properties;
  
  if (outbox.length === 0) return;

  for (const operation of outbox) {
    if (operation.status === 'failed') {
      continue;
    }

    try {
      const property = properties.find((p) => p.id === operation.propertyId);
      
      if (!property) {
        state.removeOperation(operation.id);
        continue;
      }

      state.incrementOperationAttempt(operation.id);

      if (operation.kind === 'create_property') {
        if (property.remoteStatus !== 'created') {
          await createProperty(operation.payload);
          state.updateRemoteStatus(operation.propertyId, 'created');
        }
      } else if (operation.kind === 'update_boundary') {
        if (property.remoteStatus === 'created') {
          const result = await updateBoundary(operation.propertyId, operation.payload);
          state.setBoundaryId(operation.propertyId, result.id);
        } else if (property.remoteStatus === 'error') {
          throw new ApiError('Property creation failed previously', 422);
        } else {
          continue; 
        }
      } else if (operation.kind === 'confirm_boundary') {
        if (property.remoteStatus === 'created' && property.boundaryId) {
          await confirmBoundary(operation.propertyId, operation.boundaryId);
        } else if (property.remoteStatus === 'error') {
          throw new ApiError('Property creation failed previously', 422);
        } else {
          continue;
        }
      }
      
      // Operation succeeded
      state.removeOperation(operation.id);

    } catch (e: unknown) {
      console.warn(`Failed to sync operation ${operation.id}:`, e);
      
      let newStatus: 'retryable' | 'failed' = 'retryable';
      let errorMsg = 'Unknown error';

      if (e instanceof ApiError) {
        errorMsg = e.message;
        if (e.status === 409 || e.status === 422 || (e.status >= 400 && e.status < 500 && e.status !== 401 && e.status !== 403 && e.status !== 408 && e.status !== 429)) {
          newStatus = 'failed';
        }
      } else if (e instanceof z.ZodError) {
        errorMsg = 'Contract violation (Zod)';
        newStatus = 'failed';
      } else if (e instanceof Error) {
        errorMsg = e.message;
        if (e.message.toLowerCase().includes('network') || e.message.toLowerCase().includes('timeout')) {
          newStatus = 'retryable';
        }
      }

      state.updateOperationStatus(operation.id, newStatus, errorMsg);
      if (newStatus === 'failed') {
        state.updateRemoteStatus(operation.propertyId, 'error');
      }
    }
  }
}
