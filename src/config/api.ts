/** Single configuration point for the API Gateway stage URL. */
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
export const API_CONFIGURED = API_BASE_URL.length > 0 && !API_BASE_URL.includes('YOUR_API_ID');
/** Synthetic fixtures are local-preview only, and never win over a real gateway URL. */
export const DEMO_DATA_ENABLED = import.meta.env.DEV && !API_CONFIGURED && import.meta.env.VITE_USE_DEMO_DATA !== 'false';
