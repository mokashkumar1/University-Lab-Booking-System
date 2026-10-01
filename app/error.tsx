'use client';
export default function ErrorPage({ reset }: { error: Error; reset: () => void }) { return <div className="error-page card"><h1>We couldn’t load this page</h1><p className="muted">Please check your connection and try again.</p><button onClick={reset} className="btn btn-primary">Try again</button><a className="btn" href="/dashboard">Go home</a></div>; }
