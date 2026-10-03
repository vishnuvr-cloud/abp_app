import { API_BASE_URL, API_CONFIGURED } from '../config/api';

export class ApiError extends Error { constructor(message: string, public status?: number) { super(message); this.name = 'ApiError'; } }

export async function apiGet<T>(path: string, signal?: AbortSignal): Promise<T> {
  if (!API_CONFIGURED) throw new ApiError('API Gateway is not configured. Set VITE_API_BASE_URL in the environment.');
  let response: Response;
  try { response = await fetch(`${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`, { method: 'GET', headers: { Accept: 'application/json' }, signal }); }
  catch (error) { if (error instanceof DOMException && error.name === 'AbortError') throw error; throw new ApiError('Unable to reach the API. Check the API Gateway URL and CORS settings.'); }
  if (!response.ok) throw new ApiError(`The API returned ${response.status}.`, response.status);
  try { return await response.json() as T; } catch { throw new ApiError('The API returned an invalid JSON response.', response.status); }
}
