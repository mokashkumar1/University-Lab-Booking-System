import { redirect } from 'next/navigation';
import { Logo } from '@/components/logo';
import { ResetPasswordForm } from '@/components/login-form';
import { getProfile } from '@/lib/dal';
import { isConfigured } from '@/lib/supabase/admin';

export const metadata = { title: 'Reset password' };
export default async function ResetPassword() { if (await getProfile()) redirect('/dashboard'); return <main className="login-page"><div className="login-layout"><section><div className="login-brand"><Logo/></div><div className="login-title"><h1>Reset your password</h1><p>Enter your email and we’ll send a secure password reset link.</p></div></section><section className="login-form-panel" aria-label="Reset password"><ResetPasswordForm configured={isConfigured()}/></section></div></main>; }
