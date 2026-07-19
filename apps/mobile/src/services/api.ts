import Constants from 'expo-constants';
import { z } from 'zod';
import { PropertySummary, Passport } from '../domain/models';

const HealthSchema = z.object({ status: z.string(), service: z.string() });
const configured = process.env.EXPO_PUBLIC_API_URL ?? Constants.expoConfig?.extra?.apiUrl;
export const API_URL = typeof configured === 'string' ? configured : 'http://10.0.2.2:8000/api/v1';

export async function getHealth(): Promise<z.infer<typeof HealthSchema>> {
  const response = await fetch(`${API_URL}/health`, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`API health failed: ${response.status}`);
  return HealthSchema.parse(await response.json());
}

export async function createProperty(payload: Omit<PropertySummary, 'id' | 'syncStatus' | 'createdAt' | 'status'> & { id?: string }): Promise<any> {
  const response = await fetch(`${API_URL}/properties`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      id: payload.id,
      name: payload.name,
      municipality: payload.municipality,
      land_use: payload.landUse,
      organization_id: null,
      version: 1,
    }),
  });
  if (!response.ok) throw new Error(`Failed to create property: ${response.status}`);
  return await response.json();
}

export async function listProperties(): Promise<any[]> {
  const response = await fetch(`${API_URL}/properties`, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Failed to list properties: ${response.status}`);
  return await response.json();
}

export async function getPassport(propertyId: string): Promise<Passport> {
  const response = await fetch(`${API_URL}/assessments/properties/${propertyId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  });
  if (!response.ok && response.status !== 404) throw new Error(`Failed to assess property: ${response.status}`);
  
  const pResponse = await fetch(`${API_URL}/passports/properties/${propertyId}`, { headers: { Accept: 'application/json' } });
  if (!pResponse.ok) throw new Error(`Failed to get passport: ${pResponse.status}`);
  return await pResponse.json();
}
