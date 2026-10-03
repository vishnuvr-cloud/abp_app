/** Single configuration point for the API Gateway stage URL. */
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
export const API_CONFIGURED = API_BASE_URL.length > 0 && !API_BASE_URL.includes('YOUR_API_ID');
