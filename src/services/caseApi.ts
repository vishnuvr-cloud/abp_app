import { apiGet } from './api';
import type { ApiList, CaseDetail, CaseRecord } from '../types/api';
export const getCases = (signal?: AbortSignal) => apiGet<ApiList<CaseRecord>>('/cases', signal);
export const getCase = (caseId: string, signal?: AbortSignal) => apiGet<CaseDetail>(`/cases/${encodeURIComponent(caseId)}`, signal);
export const getCaseSection = <T,>(caseId: string, section: 'payer'|'clinical'|'barriers'|'actions'|'documents', signal?: AbortSignal) => apiGet<T>(`/cases/${encodeURIComponent(caseId)}/${section}`, signal);
