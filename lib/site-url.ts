import 'server-only';

export function siteUrl() {
  const value = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  try {
    return new URL(value).origin;
  } catch {
    throw new Error('NEXT_PUBLIC_SITE_URL must be a valid absolute URL.');
  }
}

export function authCallbackUrl(next: '/dashboard' | '/update-password') {
  return new URL(`/auth/callback?next=${encodeURIComponent(next)}`, siteUrl()).toString();
}
