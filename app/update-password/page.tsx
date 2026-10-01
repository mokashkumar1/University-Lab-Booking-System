import { Logo } from '@/components/logo';
import { UpdatePasswordForm } from '@/components/login-form';
import { isConfigured } from '@/lib/supabase/admin';

export const metadata = { title: 'Choose new password' };
export default function UpdatePassword() { return <main className="login-page"><div className="login-layout"><section><div className="login-brand"><Logo/></div><div className="login-title"><h1>Choose a new password</h1><p>Set a new password for your UniLab account.</p></div></section><section className="login-form-panel" aria-label="Choose new password"><UpdatePasswordForm configured={isConfigured()}/></section></div></main>; }
