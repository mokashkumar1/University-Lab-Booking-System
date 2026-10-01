import { z } from 'zod';
const numericRules = ['max_duration_hours', 'max_advance_days', 'max_quantity_per_user', 'late_return_limit', 'restriction_days'];
export function validateRule(key: string, raw: unknown): number | boolean {
  if (key === 'high_value_approval_required') return z.literal(true, { error: 'High-value equipment must retain Coordinator or Admin approval.' }).parse(raw);
  if (!numericRules.includes(key)) throw new Error('Choose a supported booking rule.');
  return z.number().int().min(1, 'Rule values must be positive whole numbers.').max(365, 'Rule values must not exceed 365.').parse(raw);
}
export const newUserSchema = z.object({ name: z.string().trim().min(2).max(200), email: z.string().email(), role: z.enum(['Student', 'Faculty', 'Lab Staff', 'Coordinator', 'Admin']), department_id: z.string().uuid().nullable(), temporary_password: z.string().min(12, 'The temporary password must contain at least 12 characters.').max(128), active: z.boolean() });
