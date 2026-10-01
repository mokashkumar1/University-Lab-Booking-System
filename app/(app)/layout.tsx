import { redirect } from 'next/navigation';
import { getProfile } from '@/lib/dal';
import { AppShell } from '@/components/app-shell';
export default async function Layout({children}:{children:React.ReactNode}) { const profile=await getProfile(); if(!profile) redirect('/login'); return <AppShell profile={profile}>{children}</AppShell>; }
