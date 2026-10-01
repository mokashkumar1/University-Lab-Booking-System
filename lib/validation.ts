import { z } from 'zod';
const numericRules = ['max_duration_hours', 'max_advance_days', 'max_quantity_per_user', 'late_return_limit', 'restriction_days'];
export const accountNameSchema = z.string().trim().min(2, 'Enter your full name.').max(200);
export const accountEmailSchema = z.string().trim().email('Enter a valid email address.').max(254);
export const accountPasswordSchema = z.string().min(12, 'Use at least 12 characters for your password.').max(128);
export function validateRule(key: string, raw: unknown): number | boolean {
  if (key === 'high_value_approval_required') return z.literal(true, { error: 'High-value equipment must retain Coordinator or Admin approval.' }).parse(raw);
  if (!numericRules.includes(key)) throw new Error('Choose a supported booking rule.');
  return z.number().int().min(1, 'Rule values must be positive whole numbers.').max(365, 'Rule values must not exceed 365.').parse(raw);
}
export const newUserSchema = z.object({ name: accountNameSchema, email: accountEmailSchema, role: z.enum(['Student', 'Faculty', 'Lab Staff', 'Coordinator', 'Admin']), department_id: z.string().uuid().nullable(), temporary_password: accountPasswordSchema, active: z.boolean() });
