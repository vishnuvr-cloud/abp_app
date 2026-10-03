import { apiGet } from './api';
import type { DashboardData } from '../types/api';
export const getHubDashboard = (signal?: AbortSignal) => apiGet<DashboardData>('/dashboard/hub', signal);
