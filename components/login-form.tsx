'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { ArrowRight, ChevronRight, Eye, EyeOff, FlaskConical, GraduationCap, LockKeyhole, Mail, Settings, UserPlus, Users } from 'lucide-react';
import { demoSignInAction, requestPasswordResetAction, signInAction, signUpAction, updatePasswordAction } from '@/lib/actions';

const initial = { success: false, message: '' };

function PasswordInput({ id = 'password', label = 'Password', confirm = false, isNewPassword = false }: { id?: string; label?: string; confirm?: boolean; isNewPassword?: boolean }) {
  const [show, setShow] = useState(false);
  return <><label className="sr-only" htmlFor={id}>{label}</label><div className="login-input"><LockKeyhole size={21}/><input id={id} name={confirm ? 'confirm_password' : 'password'} type={show ? 'text' : 'password'} autoComplete={confirm || isNewPassword ? 'new-password' : 'current-password'} placeholder={label} required/><button type="button" onClick={() => setShow(!show)} aria-label={show ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}>{show ? <Eye size={21}/> : <EyeOff size={21}/>}</button></div></>;
}

function Message({ state }: { state: typeof initial }) { return state.message ? <p className={`alert ${state.success ? 'notice-success' : 'alert-error'}`} role={state.success ? 'status' : 'alert'}>{state.message}</p> : null; }

export function LoginForm({ demoEnabled, configured, message }: { demoEnabled: boolean; configured: boolean; message?: string }) {
  const [state, action, pending] = useActionState(signInAction, initial);
  const [demo, demoAction, demoPending] = useActionState(demoSignInAction, initial);
  return <><form action={action}><label className="sr-only" htmlFor="email">Email address</label><div className="login-input"><Mail size={21}/><input id="email" name="email" type="email" autoComplete="username" placeholder="Email address" required/></div><PasswordInput/><div className="login-options"><span>Secure university sign-in</span><Link href="/reset-password">Forgot password?</Link></div>{message && <p className="alert alert-error" role="alert">{message}</p>}<Message state={state}/><button className="btn btn-primary login-submit" disabled={pending || !configured}>{pending ? 'Signing in…' : 'Sign In'}<ArrowRight size={22}/></button></form><Link className="btn btn-secondary login-signup" href="/signup">Create your Student account<UserPlus size={20}/></Link>{demoEnabled && <><div className="login-divider">Demo accounts for judges and testing</div><form action={demoAction} className="demo-roles">{[{ role: 'Student', icon: GraduationCap, description: 'Opens the seeded Ayesha demo account' }, { role: 'Lab Staff', icon: FlaskConical, description: 'Manage labs and equipment' }, { role: 'Coordinator', icon: Users, description: 'Review department requests' }, { role: 'Admin', icon: Settings, description: 'Manage the university system' }].map(role => <button key={role.role} className="demo-role" name="role" value={role.role} disabled={demoPending || !configured}><role.icon size={28}/><span><strong>{role.role}</strong><small>{role.description}</small></span><ChevronRight size={17}/></button>)}</form><Message state={demo}/></>}<p className="login-footer">Your university workspace. Built for your next big idea.</p></>;
}

export function SignupForm({ configured }: { configured: boolean }) {
  const [state, action, pending] = useActionState(signUpAction, initial);
  return <><form action={action}><label className="sr-only" htmlFor="name">Full name</label><div className="login-input"><UserPlus size={21}/><input id="name" name="name" autoComplete="name" placeholder="Full name" required/></div><label className="sr-only" htmlFor="email">University email address</label><div className="login-input"><Mail size={21}/><input id="email" name="email" type="email" autoComplete="email" placeholder="University email address" required/></div><PasswordInput label="Create password" isNewPassword/><PasswordInput id="confirm-password" label="Confirm password" confirm/><p className="muted small">Use at least 12 characters. We’ll email a verification link before you can sign in.</p><Message state={state}/><button className="btn btn-primary login-submit" disabled={pending || !configured}>{pending ? 'Creating account…' : 'Create account'}<ArrowRight size={22}/></button></form><p className="auth-switch">Already have an account? <Link href="/login">Sign in</Link></p></>;
}

export function ResetPasswordForm({ configured }: { configured: boolean }) {
  const [state, action, pending] = useActionState(requestPasswordResetAction, initial);
  return <><form action={action}><label className="sr-only" htmlFor="email">Email address</label><div className="login-input"><Mail size={21}/><input id="email" name="email" type="email" autoComplete="email" placeholder="Email address" required/></div><Message state={state}/><button className="btn btn-primary login-submit" disabled={pending || !configured}>{pending ? 'Sending link…' : 'Send reset link'}<ArrowRight size={22}/></button></form><p className="auth-switch"><Link href="/login">Back to sign in</Link></p></>;
}

export function UpdatePasswordForm({ configured }: { configured: boolean }) {
  const [state, action, pending] = useActionState(updatePasswordAction, initial);
  return <><form action={action}><PasswordInput label="New password" isNewPassword/><PasswordInput id="confirm-password" label="Confirm new password" confirm/><Message state={state}/><button className="btn btn-primary login-submit" disabled={pending || !configured}>{pending ? 'Saving password…' : 'Save new password'}<ArrowRight size={22}/></button></form><p className="auth-switch"><Link href="/login">Back to sign in</Link></p></>;
}
