/**
 * Local-only design fixtures. Values are synthetic and model the supplied DB
 * schema where possible. Never use these as operational or patient data.
 */
import type { CaseDetail, CaseRecord, DashboardData } from '../types/api';

const now = new Date();
const at = (hours: number) => new Date(now.getTime() + hours * 3_600_000).toISOString();
const ago = (hours: number) => new Date(now.getTime() - hours * 3_600_000).toISOString();

const cases: CaseRecord[] = [
  { case_id: 8841, case_number: 'CAS-2026-8841', patient_token: 'PF50021', prescriber_token: 'PR22011', payer_id: 'BSCA', payer_name: 'Blue Shield CA', plan_type: 'PPO Gold', territory: 'West', current_state: 'IN_REVIEW', version: 4, owner_role: 'Hub Agent', owner_id: 12, created_at: ago(12), updated_at: ago(.4), closed_at: null, drug_name: 'Dupixent 300mg', drug_id: 'DUP300', diagnosis_name: 'Atopic Dermatitis', diagnosis_code: 'L20.9', risk_score: 84, risk_band: 'CRITICAL', bscore: 84, confidence: .92, predicted_barriers: ['Prior Authorization', 'Step Therapy', 'Quantity Limit'], executive_summary: 'High-risk case with a prior authorization requirement and incomplete therapy history. Collect supporting treatment documentation before submission.', assigned_to: 'Mike R.', assignment_status: 'ASSIGNED', action_required: 'Verify PA criteria', sla_due_at: at(2.25) },
  { case_id: 8842, case_number: 'CAS-2026-8842', patient_token: 'PF50022', prescriber_token: 'PR22012', payer_id: 'AETNA', payer_name: 'Aetna Choice', plan_type: 'Choice POS', territory: 'Central', current_state: 'PA_SUBMITTED', version: 3, owner_role: 'Hub Agent', owner_id: 13, created_at: ago(30), updated_at: ago(1), closed_at: null, drug_name: 'Stelara 90mg', drug_id: 'STL90', diagnosis_name: 'Psoriasis', diagnosis_code: 'L40.9', risk_score: 62, risk_band: 'MEDIUM', bscore: 62, confidence: .81, predicted_barriers: ['Step Therapy'], executive_summary: 'Authorization submitted; monitor payer response and follow up before the due date.', assigned_to: 'Priya K.', assignment_status: 'ASSIGNED', action_required: 'Monitor payer response', sla_due_at: at(4.03) },
  { case_id: 8843, case_number: 'CAS-2026-8843', patient_token: 'PF50028', prescriber_token: 'PR22018', payer_id: 'UHC', payer_name: 'UnitedHealthcare', plan_type: 'Choice Plus', territory: 'South', current_state: 'ACTION_REQUIRED', version: 2, owner_role: 'Field Coordinator', owner_id: 14, created_at: ago(7), updated_at: ago(.25), closed_at: null, drug_name: 'Humira 40mg', drug_id: 'HUM40', diagnosis_name: 'Rheumatoid Arthritis', diagnosis_code: 'M06.9', risk_score: 78, risk_band: 'CRITICAL', bscore: 78, confidence: .88, predicted_barriers: ['Prior Authorization', 'Missing Clinical Documentation'], executive_summary: 'Urgent follow-up required. Clinical notes and prior treatment records are incomplete.', assigned_to: 'Daniel M.', assignment_status: 'ASSIGNED', action_required: 'Request missing clinical records', sla_due_at: at(.5) },
  { case_id: 8844, case_number: 'CAS-2026-8844', patient_token: 'PF50031', prescriber_token: 'PR22023', payer_id: 'BSCA', payer_name: 'Blue Shield CA', plan_type: 'Commercial PPO', territory: 'West', current_state: 'APPROVED', version: 5, owner_role: 'Field Coordinator', owner_id: 15, created_at: ago(72), updated_at: ago(5), closed_at: null, drug_name: 'Dupixent 300mg', drug_id: 'DUP300', diagnosis_name: 'Atopic Dermatitis', diagnosis_code: 'L20.9', risk_score: 55, risk_band: 'MEDIUM', bscore: 55, confidence: .76, predicted_barriers: ['Prior Authorization'], executive_summary: 'Authorization approved. Confirm treatment start with the care team.', assigned_to: 'Alex T.', assignment_status: 'ASSIGNED', action_required: 'Confirm treatment start', sla_due_at: at(27) },
  { case_id: 8845, case_number: 'CAS-2026-8845', patient_token: 'PF50032', prescriber_token: 'PR22026', payer_id: 'AETNA', payer_name: 'Aetna Choice', plan_type: 'Choice POS', territory: 'North East', current_state: 'PA_SUBMITTED', version: 2, owner_role: 'Hub Agent', owner_id: 13, created_at: ago(20), updated_at: ago(2), closed_at: null, drug_name: 'Stelara 90mg', drug_id: 'STL90', diagnosis_name: 'Plaque Psoriasis', diagnosis_code: 'L40.0', risk_score: 68, risk_band: 'MEDIUM', bscore: 68, confidence: .83, predicted_barriers: ['Step Therapy', 'Formulary Status'], executive_summary: 'Submission is under review. Check status with the payer if no response is received.', assigned_to: 'Emily S.', assignment_status: 'ASSIGNED', action_required: 'Check authorization status', sla_due_at: at(26) },
  { case_id: 8846, case_number: 'CAS-2026-8846', patient_token: 'PF50036', prescriber_token: 'PR22029', payer_id: 'CIGNA', payer_name: 'Cigna', plan_type: 'Open Access', territory: 'Central', current_state: 'NEW', version: 1, owner_role: 'Field Coordinator', owner_id: 16, created_at: ago(1), updated_at: ago(.2), closed_at: null, drug_name: 'Xolair 150mg', drug_id: 'XOL150', diagnosis_name: 'Asthma', diagnosis_code: 'J45.909', risk_score: 22, risk_band: 'LOW', bscore: 22, confidence: .69, predicted_barriers: [], executive_summary: null, assigned_to: 'Mike R.', assignment_status: 'ASSIGNED', action_required: 'Review intake', sla_due_at: at(50) },
];

