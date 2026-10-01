# Security Audit

## Verified controls

| Area | Finding | Evidence |
| --- | --- | --- |
| Secret handling | Service/database credentials are server-only and ignored by Git; no tracked secret file was found in the audit check. | `.gitignore`, `.env.example`, `lib/supabase/admin.ts`. |
| Authentication | Password login uses Supabase Auth; generic sign-in error limits credential feedback. | `lib/actions.ts`, hosted four-role Auth check. |
| Authorization | Actions obtain the profile from the session; client roles/actor IDs are not trusted. | `lib/dal.ts`, `lib/actions.ts`, `permissions.ts`. |
| Database authorization | Privileged functions recheck roles, department scope, status and high-value rules. | `supabase/schemas/01_core.sql`–`03_management.sql`; 45 SQL checks. |
| Data API access | Tables use RLS and revoke direct anon/authenticated privileges; privileged RPCs are service-role only. | Schema grants/revokes. |
| Input validation | Zod validates sign-in, rules, account creation and key mutation values; SQL validates state/interval/quantities. | `lib/validation.ts`, actions, SQL functions. |
| SQL injection | Application data is sent through Supabase client/RPC parameters; management SQL uses identifier allow-lists. | Actions + management function review. |
| XSS | No `dangerouslySetInnerHTML`/`eval` usage found in application search. React escaping is the primary defense. | Static scan during audit. |
| CSRF | Server Actions and Supabase cookie handling use framework-origin protections; no separate state-changing public HTTP endpoint exists. | Architecture review. |
| Auditability | Key workflow and management functions write audit records. | Workflow/management SQL and public lifecycle evidence. |

## Risks and recommendations

| Severity | Item | Reason / next step |
| --- | --- | --- |
| High for institutional rollout | No application-level login or mutation rate limiting | Add an approved rate-limit strategy before opening accounts beyond controlled demo use. |
| High for operations | Recovery and verification flows absent | Keep public signup disabled until verified reset/email-verification UX and provider configuration exist. |
| Medium | Supabase dashboard settings are not versioned | Verify production Auth provider, redirect URLs, Data API exposure, JWT/session configuration and backups in the dashboard. |
| Medium | Service-role access is broad by design | Keep all service-client modules server-only; add CI scanning and deploy environment least-privilege review. |
| Medium | No automated security/dependency scan in scripts | Add dependency audit/SCA and a Supabase advisor check to CI. |
| Low | Disabled account UX is generic | Provide an approved support contact message after confirming it does not leak account status. |

No actual credentials, tokens, database URLs or user passwords are included in this report.
