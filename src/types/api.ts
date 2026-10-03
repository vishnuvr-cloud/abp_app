export interface CaseRecord {
  case_id: number; case_number: string; patient_token: string | null; prescriber_token: string | null;
  payer_id: string | null; payer_name: string | null; plan_type: string | null; territory: string | null;
  current_state: string; version: number; owner_role: string | null; owner_id: number | null;
  created_at: string | null; updated_at: string | null; closed_at: string | null;
  drug_name: string | null; drug_id: string | null; diagnosis_name: string | null; diagnosis_code: string | null;
  risk_score: number | null; risk_band: string | null; bscore: number | null; confidence: number | null;
  predicted_barriers: unknown; executive_summary: string | null; assigned_to: string | null;
  assignment_status: string | null; action_required: string | null; sla_due_at: string | null;
}
export interface ApiList<T> { items: T[]; count: number; }
export interface DashboardData { kpis: Record<string, number>; cases_by_status: { name: string; value: number }[]; cases_by_payer: { name: string; value: number }[]; risk_distribution: { name: string; value: number }[]; cases: CaseRecord[]; upcoming_sla: CaseRecord[]; resources: { name: string; assigned_cases: number }[]; recent_activity: { case_number: string; event: string; at: string | null }[]; }
export interface CaseDetail extends CaseRecord { prescriptions: Record<string, unknown>[]; assessment: Record<string, unknown> | null; assignments: Record<string, unknown>[]; insights: Record<string, unknown>[]; timeline: Record<string, unknown>[]; barriers: unknown[]; documents: unknown[]; }
