export const TIMEZONE = 'Asia/Karachi';
export function formatDate(value: string, options?: Intl.DateTimeFormatOptions) { return new Intl.DateTimeFormat('en-GB', { timeZone: TIMEZONE, day: 'numeric', month: 'short', ...options }).format(new Date(value)); }
export function formatTime(value: string) { return new Intl.DateTimeFormat('en-GB', { timeZone: TIMEZONE, hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(value)); }
export function toTimestamp(value: string) { const explicit = /(?:Z|[+-]\d{2}:\d{2})$/.test(value) ? value : `${value}${/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value) ? ':00' : ''}+05:00`; const date = new Date(explicit); if (!Number.isFinite(date.getTime())) throw new Error('Choose a valid date and time.'); return date.toISOString(); }
