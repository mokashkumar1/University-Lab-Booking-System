import { FlaskConical } from 'lucide-react';
export default function Loading() { return <div className="loading-page" role="status"><FlaskConical className="text-blue-600" size={36}/><p>Getting your workspace ready…</p><div className="skeleton" style={{width:260,height:12}}/></div>; }