const documents = [
  { case_id: 8841, case_number: cases[0].case_number, document_type: 'Prior Treatment History', status: 'Missing', requested_on: ago(25) },
  { case_id: 8841, case_number: cases[0].case_number, document_type: 'Clinical Notes', status: 'Missing', requested_on: ago(8) },
  { case_id: 8842, case_number: cases[1].case_number, document_type: 'Diagnosis Confirmation', status: 'Available', requested_on: ago(18) },
  { case_id: 8843, case_number: cases[2].case_number, document_type: 'Lab Results', status: 'Missing', requested_on: ago(6) },
  { case_id: 8845, case_number: cases[4].case_number, document_type: 'Treatment Rationale', status: 'Missing', requested_on: ago(10) },
];

const providers = [
  { name: 'North Valley Dermatology', territory: 'West', case_count: 8 },
  { name: 'Central Specialty Clinic', territory: 'Central', case_count: 6 },
  { name: 'South City Medical', territory: 'South', case_count: 4 },
];

const resources = [
  { name: 'Mike R.', assigned_cases: 3 }, { name: 'Priya K.', assigned_cases: 2 },
  { name: 'Daniel M.', assigned_cases: 2 }, { name: 'Alex T.', assigned_cases: 1 },
  { name: 'Emily S.', assigned_cases: 1 },
];

const activity = [
  { case_number: cases[1].case_number, event: 'PA submitted by Priya K.', at: ago(.5) },
  { case_number: cases[0].case_number, event: 'Clinical document requested', at: ago(1.2) },
  { case_number: cases[2].case_number, event: 'Case assigned to Daniel M.', at: ago(2) },
  { case_number: cases[3].case_number, event: 'Case approved', at: ago(4) },
  { case_number: cases[5].case_number, event: 'New case created', at: ago(5) },
];

const dashboard: DashboardData = {
  kpis: { total_cases: 6, high_risk_cases: 2, sla_due_soon: 3, sla_at_risk: 3, overdue_cases: 0, assigned_resources: 5, provider_accounts: 3, hub_follow_ups: 3, pending_documents: documents.filter(d => d.status === 'Missing').length },
  cases,
  cases_by_status: [{ name: 'In Review', value: 1 }, { name: 'PA Submitted', value: 2 }, { name: 'Approved', value: 1 }, { name: 'Action Required', value: 1 }, { name: 'New', value: 1 }],
  cases_by_payer: [{ name: 'Blue Shield CA', value: 2 }, { name: 'Aetna Choice', value: 2 }, { name: 'UnitedHealthcare', value: 1 }, { name: 'Cigna', value: 1 }],
  risk_distribution: [{ name: '0–20', value: 0 }, { name: '21–40', value: 1 }, { name: '41–70', value: 3 }, { name: '71–100', value: 2 }],
  upcoming_sla: [...cases].filter(c => c.sla_due_at).sort((a,b) => Date.parse(a.sla_due_at!) - Date.parse(b.sla_due_at!)).slice(0,5),
  resources,
  recent_activity: activity,
  demo_documents: documents,
  demo_provider_accounts: providers,
};

