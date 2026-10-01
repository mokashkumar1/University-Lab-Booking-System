import { redirect } from 'next/navigation';
import { Logo } from '@/components/logo';
import { SignupForm } from '@/components/login-form';
import { getProfile } from '@/lib/dal';
import { isConfigured } from '@/lib/supabase/admin';

export const metadata = { title: 'Create account' };
export default async function Signup() { if (await getProfile()) redirect('/dashboard'); return <main className="login-page"><div className="login-layout"><section><div className="login-brand"><Logo/></div><div className="login-title"><h1>Start with UniLab</h1><p>Create a Student account to request university spaces and equipment.</p></div><div className="login-photo"><img src="/images/lab.jpg" alt="A modern university computer laboratory"/><div className="login-photo-copy"><h2>Make room<br/>for ideas.</h2><p>Verify your email, then plan your next session.</p></div></div></section><section className="login-form-panel" aria-label="Create account"><SignupForm configured={isConfigured()}/></section></div></main>; }
