import type { AppData, BookingInput, Equipment } from './types';
export const HOLDING_STATES = ['Pending Approval', 'Approved', 'Reserved', 'In Use'];
export function overlaps(a: string, b: string, start: string, end: string) { return new Date(a) < new Date(end) && new Date(b) > new Date(start); }
export function availableQuantity(equipment: Equipment, start: string, end: string, data: Pick<AppData, 'availability' | 'blocks' | 'issues' | 'inventoryCustody'> & Partial<Pick<AppData, 'labs'>>) {
  if (!equipment || equipment.archived || equipment.maintenance_status || equipment.condition === 'Damaged') return 0;
  const parent = data.labs?.find(lab => lab.id === equipment.lab_id);
  if (parent && (parent.archived || parent.status !== 'Available')) return 0;
  if (data.blocks.some(b => (b.equipment_id === equipment.id || b.lab_id === equipment.lab_id) && overlaps(b.start_at, b.end_at, start, end))) return 0;
  const reservations = data.availability.filter(b => HOLDING_STATES.includes(b.booking_status) && overlaps(b.start_at, b.end_at, start, end));
  const events: { at: number; delta: number }[] = [];
  for (const booking of reservations) {
    const quantity = booking.booking_items.filter(i => i.equipment_id === equipment.id).reduce((sum, i) => sum + i.quantity, 0);
    events.push({ at: Math.max(+new Date(start), +new Date(booking.start_at)), delta: quantity }, { at: Math.min(+new Date(end), +new Date(booking.end_at)), delta: -quantity });
  }
  events.sort((a, b) => a.at - b.at || a.delta - b.delta);
  let used = 0, maximum = 0;
  for (const event of events) { used += event.delta; maximum = Math.max(maximum, used); }
  // Overdue custody must be counted only when its booking was not already reserved for this interval.
  const custody = +new Date(start) <= Date.now() + 900000 ? (data.inventoryCustody || data.issues).filter(i => i.equipment_id === equipment.id && !i.returned_at && +new Date(i.due_at) < Date.now() && !reservations.some(b => b.id === i.booking_id)).reduce((sum, i) => sum + i.quantity - (i.returned_quantity || 0), 0) : 0;
  return Math.max(0, equipment.total_quantity - maximum - custody);
}
export function labAvailable(labId: string, input: BookingInput, data: AppData) {
  const lab = data.labs.find(l => l.id === labId);
  return Boolean(lab && !lab.archived && lab.status === 'Available' && lab.capacity >= input.attendees && !data.blocks.some(b => b.lab_id === labId && overlaps(b.start_at, b.end_at, input.start_at, input.end_at)) && !data.availability.some(b => b.lab_id === labId && HOLDING_STATES.includes(b.booking_status) && (overlaps(b.start_at, b.end_at, input.start_at, input.end_at) || (b.booking_status === 'In Use' && +new Date(b.end_at) < Date.now() && +new Date(input.start_at) <= Date.now() + 900000))));
}
