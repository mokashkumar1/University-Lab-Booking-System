'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { adminClient } from './supabase/admin';
import { sessionClient } from './supabase/server';
import { authorizedBooking, getAppData, requireProfile } from './dal';
import { assertCan, can } from './permissions';
import { findAlternatives } from './alternatives';
import { toTimestamp } from './time';
import { accountEmailSchema, accountNameSchema, accountPasswordSchema, validateRule, newUserSchema } from './validation';
import { authCallbackUrl } from './site-url';
import type { ActionResult, BookingInput } from './types';
const text = (form: FormData, key: string) => String(form.get(key) || '').trim();
function fail(error: unknown): ActionResult { const message = error instanceof z.ZodError ? error.issues[0]?.message || 'Check the form values.' : error instanceof Error ? error.message : 'The request could not be completed. Please try again.'; return { success: false, message, error: message }; }
export async function signInAction(_previous: ActionResult, form: FormData): Promise<ActionResult> {
  try {
    const email = z.string().email().parse(text(form, 'email'));
    const password = z.string().min(1, 'Enter your password.').parse(text(form, 'password'));
    const { error } = await (await sessionClient()).auth.signInWithPassword({ email, password });
    if (error) return fail(new Error('Sign-in failed. Check your email and password.'));
  } catch (error) { return fail(error); }
  redirect('/dashboard');
}
export async function signUpAction(_previous: ActionResult, form: FormData): Promise<ActionResult> {
  try {
    const name = accountNameSchema.parse(text(form, 'name'));
    const email = accountEmailSchema.parse(text(form, 'email'));
    const password = accountPasswordSchema.parse(text(form, 'password'));
    if (password !== text(form, 'confirm_password')) throw new Error('Passwords do not match.');
    const { error } = await (await sessionClient()).auth.signUp({ email, password, options: { data: { name }, emailRedirectTo: authCallbackUrl('/dashboard') } });
    if (error) throw new Error('We could not start account creation. Please try again or contact your department.');
    return { success: true, message: 'Check your email to verify your UniLab account. You can sign in after verification.' };
  } catch (error) { return fail(error); }
}
export async function requestPasswordResetAction(_previous: ActionResult, form: FormData): Promise<ActionResult> {
  try {
    const email = accountEmailSchema.parse(text(form, 'email'));
    const { error } = await (await sessionClient()).auth.resetPasswordForEmail(email, { redirectTo: authCallbackUrl('/update-password') });
    if (error) throw new Error('We could not start password recovery. Please try again or contact your department.');
    return { success: true, message: 'If that account exists, a password reset link is on its way.' };
  } catch (error) { return fail(error); }
}
export async function updatePasswordAction(_previous: ActionResult, form: FormData): Promise<ActionResult> {
  try {
    const password = accountPasswordSchema.parse(text(form, 'password'));
    if (password !== text(form, 'confirm_password')) throw new Error('Passwords do not match.');
    const client = await sessionClient();
    const { data: { user }, error: userError } = await client.auth.getUser();
    if (userError || !user) throw new Error('Your recovery link is invalid or has expired. Request a new one.');
    const { error } = await client.auth.updateUser({ password });
    if (error) throw new Error('Your password could not be updated. Request a new recovery link.');
  } catch (error) { return fail(error); }
  redirect('/dashboard');
}
export async function demoSignInAction(_previous: ActionResult, form: FormData): Promise<ActionResult> {
  try {
    if (process.env.DEMO_MODE !== 'true') throw new Error('Demo access is not enabled.');
    const role = text(form, 'role').toUpperCase().replace(/ /g, '_');
    if (!['STUDENT', 'LAB_STAFF', 'COORDINATOR', 'ADMIN'].includes(role)) throw new Error('Choose a valid demo role.');
    const email = process.env[`DEMO_${role}_EMAIL`] || (role === 'LAB_STAFF' ? process.env.DEMO_STAFF_EMAIL : undefined);
    const password = process.env[`DEMO_${role}_PASSWORD`] || (role === 'LAB_STAFF' ? process.env.DEMO_STAFF_PASSWORD : undefined) || process.env.DEMO_PASSWORD;
    if (!email || !password) throw new Error('This demo account has not been configured yet.');
    const { error } = await (await sessionClient()).auth.signInWithPassword({ email, password });
    if (error) throw new Error('Demo sign-in failed. Ensure demo accounts have been seeded.');
  } catch (error) { return fail(error); }
  redirect('/dashboard');
}
export async function signOut() { try { await (await sessionClient()).auth.signOut(); } catch { /* An unconfigured installation has no session to clear. */ } redirect('/login'); }
export async function signOutAction() { return signOut(); }
const bookingSchema = z.object({ lab_id: z.string().uuid().nullable(), start_at: z.string(), end_at: z.string(), purpose: z.string().min(5, 'Describe the purpose in at least five characters.').max(2000), attendees: z.number().int().min(1).max(10000), notes: z.string().max(4000), items: z.array(z.object({ equipment_id: z.string().uuid(), quantity: z.number().int().positive().max(10000) })).max(30) });
function bookingInput(form: FormData): BookingInput {
  const parsed = text(form, 'items') ? JSON.parse(text(form, 'items')) : text(form, 'equipment_id') ? [{ equipment_id: text(form, 'equipment_id'), quantity: Number(text(form, 'quantity') || 1) }] : [];
  const input = bookingSchema.parse({ lab_id: text(form, 'lab_id') || null, start_at: toTimestamp(text(form, 'start_at')), end_at: toTimestamp(text(form, 'end_at')), purpose: text(form, 'purpose'), attendees: Number(text(form, 'attendees') || 1), notes: text(form, 'notes'), items: parsed });
  if (!input.lab_id && !input.items.length) throw new Error('Choose a lab or equipment to request.');
  if (+new Date(input.end_at) <= +new Date(input.start_at)) throw new Error('End time must be after start time.');
  const consolidated = new Map<string, number>();
  input.items.forEach(i => consolidated.set(i.equipment_id, (consolidated.get(i.equipment_id) || 0) + i.quantity));
  return { ...input, items: [...consolidated].map(([equipment_id, quantity]) => ({ equipment_id, quantity })) };
}
async function rpc(name: string, params: Record<string, unknown>) {
  const db = adminClient();
  let result = await db.rpc(name, params);
  if (result.error?.code === '40P01') result = await db.rpc(name, params);
  if (result.error) { const error = new Error(result.error.code === '23P01' ? 'This lab is already reserved for your selected time.' : result.error.code === '40P01' ? 'Another request is being processed. Please try again.' : result.error.message); Object.assign(error, { code: result.error.code }); throw error; }
  return result.data;
}
export async function createBookingAction(_previous: ActionResult, form: FormData): Promise<ActionResult> {
  let input: BookingInput | undefined;
  try {
    const profile = await requireProfile();
    input = bookingInput(form);
    const id = await rpc('create_booking', { p_actor: profile.id, p_lab_id: input.lab_id, p_start_at: input.start_at, p_end_at: input.end_at, p_purpose: input.purpose, p_attendees: input.attendees, p_items: input.items, p_notes: input.notes });
    revalidatePath('/', 'layout');
    return { success: true, message: 'Your booking request has been submitted for approval.', bookingId: String(id) };
  } catch (error) {
    const result = fail(error);
    if (input && /conflict|reserved|available|quantity|capacity|stock|blocked|maintenance/i.test(result.message)) {
      try {
        const data = await getAppData();
        result.alternatives = [];
        // Run the same database eligibility checks as creation, including current rules and custody.
        for (const alternative of findAlternatives(input, data, 60)) {
          const check = await adminClient().rpc('validate_request', { p_actor: data.profile!.id, p_lab_id: alternative.lab?.id || null, p_start_at: alternative.start_at, p_end_at: alternative.end_at, p_attendees: input.attendees, p_items: alternative.items });
          if (!check.error) result.alternatives.push(alternative);
          if (result.alternatives.length === 3) break;
        }
      } catch { result.alternatives = []; }
    }
    return result;
  }
}
export async function mutationAction(_previous: ActionResult, form: FormData): Promise<ActionResult> {
  try {
    const profile = await requireProfile();
    const action = text(form, 'action');
    if (['approve', 'reject', 'cancel', 'issue', 'return'].includes(action)) {
      const { booking } = await authorizedBooking(z.string().uuid().parse(text(form, 'booking_id')));
      if (action === 'cancel') {
        if (booking.user_id !== profile.id && profile.role !== 'Admin') throw new Error('Only the requester or an administrator can cancel this booking.');
        if (!['Pending Approval', 'Approved', 'Reserved'].includes(booking.booking_status)) throw new Error('This booking cannot be cancelled in its current state.');
      } else if (action === 'approve' || action === 'reject') {
        assertCan(profile, 'approve');
        const ids = booking.booking_items.map(i => i.equipment_id);
        if (ids.length) { const { data } = await adminClient().from('equipment').select('unit_value_high').in('id', ids); if (data?.some(e => e.unit_value_high) && !can(profile, 'highValue')) throw new Error('High-value equipment requires Coordinator or Admin approval.'); }
        if (action === 'reject' && text(form, 'reason').length < 3) throw new Error('Provide a reason for rejecting this request.');
      } else assertCan(profile, 'issue');
      if (action === 'cancel') await rpc('cancel_booking', { p_actor: profile.id, p_booking_id: booking.id });
      else if (action === 'approve' || action === 'reject') await rpc('decide_booking', { p_actor: profile.id, p_booking_id: booking.id, p_approve: action === 'approve', p_reason: text(form, 'reason') });
      else {
        let resourceItems = booking.booking_items;
        if (action === 'return') {
          const { data: issues, error } = await adminClient().from('issue_returns').select('equipment_id,quantity,returned_quantity').eq('booking_id', booking.id).is('returned_at', null);
          if (error) throw new Error('Issued equipment could not be loaded.');
          resourceItems = (issues || []).map(i => ({ equipment_id: i.equipment_id, quantity: i.quantity }));
        }
        const items = text(form, 'items') ? JSON.parse(text(form, 'items')) : resourceItems.map(item => ({ equipment_id: item.equipment_id, quantity: z.coerce.number().int().min(action === 'return' ? 0 : 1).max(item.quantity).parse(form.get(`quantity_${item.equipment_id}`) ?? item.quantity), condition: text(form, action === 'return' ? 'return_condition' : 'condition') || 'Good' }));
        if (action === 'issue') await rpc('issue_booking', { p_actor: profile.id, p_booking_id: booking.id, p_items: items });
        else await rpc('return_booking', { p_actor: profile.id, p_booking_id: booking.id, p_items: items, p_remarks: text(form, 'remarks'), p_damage_note: text(form, 'damage_note') });
      }
    } else if (action === 'mark-read') {
      const db = adminClient();
      let query = db.from('notifications').update({ read: true }).eq('user_id', profile.id);
      if (text(form, 'notification_id')) query = query.eq('id', text(form, 'notification_id'));
      const { error } = await query; if (error) throw error;
    } else if (action === 'update-rule') {
      assertCan(profile, 'rules');
      const key = text(form, 'key');
      const value = validateRule(key, JSON.parse(text(form, 'value')));
      await rpc('manage_rule', { p_actor: profile.id, p_key: key, p_value: value });
    } else if (action === 'block') {
      assertCan(profile, 'block');
      const [resourceType, resourceId] = text(form, 'resource').split(':');
      await rpc('block_resource', { p_actor: profile.id, p_lab_id: text(form, 'lab_id') || (resourceType === 'lab' ? resourceId : null), p_equipment_id: text(form, 'equipment_id') || (resourceType === 'equipment' ? resourceId : null), p_start_at: toTimestamp(text(form, 'start_at')), p_end_at: toTimestamp(text(form, 'end_at')), p_reason: text(form, 'reason') });
    } else if (action === 'maintenance') {
      assertCan(profile, 'block');
      const [kind, id] = text(form, 'resource').split(':');
      const entity = kind === 'lab' ? 'labs' : kind === 'equipment' ? 'equipment' : '';
      if (!entity) throw new Error('Choose a valid resource.');
      z.string().uuid().parse(id);
      const payload = entity === 'labs'
        ? { status: z.enum(['Available', 'Maintenance', 'Closed']).parse(text(form, 'status')) }
        : { maintenance_status: form.has('maintenance_status'), condition: z.enum(['Good', 'Fair', 'Damaged']).parse(text(form, 'condition') || 'Good') };
      await rpc('manage_resource', { p_actor: profile.id, p_entity: entity, p_id: id, p_data: payload });
    } else if (action === 'save-resource') {
      assertCan(profile, 'manage');
      const entity = z.enum(['labs', 'equipment', 'departments', 'profiles', 'categories']).parse(text(form, 'entity'));
      const payload = text(form, 'payload') ? JSON.parse(text(form, 'payload')) : Object.fromEntries([...form].filter(([key]) => !['action', 'entity', 'id', 'booking_id'].includes(key)));
      if (entity === 'profiles' && text(form, 'id')) delete payload.temporary_password;
      if (!text(form, 'payload')) {
        for (const key of ['capacity', 'total_quantity', 'late_count']) if (key in payload) payload[key] = z.coerce.number().int().nonnegative().parse(payload[key]);
        if ('facilities' in payload) payload.facilities = String(payload.facilities).split(',').map((value: string) => value.trim()).filter(Boolean);
        if (entity === 'equipment') { payload.unit_value_high = form.has('unit_value_high'); payload.maintenance_status = form.has('maintenance_status'); }
        if (text(form, 'id') && ['labs', 'equipment'].includes(entity)) payload.archived = form.has('archived');
        if (entity === 'profiles') { payload.active = form.has('active') && text(form, 'active') !== 'false'; }
        for (const key of ['lab_id', 'department_id', 'category_id']) if (key in payload && !payload[key]) delete payload[key];
      }
      if (entity === 'profiles' && !text(form, 'id')) {
        const input = newUserSchema.parse({ ...payload, department_id: payload.department_id || null });
        const db = adminClient();
        const created = await db.auth.admin.createUser({ email: input.email, password: input.temporary_password, email_confirm: true });
        if (created.error || !created.data.user) throw new Error(created.error?.message || 'The authentication account could not be created.');
        try {
          await rpc('create_profile', { p_actor: profile.id, p_user_id: created.data.user.id, p_name: input.name, p_email: input.email, p_role: input.role, p_department_id: input.department_id, p_active: input.active });
        } catch (error) {
          const rollback = await db.auth.admin.deleteUser(created.data.user.id);
          if (rollback.error) throw new Error('Profile creation failed and the authentication account could not be removed. Review this account in Supabase before retrying.');
          throw error;
        }
      } else if (entity === 'profiles' && payload.email) {
        const db = adminClient();
        const email = z.string().email().parse(payload.email);
        const existing = await db.auth.admin.getUserById(text(form, 'id'));
        if (existing.error || !existing.data.user) throw new Error('This authentication account could not be found.');
        const previousEmail = existing.data.user.email;
        const changed = email !== previousEmail;
        if (changed) { const update = await db.auth.admin.updateUserById(text(form, 'id'), { email, email_confirm: true }); if (update.error) throw new Error(update.error.message); }
        try { await rpc('manage_resource', { p_actor: profile.id, p_entity: entity, p_id: text(form, 'id'), p_data: payload }); }
        catch (error) {
          if (changed && previousEmail) { const rollback = await db.auth.admin.updateUserById(text(form, 'id'), { email: previousEmail, email_confirm: true }); if (rollback.error) throw new Error('Profile update failed and the account email could not be restored. Review this account before retrying.'); }
          throw error;
        }
      } else await rpc('manage_resource', { p_actor: profile.id, p_entity: entity, p_id: text(form, 'id') || null, p_data: payload });
    } else throw new Error('Unknown action.');
    revalidatePath('/', 'layout');
    return { success: true, message: 'Changes saved successfully.' };
  } catch (error) { return fail(error); }
}
export async function mutationFormAction(form: FormData): Promise<void> {
  const result = await mutationAction({ success: false, message: '' }, form);
  if (!result.success) throw new Error(result.message);
}
