import { apiGet } from './api';
import type { DashboardData } from '../types/api';
export const getFcDashboard = (signal?: AbortSignal) => apiGet<DashboardData>('/dashboard/fc', signal);
export const getAssignedCases = (signal?: AbortSignal) => apiGet('/fc/assigned-cases', signal);
export const getUpcomingSlaDeadlines = (signal?: AbortSignal) => apiGet('/fc/upcoming-sla', signal);
export const getRecentCaseActivity = (signal?: AbortSignal) => apiGet('/fc/recent-activity', signal);
export const getPendingDocuments = (signal?: AbortSignal) => apiGet('/fc/pending-documents', signal);
export const getResourceWorkload = (signal?: AbortSignal) => apiGet('/fc/resource-workload', signal);
