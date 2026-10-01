import type { Profile, Role } from './types';
export type Capability = 'approve' | 'highValue' | 'issue' | 'manage' | 'rules' | 'analytics' | 'block';
const roles: Record<Capability, Role[]> = { approve: ['Lab Staff', 'Coordinator', 'Admin'], highValue: ['Coordinator', 'Admin'], issue: ['Lab Staff', 'Admin'], manage: ['Admin'], rules: ['Coordinator', 'Admin'], analytics: ['Coordinator', 'Admin'], block: ['Lab Staff', 'Coordinator', 'Admin'] };
export function can(profile: Profile | null, capability: Capability) { return Boolean(profile && roles[capability].includes(profile.role)); }
export function assertCan(profile: Profile, capability: Capability) { if (!can(profile, capability)) throw new Error('You do not have permission to perform this action.'); }
