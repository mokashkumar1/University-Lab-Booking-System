import type { Alternative, AppData, BookingInput } from './types';
import { availableQuantity, labAvailable } from './availability';
export const SCORE_WEIGHTS = { capacity: .30, department: .20, equipment: .30, time: .20 };
export function findAlternatives(input: BookingInput, data: AppData, limit = 3): Alternative[] {
  const duration = +new Date(input.end_at) - +new Date(input.start_at);
  const start = +new Date(input.start_at);
  const shifts = Array.from({ length: 17 }, (_, i) => (i - 8) * 1800000).concat([86400000, 172800000, 259200000]);
  const candidates: Alternative[] = [];
  const getRule = (key: string, fallback: number) => Number(data.rules.find(r => r.key === key)?.value ?? fallback);
  const maxDays = getRule('max_advance_days', 30);
  if (duration > getRule('max_duration_hours', 4) * 3600000 || (data.profile?.restricted_until && +new Date(data.profile.restricted_until) > Date.now()) || (data.profile?.late_count || 0) >= getRule('late_return_limit', 3)) return [];
  if (input.items.some(item => item.quantity > getRule('max_quantity_per_user', 10))) return [];
  for (const lab of input.lab_id ? data.labs : [null]) for (const shift of shifts) {
    const candidateLabId = lab?.id || null;
    if (!shift && candidateLabId === input.lab_id) continue;
    if (shift && candidateLabId !== input.lab_id) continue;
    const from = start + shift;
    if (from <= Date.now() || from > Date.now() + maxDays * 86400000) continue;
    const trial = { ...input, lab_id: lab?.id || null, start_at: new Date(from).toISOString(), end_at: new Date(from + duration).toISOString() };
    if (lab && !labAvailable(lab.id, trial, data)) continue;
    const items = input.items.map(i => ({ ...i, quantity: Math.min(i.quantity, availableQuantity(data.equipment.find(e => e.id === i.equipment_id)!, trial.start_at, trial.end_at, data)) }));
    if (items.some(i => !i.quantity)) continue;
    const ratio = lab ? input.attendees / lab.capacity : 1;
    const capacity = ratio >= .3 ? 1 : .4 + .6 * ratio / .3;
    const department = lab?.department_id === data.profile?.department_id ? 1 : 0;
    const equipment = items.length ? items.reduce((sum, i, index) => sum + i.quantity / input.items[index].quantity, 0) / items.length : 1;
    const time = 1 - Math.min(Math.abs(shift) / 14400000, 1);
    const contributions = { capacity: capacity * 30, department: department * 20, equipment: equipment * 30, time: time * 20 };
    const reduced = items.some((i, index) => i.quantity < input.items[index].quantity);
    candidates.push({ lab, start_at: trial.start_at, end_at: trial.end_at, items, contributions, score: Math.round(Object.values(contributions).reduce((sum, v) => sum + v, 0)), reduced, explanation: `${lab?.id === input.lab_id ? 'Your requested lab at a nearby time' : lab ? 'An available lab with capacity for your group' : 'Your equipment at a nearby time'}.${reduced ? ' Reduced equipment quantities require your explicit acceptance.' : ' All requested equipment quantities are available.'}` });
  }
  return candidates.sort((a, b) => Number(a.reduced) - Number(b.reduced) || b.score - a.score).slice(0, limit);
}
