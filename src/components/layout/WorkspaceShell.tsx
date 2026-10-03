import { useState } from 'react';
import { Bell, ChevronDown, Search } from 'lucide-react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { DEMO_DATA_ENABLED } from '../../config/api';
import './WorkspaceShell.css';

const workspacePath: Record<string,string> = { 'Hub Agent':'/hub', 'Field Resource Management':'/frm', 'Financial Councellor':'/fc', 'Market Access':'/market-access' };
export function WorkspaceShell() {
  const path = useLocation().pathname; const navigate = useNavigate(); const [menuOpen,setMenuOpen]=useState(false);
  const workspace = path.startsWith('/frm') ? 'Field Resource Management' : path.startsWith('/fc') ? 'Financial Councellor' : path.startsWith('/market-access') ? 'Market Access' : 'Hub Agent Workspace';
  const subtitle = workspace === 'Financial Councellor' ? 'Field Coordinator · Case Operations & Resource Management' : workspace === 'Field Resource Management' ? 'Field Reimbursement Manager' : workspace === 'Market Access' ? 'Market Access' : 'Hub Agent Workspace';
  return <div className="app-shell"><header className="topbar"><div className="brand"><div className="brand-mark">A</div><span>ABP Engine</span><i/><strong>{subtitle}</strong></div>{DEMO_DATA_ENABLED&&<span className="demo-indicator">DEMO DATA</span>}<label className="global-search"><Search size={19}/><input aria-label="Search" placeholder="Search case, number, patient, token, or payer"/></label><div className="user-area"><button className="icon-button notification" aria-label="Notifications"><Bell size={20}/><b>12</b></button><div className="avatar">SJ</div><div className="user-name"><strong>Sarah Johnson</strong><span>{workspace === 'Financial Councellor' ? 'Field Coordinator' : workspace}</span></div><div className="workspace-menu"><button className="workspace-select" aria-label="Select workspace" aria-haspopup="listbox" aria-expanded={menuOpen} onClick={()=>setMenuOpen(!menuOpen)}><span>{workspace}</span><ChevronDown size={15}/></button>{menuOpen&&<div className="workspace-options" role="listbox" aria-label="Available workspaces">{['Field Resource Management','Financial Councellor','Market Access'].map(option=><button role="option" aria-selected={workspace===option} key={option} onClick={()=>{navigate(workspacePath[option]);setMenuOpen(false);}}>{option}</button>)}</div>}</div></div></header><Outlet/></div>;
}
