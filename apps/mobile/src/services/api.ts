import Constants from 'expo-constants';
import { z } from 'zod';
import { 
  Passport, 
  ApiPropertyCreate, 
  ApiBoundaryCreate,
  ApiPropertyReadSchema,
  ApiPropertyRead,
  ApiBoundaryVersionReadSchema,
  ApiBoundaryVersionRead
} from '../domain/models';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const HealthSchema = z.object({ status: z.string(), service: z.string() });
const configured = process.env.EXPO_PUBLIC_API_URL ?? Constants.expoConfig?.extra?.apiUrl;
export const API_URL = typeof configured === 'string' ? configured : 'http://10.0.2.2:8000/api/v1';

export async function getHealth(): Promise<z.infer<typeof HealthSchema>> {
  const response = await fetch(`${API_URL}/health`, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new ApiError(`API health failed`, response.status);
  return HealthSchema.parse(await response.json());
}

export async function createProperty(payload: ApiPropertyCreate): Promise<ApiPropertyRead> {
  const response = await fetch(`${API_URL}/properties`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new ApiError(`Failed to create property`, response.status, text);
  }
  const data = await response.json();
  return ApiPropertyReadSchema.parse(data);
}

export async function updateBoundary(propertyId: string, payload: ApiBoundaryCreate): Promise<ApiBoundaryVersionRead> {
  const response = await fetch(`${API_URL}/properties/${propertyId}/boundaries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new ApiError(`Failed to update boundary`, response.status, text);
  }
  const data = await response.json();
  return ApiBoundaryVersionReadSchema.parse(data);
}

export async function confirmBoundary(propertyId: string, boundaryId: string): Promise<void> {
  // Confirming specific version, per user instruction (Part 7).
  const response = await fetch(`${API_URL}/properties/${propertyId}/boundaries/${boundaryId}/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  });
  if (!response.ok) {
    const text = await response.text();
    throw new ApiError(`Failed to confirm boundary`, response.status, text);
  }
}

export async function listProperties(): Promise<ApiPropertyRead[]> {
  const response = await fetch(`${API_URL}/properties`, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new ApiError(`Failed to list properties`, response.status);
  const data = await response.json();
  return z.array(ApiPropertyReadSchema).parse(data);
}

export async function getPassport(propertyId: string): Promise<Passport> {
  // Separate submitAssessment and getPassport per user instruction (Part 8).
  const response = await fetch(`${API_URL}/passports/properties/${propertyId}`, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new ApiError(`Failed to get passport`, response.status);
  return await response.json(); // Need to validate with a Zod schema later, assuming Passport matches backend directly for now
}
