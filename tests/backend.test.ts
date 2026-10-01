import { describe, expect, it, vi, afterEach } from 'vitest';
import { availableQuantity, labAvailable } from '../lib/availability';
import { findAlternatives } from '../lib/alternatives';
import { can, assertCan } from '../lib/permissions';
import { toTimestamp } from '../lib/time';
import { calculateAnalytics } from '../lib/analytics';
import { newUserSchema, validateRule } from '../lib/validation';
import type { AppData, BookingInput, Equipment, Profile } from '../lib/types';
const profile: Profile = { id: 'student', name: 'Student', role: 'Student', department_id: 'department', late_count: 0, restricted_until: null };
const equipment: Equipment = { id: 'kits', name: 'Arduino Kit', category: 'Electronics', total_quantity: 10, lab_id: 'lab', condition: 'Good', maintenance_status: false, unit_value_high: false };
const data = (): AppData => ({ profile, equipment: [equipment], labs: [{ id: 'lab', name: 'Embedded Systems', department_id: 'department', capacity: 30, location: 'Block A', facilities: [], status: 'Available' }, { id: 'other', name: 'Electronics', department_id: 'department', capacity: 25, location: 'Block B', facilities: [], status: 'Available' }], departments: [], bookings: [], availability: [], issues: [], blocks: [], notifications: [], rules: [], users: [], audit: [] });
const start = '2030-10-01T09:00:00+05:00', middle = '2030-10-01T10:00:00+05:00', end = '2030-10-01T11:00:00+05:00';
const reservation = (id: string, from: string, to: string, quantity: number) => ({ id, lab_id: null, start_at: from, end_at: to, booking_status: 'Reserved' as const, booking_items: [{ equipment_id: 'kits', quantity }] });
afterEach(() => vi.useRealTimers());
describe('equipment half-open availability', () => {
  it('uses peak occupancy rather than summing consecutive reservations', () => { const state = data(); state.availability = [reservation('first', start, middle, 6), reservation('second', middle, end, 6)]; expect(availableQuantity(equipment, start, end, state)).toBe(4); });
  it('counts simultaneously overlapping reservations', () => { const state = data(); state.availability = [reservation('first', start, end, 6), reservation('second', middle, end, 3)]; expect(availableQuantity(equipment, start, end, state)).toBe(1); });
  it('treats adjacent endpoints as free', () => { const state = data(); state.availability = [reservation('first', start, middle, 10)]; expect(availableQuantity(equipment, middle, end, state)).toBe(10); });
  it('maintenance and resource blocks override stock', () => { const state = data(); state.blocks = [{ id: 'block', lab_id: null, equipment_id: 'kits', start_at: start, end_at: end, reason: 'Inspection' }]; expect(availableQuantity(equipment, start, end, state)).toBe(0); expect(availableQuantity({ ...equipment, maintenance_status: true }, start, end, data())).toBe(0); });
  it('equipment in a closed parent lab is unavailable', () => { const state = data(); state.labs[0].status = 'Closed'; expect(availableQuantity(equipment, start, end, state)).toBe(0); });
  it('equipment inherits parent lab blocks, preserving adjacent availability', () => { const state = data(); state.blocks = [{ id: 'parent-block', lab_id: 'lab', equipment_id: null, start_at: start, end_at: middle, reason: 'Lab inspection' }]; expect(availableQuantity(equipment, start, end, state)).toBe(0); expect(availableQuantity(equipment, middle, end, state)).toBe(10); });
  it('includes overdue custody from another user, subtracting partial returns', () => { vi.useFakeTimers().setSystemTime(new Date(start)); const state = data(); state.inventoryCustody = [{ booking_id: 'older', equipment_id: 'kits', quantity: 6, returned_quantity: 2, due_at: '2030-09-30T10:00:00+05:00', returned_at: null }]; expect(availableQuantity(equipment, start, end, state)).toBe(6); });
  it('does not double-count custody represented by an active reservation', () => { vi.useFakeTimers().setSystemTime(new Date(start)); const state = data(); state.availability = [reservation('same', start, end, 6)]; state.inventoryCustody = [{ booking_id: 'same', equipment_id: 'kits', quantity: 6, due_at: '2030-09-30T10:00:00+05:00', returned_at: null }]; expect(availableQuantity(equipment, start, end, state)).toBe(4); });
});
describe('permissions', () => {
  it('student cannot invoke management or lifecycle operations', () => { expect(can(profile, 'manage')).toBe(false); expect(can(profile, 'issue')).toBe(false); expect(() => assertCan(profile, 'approve')).toThrow('permission'); });
  it('staff cannot approve high-value equipment, coordinator cannot issue', () => { expect(can({ ...profile, role: 'Lab Staff' }, 'highValue')).toBe(false); expect(can({ ...profile, role: 'Coordinator' }, 'highValue')).toBe(true); expect(can({ ...profile, role: 'Coordinator' }, 'issue')).toBe(false); });
});
describe('Karachi timestamps', () => {
  it('uses explicit +05:00 regardless of process timezone', () => { expect(toTimestamp('2026-10-01T10:30')).toBe('2026-10-01T05:30:00.000Z'); expect(toTimestamp('2026-10-01T10:30:00')).toBe('2026-10-01T05:30:00.000Z'); expect(toTimestamp('2026-10-01T10:30:00+05:00')).toBe('2026-10-01T05:30:00.000Z'); });
  it('rejects invalid input', () => expect(() => toTimestamp('invalid')).toThrow('valid date'));
});
describe('lab and alternative eligibility', () => {
  const input: BookingInput = { lab_id: 'lab', start_at: start, end_at: end, purpose: 'Project research', attendees: 15, notes: '', items: [{ equipment_id: 'kits', quantity: 6 }] };
  it('rejects capacity and maintenance before suggesting a lab', () => { const state = data(); expect(labAvailable('lab', { ...input, attendees: 31 }, state)).toBe(false); state.labs[0].status = 'Maintenance'; expect(labAvailable('lab', input, state)).toBe(false); });
  it('suggests full equipment-only requests at alternate times when original stock is exhausted', () => { vi.useFakeTimers().setSystemTime(new Date('2030-10-01T07:00:00+05:00')); const state = data(); state.availability = [reservation('exhausted', start, end, 10)]; const alternatives = findAlternatives({ ...input, lab_id: null }, state, 60); expect(alternatives.length).toBeGreaterThan(0); expect(alternatives.some(a => +new Date(a.start_at) >= +new Date(end) && !a.reduced)).toBe(true); for (const alternative of alternatives) { expect(alternative.lab).toBeNull(); expect(+new Date(alternative.end_at) - +new Date(alternative.start_at)).toBe(7200000); } });
  it('flags physical lab overruns for immediate requests even outside the scheduled interval', () => { vi.useFakeTimers().setSystemTime(new Date(start)); const state = data(); state.availability = [{ id: 'overrun', lab_id: 'lab', start_at: '2030-10-01T06:00:00+05:00', end_at: '2030-10-01T08:00:00+05:00', booking_status: 'In Use', booking_items: [] }]; expect(labAvailable('lab', input, state)).toBe(false); });
  it('returns actual scores and full requests before reduced quantities', () => { vi.useFakeTimers().setSystemTime(new Date('2030-10-01T07:00:00+05:00')); const state = data(); state.availability = [reservation('reserved', start, end, 5)]; const alternatives = findAlternatives(input, state, 60); expect(alternatives.some(a => a.reduced)).toBe(true); expect(alternatives.some(a => !a.reduced)).toBe(true); const firstReduced = alternatives.findIndex(a => a.reduced); expect(alternatives.slice(firstReduced).every(a => a.reduced)).toBe(true); for (const alternative of alternatives) expect(alternative.score).toBe(Math.round(Object.values(alternative.contributions).reduce((sum, value) => sum + value, 0))); });
  it('never suggests a request beyond configured duration or with a restricted profile', () => { vi.useFakeTimers().setSystemTime(new Date('2030-10-01T07:00:00+05:00')); const state = data(); state.rules = [{ key: 'max_duration_hours', value: 1 }]; expect(findAlternatives(input, state)).toEqual([]); state.rules = []; state.profile = { ...profile, restricted_until: end }; expect(findAlternatives(input, state)).toEqual([]); });
});
describe('reporting denominator and department scope', () => {
  it('unions overlapping blocks before subtracting operational hours', () => {
    vi.useFakeTimers().setSystemTime(new Date('2030-10-03T12:00:00+05:00'));
    const state = data();
    state.blocks = [{ id: 'a', lab_id: 'lab', equipment_id: null, start_at: '2030-10-01T10:00:00+05:00', end_at: '2030-10-01T12:00:00+05:00', reason: 'Maintenance' }, { id: 'b', lab_id: 'lab', equipment_id: null, start_at: '2030-10-01T11:00:00+05:00', end_at: '2030-10-01T13:00:00+05:00', reason: 'Inspection' }];
    state.bookings = [{ id: 'completed', user_id: profile.id, lab_id: 'lab', start_at: '2030-10-01T09:00:00+05:00', end_at: '2030-10-01T14:00:00+05:00', purpose: 'Research', attendees: 10, booking_status: 'Completed', approval_status: 'Approved', priority: 0, created_at: start, booking_items: [] }];
    const report = calculateAnalytics(state, 2);
    expect(report.utilization.find(lab => lab.id === 'lab')).toMatchObject({ availableHours: 15, bookedHours: 2, utilization: 13.3 });
    expect(report.total).toBe(1);
  });
  it('excludes future bookings and other-department own requests for coordinator analytics', () => {
    vi.useFakeTimers().setSystemTime(new Date('2030-10-03T12:00:00+05:00'));
    const state = data(); state.profile = { ...profile, role: 'Coordinator' }; state.labs[1].department_id = 'other-department';
    const entry = { id: 'booking', user_id: profile.id, lab_id: 'other', start_at: '2030-10-01T09:00:00+05:00', end_at: '2030-10-01T10:00:00+05:00', purpose: 'Research', attendees: 10, booking_status: 'Completed' as const, approval_status: 'Approved', priority: 0, created_at: start, booking_items: [] };
    state.bookings = [entry, { ...entry, id: 'future', lab_id: 'lab', start_at: '2030-10-04T09:00:00+05:00', end_at: '2030-10-04T10:00:00+05:00' }];
    const report = calculateAnalytics(state, 2); expect(report.total).toBe(0); expect(report.utilization).toHaveLength(1); expect(report.departments).toEqual([]);
  });
  it('uses zero denominator for closed labs and retains actual rejection reasons', () => {
    vi.useFakeTimers().setSystemTime(new Date('2030-10-03T12:00:00+05:00'));
    const state = data(); state.labs[0].status = 'Closed'; state.bookings = [{ id: 'rejected', user_id: profile.id, lab_id: 'lab', start_at: start, end_at: end, purpose: 'Research', attendees: 1, booking_status: 'Rejected', approval_status: 'Rejected', decision_reason: 'Safety induction required', priority: 0, created_at: start, booking_items: [] }];
    const report = calculateAnalytics(state, 2); expect(report.utilization[0].availableHours).toBe(0); expect(report.rejectionReasons).toEqual([{ name: 'Safety induction required', bookings: 1 }]);
  });
});
describe('administration validation', () => {
  it('rejects arbitrary keys, fractional quantities and disabling required high-value approvals', () => { expect(() => validateRule('invented_rule', 3)).toThrow('supported'); expect(() => validateRule('max_quantity_per_user', 1.5)).toThrow(); expect(() => validateRule('high_value_approval_required', 'false')).toThrow(); expect(() => validateRule('high_value_approval_required', false)).toThrow('High-value'); expect(validateRule('high_value_approval_required', true)).toBe(true); });
  it('requires a strong temporary password and a trusted role for a new account', () => { const account = { name: 'New Student', email: 'student@example.edu', role: 'Student', department_id: null, active: true, temporary_password: 'short' }; expect(newUserSchema.safeParse(account).success).toBe(false); expect(newUserSchema.safeParse({ ...account, temporary_password: 'UniversityLab123!' }).success).toBe(true); expect(newUserSchema.safeParse({ ...account, role: 'Super Admin', temporary_password: 'UniversityLab123!' }).success).toBe(false); });
});
