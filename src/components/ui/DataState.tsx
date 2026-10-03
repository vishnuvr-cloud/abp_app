export function DataState({ loading, error, onRetry, children, empty, hasData=true }: { loading:boolean; error:string; onRetry:()=>void; children:React.ReactNode; empty?:string; hasData?:boolean }) {
 if (loading) return <div className="data-state">Loading current data…</div>;
 if (error) return <div className="data-state error-state"><span>{error}</span><button className="text-button" onClick={onRetry}>Retry</button></div>;
 if (!hasData) return <div className="data-state">{empty ?? 'No records available.'}</div>;
 return <>{children}</>;
}