function detailFor(record: CaseRecord): CaseDetail {
  const caseDocs = documents.filter(doc => doc.case_id === record.case_id);
  const assignments = [{ role_type: record.owner_role, user_id: record.owner_id, user_name: record.assigned_to, assignment_status: record.assignment_status, action_required: record.action_required, sla_due_at: record.sla_due_at, assigned_at: record.updated_at }];
  const prescription = { prescription_id: `RX-${record.case_id}`, drug_id: record.drug_id, drug_name: record.drug_name, diagnosis_code: record.diagnosis_code, diagnosis_name: record.diagnosis_name, quantity: 2, days_supply: 28, created_at: record.created_at };
  const assessment = { assessment_id: record.case_id, model_version: 'demo-v1', risk_score: record.risk_score, risk_band: record.risk_band, confidence: record.confidence, bscore: record.bscore, predicted_barriers: record.predicted_barriers, assessment_status: 'ACTIVE', created_at: record.updated_at };
  const insights = record.executive_summary ? [{ executive_summary: record.executive_summary, key_findings: record.predicted_barriers, recommendations: [`Review ${record.action_required?.toLowerCase() ?? 'case requirements'}.`], generated_by: 'Local demo fixture', created_at: record.updated_at }] : [];
  return { ...record, prescriptions: [prescription], assessment, assignments, insights, timeline: [{ previous_state: null, new_state: 'CREATED', changed_at: record.created_at }, { previous_state: 'NEW', new_state: record.current_state, changed_at: record.updated_at }], barriers: Array.isArray(record.predicted_barriers) ? record.predicted_barriers : [], documents: caseDocs };
}

export async function demoGet<T>(path: string): Promise<T> {
  await new Promise(resolve => setTimeout(resolve, 280));
  const normalized = path.replace(/\/$/, '') || '/';
  if (normalized === '/cases') return { items: cases, count: cases.length } as T;
  const caseMatch = normalized.match(/^\/cases\/([^/]+)(?:\/(payer|clinical|barriers|actions|documents))?$/);
  if (caseMatch) {
    const [, id, section] = caseMatch;
    const record = cases.find(c => String(c.case_id) === id || c.case_number === id);
    if (!record) throw new Error('No synthetic fixture exists for that case.');
    const detail = detailFor(record);
    if (!section) return detail as T;
    if (section === 'payer') return { case_id: record.case_id, payer_id: record.payer_id, payer_name: record.payer_name, plan_type: record.plan_type, patient_token: record.patient_token, territory: record.territory } as T;
    if (section === 'clinical') return { case_id: record.case_id, prescriptions: detail.prescriptions, assessment: detail.assessment } as T;
    if (section === 'barriers') return { case_id: record.case_id, risk_score: record.risk_score, risk_band: record.risk_band, bscore: record.bscore, confidence: record.confidence, predicted_barriers: detail.barriers, insights: detail.insights } as T;
    if (section === 'actions') return { case_id: record.case_id, assignments: detail.assignments, decisions: [] } as T;
    return { case_id: record.case_id, items: detail.documents, available: true } as T;
  }
  if (normalized.startsWith('/dashboard/')) return dashboard as T;
  const frm: Record<string, unknown> = {
    '/frm/territory-cases': { items: cases },
    '/frm/cases-by-region': { items: [{ name: 'West', value: 2 }, { name: 'Central', value: 2 }, { name: 'South', value: 1 }, { name: 'North East', value: 1 }] },
    '/frm/top-payers': { items: dashboard.cases_by_payer },
    '/frm/top-barriers': { items: [{ name: 'Prior Authorization', value: 3 }, { name: 'Step Therapy', value: 2 }, { name: 'Missing Clinical Documentation', value: 1 }] },
    '/frm/provider-accounts': { items: providers, available: true },
    '/frm/sla-risk': { items: dashboard.upcoming_sla },
    '/frm/hub-follow-ups': { count: dashboard.kpis.hub_follow_ups, items: cases.filter(c => c.owner_role === 'Hub Agent') },
    '/fc/assigned-cases': { items: cases },
    '/fc/upcoming-sla': { items: dashboard.upcoming_sla },
    '/fc/recent-activity': { items: activity },
    '/fc/pending-documents': { items: documents, available: true },
    '/fc/resource-workload': { items: resources },
  };
  if (normalized in frm) return frm[normalized] as T;
  throw new Error(`No local demo response is defined for ${normalized}.`);
}
