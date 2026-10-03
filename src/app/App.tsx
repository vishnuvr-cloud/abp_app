import { Navigate, Route, Routes } from 'react-router-dom';
import { WorkspaceShell } from '../components/layout/WorkspaceShell';
import { HubAgentPage } from '../pages/hub/HubAgentPage';
import { FrmPage } from '../pages/frm/FrmPage';
import { FcPage } from '../pages/fc/FcPage';

export default function App() {
  return <Routes><Route element={<WorkspaceShell />}>
    <Route path="/" element={<Navigate to="/hub" replace />} />
    <Route path="/hub" element={<HubAgentPage />} />
    <Route path="/cases/:caseId/*" element={<HubAgentPage />} />
    <Route path="/frm" element={<FrmPage />} />
    <Route path="/fc" element={<FcPage />} />
    <Route path="/market-access" element={<main className="page-content"><section className="panel empty-state"><h2>Market Access</h2><p>This workspace is ready for its design and data requirements.</p></section></main>} />
    <Route path="*" element={<Navigate to="/hub" replace />} />
  </Route></Routes>;
}
