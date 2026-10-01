import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

function safeNext(value: string | null) {
  return value === '/dashboard' || value === '/update-password' ? value : '/dashboard';
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const next = safeNext(request.nextUrl.searchParams.get('next'));
  const redirectTo = new URL(next, request.url);
  const response = NextResponse.redirect(redirectTo);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!code || !url || !key) return NextResponse.redirect(new URL('/login?message=Verification%20link%20is%20invalid%20or%20expired.', request.url));
  const client = createServerClient(url, key, { cookies: { getAll: () => request.cookies.getAll(), setAll(values) { values.forEach(({ name, value, options }) => response.cookies.set(name, value, options)); } } });
  const { error } = await client.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL('/login?message=Verification%20link%20is%20invalid%20or%20expired.', request.url));
  return response;
}
