import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
export async function sessionClient() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase authentication is not configured yet.');
  return createServerClient(url, key, { cookies: { getAll: () => cookieStore.getAll(), setAll(values) { try { values.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch { /* Server render uses proxy refresh. */ } } } });
}
