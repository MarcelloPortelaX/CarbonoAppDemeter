import { z } from 'zod';
import { usePropertyStore } from '../state/propertyStore';
import { createProperty, updateBoundary, confirmBoundary, submitAssessment, ApiError } from './api';

export async function processOutbox() {
  const state = usePropertyStore.getState();
  const outbox = [...state.outbox];
  const properties = state.properties;
  
  if (outbox.length === 0) return;

  // Group by propertyId to process sequentially per property
  const opsByProperty = outbox.reduce((acc, op) => {
    const arr = acc[op.propertyId] || [];
    arr.push(op);
    acc[op.propertyId] = arr;
    return acc;
  }, {} as Record<string, typeof outbox>);

  for (const propertyId of Object.keys(opsByProperty)) {
    const propertyOps = opsByProperty[propertyId];
    if (!propertyOps) continue;
    const ops = propertyOps.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    let blockedByPrevious = false;

    for (const operation of ops) {
      if (blockedByPrevious) {
        continue;
      }

      if (operation.status === 'failed') {
        blockedByPrevious = true;
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
            await updateBoundary(operation.propertyId, operation.payload);
          } else if (property.remoteStatus === 'error') {
            throw new ApiError('Property creation failed previously', 422);
          } else {
            blockedByPrevious = true;
            continue; 
          }
        } else if (operation.kind === 'confirm_boundary') {
          if (property.remoteStatus === 'created') {
            // Check if there's any update_boundary operation for this boundaryId that is still pending
            const pendingUpdate = ops.find(o => o.kind === 'update_boundary' && o.boundaryId === operation.boundaryId && o.status !== 'failed');
            if (pendingUpdate) {
               blockedByPrevious = true;
               continue;
            }
            await confirmBoundary(operation.propertyId, operation.boundaryId!);
          } else if (property.remoteStatus === 'error') {
            throw new ApiError('Property creation failed previously', 422);
          } else {
            blockedByPrevious = true;
            continue;
          }
        } else if (operation.kind === 'submit_assessment') {
          if (property.remoteStatus === 'created') {
            const pendingOps = ops.find(o => (o.kind === 'update_boundary' || o.kind === 'confirm_boundary') && o.status !== 'failed');
            if (pendingOps) {
               blockedByPrevious = true;
               continue;
            }
            await submitAssessment(operation.propertyId, operation.payload);
          } else if (property.remoteStatus === 'error') {
            throw new ApiError('Property creation failed previously', 422);
          } else {
            blockedByPrevious = true;
            continue;
          }
        }
        
        // Operation succeeded
        state.removeOperation(operation.id);

      } catch (e: unknown) {
        console.warn(`Failed to sync operation ${operation.id}:`, e);
        blockedByPrevious = true; // Block subsequent ops for this property
        
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
        
        // Rule 4: Do not transform remoteStatus to error unless it's create_property
        if (newStatus === 'failed' && operation.kind === 'create_property') {
          state.updateRemoteStatus(operation.propertyId, 'error');
        }
      }
    }
  }
}
