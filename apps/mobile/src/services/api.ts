import Constants from 'expo-constants';
import { z } from 'zod';

const HealthSchema = z.object({ status: z.string(), service: z.string() });
const configured = process.env.EXPO_PUBLIC_API_URL ?? Constants.expoConfig?.extra?.apiUrl;
export const API_URL = typeof configured === 'string' ? configured : 'http://10.0.2.2:8000/api/v1';

export async function getHealth(): Promise<z.infer<typeof HealthSchema>> {
  const response = await fetch(`${API_URL}/health`, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`API health failed: ${response.status}`);
  return HealthSchema.parse(await response.json());
}
