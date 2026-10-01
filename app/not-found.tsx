import Link from 'next/link';
export default function NotFound() { return <div className="error-page card"><h1>Page not found</h1><p className="muted">This resource may have been archived or moved.</p><Link className="btn btn-primary" href="/browse">Browse resources</Link></div>; }
