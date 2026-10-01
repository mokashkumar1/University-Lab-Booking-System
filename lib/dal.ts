import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { adminClient, isConfigured } from './supabase/admin';
import { sessionClient } from './supabase/server';
import { can } from './permissions';
import type { AppData, Booking, Profile } from './types';
export const getProfile = cache(async (): Promise<Profile | null> => {
  if (!isConfigured()) return null;
  const session = await sessionClient();
  const { data: { user }, error } = await session.auth.getUser();
  if (error || !user) return null;
  const result = await adminClient().from('profiles').select('*').eq('id', user.id).maybeSingle();
  if (result.error) throw new Error('Your account profile could not be loaded. Check that the UniLab database migration is installed.');
  if (!result.data || result.data.active === false) return null;
  return { ...result.data, email: user.email } as Profile;
});
export async function requireProfile() { const profile = await getProfile(); if (!profile) redirect('/login'); return profile; }
export const getAppData = cache(async (): Promise<AppData> => {
  const empty: AppData = { profile: null, labs: [], equipment: [], departments: [], categories: [], bookings: [], availability: [], issues: [], blocks: [], notifications: [], rules: [], users: [], audit: [] };
  if (!isConfigured()) return { ...empty, configurationError: 'Supabase setup is required. Add the publishable key and server secret, then install the schema and seed data.' };
  const profile = await getProfile();
  if (!profile) return empty;
  const db = adminClient();
  let bookingsQuery = db.from('bookings').select('*, booking_items(*), labs(*), profiles:profiles!bookings_user_id_fkey(*)').order('start_at', { ascending: false }).order('id');
  if (profile.role === 'Student' || profile.role === 'Faculty') bookingsQuery = bookingsQuery.eq('user_id', profile.id);
  async function readBookingPages() {
    const rows: unknown[] = [];
    for (let offset = 0; ; offset += 1000) {
      const result = await bookingsQuery.range(offset, offset + 999);
      if (result.error) return result;
      rows.push(...(result.data || []));
      if ((result.data || []).length < 1000) return { data: rows, error: null };
    }
  }
  const results = await Promise.all([
    db.from('labs').select('*').eq('archived', false).order('name'), db.from('equipment').select('*').eq('archived', false).order('name'), db.from('departments').select('*').order('name'), readBookingPages(),
    db.from('bookings').select('id,lab_id,start_at,end_at,booking_status,booking_items(equipment_id,quantity)').in('booking_status', ['Pending Approval', 'Approved', 'Reserved', 'In Use']).or(`end_at.gte.${new Date(Date.now() - 86400000).toISOString()},booking_status.eq.In Use`),
    db.from('resource_blocks').select('*').gte('end_at', new Date(Date.now() - 61 * 86400000).toISOString()), db.from('notifications').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }).limit(100), db.from('rules').select('*'),
    can(profile, 'manage') ? db.from('profiles').select('*').order('name') : Promise.resolve({ data: [], error: null }),
    can(profile, 'manage') ? db.from('audit_log').select('*').order('created_at', { ascending: false }).limit(100) : Promise.resolve({ data: [], error: null }),
    profile.department_id ? db.from('department_rules').select('key,value').eq('department_id', profile.department_id) : Promise.resolve({ data: [], error: null }),
    db.from('issue_returns').select('booking_id,equipment_id,quantity,returned_quantity,due_at,returned_at').is('returned_at', null),
    db.from('categories').select('*').order('name'),
  ]);
  const failure = results.find(r => r.error);
  if (failure?.error) return { ...empty, profile, configurationError: `The database is not ready: ${failure.error.message}` };
  const [labs, equipment, departments, bookings, availability, blocks, notifications, rules, users, audit, departmentRules, inventoryCustody, categories] = results.map(r => r.data || []);
  const departmentOf = (booking: Booking) => booking.labs?.department_id || (equipment as AppData['equipment']).map(e => ({ e, lab: (labs as AppData['labs']).find(l => l.id === e.lab_id) })).find(({ e }) => booking.booking_items.some(i => i.equipment_id === e.id))?.lab?.department_id || booking.profiles?.department_id;
  let scoped = bookings as unknown as Booking[];
  if (profile.role === 'Coordinator' || profile.role === 'Lab Staff') scoped = scoped.filter(b => b.user_id === profile.id || Boolean(profile.department_id && departmentOf(b) === profile.department_id));
  const ids = scoped.map(b => b.id);
  const issueRows: AppData['issues'] = [];
  for (let offset = 0; offset < ids.length; offset += 100) {
    const result = await db.from('issue_returns').select('*').in('booking_id', ids.slice(offset, offset + 100));
    if (result.error) return { ...empty, profile, configurationError: 'Equipment custody could not be loaded. Please refresh and try again.' };
    issueRows.push(...(result.data || []));
  }
  const overrides = new Map((departmentRules as AppData['rules']).map(rule => [rule.key, rule.value]));
  const effectiveRules = (rules as AppData['rules']).map(rule => ({ ...rule, value: overrides.has(rule.key) ? overrides.get(rule.key) : rule.value }));
  const computed: AppData['notifications'] = [];
  for (const booking of scoped.filter(booking => booking.user_id === profile.id)) {
    if (['Reserved', 'Approved'].includes(booking.booking_status) && +new Date(booking.start_at) > Date.now() && +new Date(booking.start_at) <= Date.now() + 86400000) computed.push({ id: `computed:approaching:${booking.id}`, user_id: profile.id, category: 'Bookings', read: true, created_at: new Date().toISOString(), message: `Your approved session is approaching within 24 hours: ${booking.labs?.name || 'Equipment request'}.` });
    const overdue = issueRows.filter(issue => issue.booking_id === booking.id && !issue.returned_at && +new Date(issue.due_at) < Date.now());
    if (overdue.length) computed.push({ id: `computed:overdue:${booking.id}`, user_id: profile.id, category: 'Bookings', read: true, created_at: new Date().toISOString(), message: `${overdue.reduce((sum, issue) => sum + issue.quantity - (issue.returned_quantity || 0), 0)} equipment units are overdue for return. Contact lab staff to record the return.` });
  }
  return { profile, labs, equipment, departments, categories, bookings: scoped, availability, issues: issueRows, inventoryCustody, blocks, notifications: [...computed, ...notifications], rules: effectiveRules, users, audit } as unknown as AppData;
});
export async function authorizedBooking(id: string) {
  const profile = await requireProfile();
  const { data, error } = await adminClient().from('bookings').select('*, booking_items(*), labs(*), profiles:profiles!bookings_user_id_fkey(*)').eq('id', id).single();
  if (error || !data) throw new Error('This booking could not be found.');
  if (data.user_id !== profile.id) {
    if (!can(profile, 'approve')) throw new Error('You do not have permission to view this booking.');
    let department = data.labs?.department_id;
    if (!department && data.booking_items.length) {
      const resource = await adminClient().from('equipment').select('labs(department_id)').eq('id', data.booking_items[0].equipment_id).single();
      department = (resource.data?.labs as unknown as { department_id?: string } | null)?.department_id;
    }
    department ||= data.profiles?.department_id;
    if (profile.role !== 'Admin' && (!profile.department_id || department !== profile.department_id)) throw new Error('This booking belongs to another department.');
  }
  return { profile, booking: data as Booking };
}
