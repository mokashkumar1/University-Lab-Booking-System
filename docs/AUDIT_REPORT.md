# UniLab Audit Report

Audit date: 2026-10-01
Audit scope: repository source, configuration, schema, Auth/DAL/actions, UI routes, checked-in evidence and fresh non-destructive verification. No application feature behavior was changed.

## Project health

| Area | Health | Evidence and conclusion |
| --- | --- | --- |
| Architecture | Healthy | Coherent Next.js Server Action → server-only DAL → restricted RPC architecture. |
| Frontend | Healthy with accessibility follow-up | Full declared route set, responsive shell, empty/error/loading states and checked-in viewport evidence. |
| Backend/workflows | Healthy | Server actions and database functions cover booking, alternatives, approvals, custody, maintenance, notifications, audit and management. |
| Database | Healthy with migration-process gap | Strong constraints/RLS/function grants and 45 isolated SQL checks; initial bootstrap is safe but later migrations are not operationalized in repo. |
| Authentication | Healthy for provisioned demo accounts | Four actual roles signed in in this audit; self-service account lifecycle is intentionally absent. |
| Testing | Healthy for core demo; incomplete for operations | Fresh type/unit/schema/build/Auth checks pass; no CI, load, recovery or comprehensive accessibility coverage. |
| Deployment | Previously verified; operational settings need owner confirmation | Public deployment evidence passes, but dashboard-only configuration/backups/monitoring cannot be proven from repository inspection. |

## Fresh verification performed

| Check | Result |
| --- | --- |
| `npm run typecheck` | Passed. |
| `npm test` | Passed: 22 Vitest checks and 45 PostgreSQL checks. |
| `npm run build` | Passed; all declared routes compiled. |
| Hosted Auth verification | Passed for Student, Lab Staff, Coordinator and Admin active profiles. |
| Tracked-secret filename scan | No tracked environment/key/pem file found. |

## Verified complete functionality

- Authenticated role-aware application shell and protected routes.
- Student/faculty browsing, requests, availability, conflict alternatives, lifecycle/history and notifications.
- Database-enforced interval conflicts, peak equipment quantities, blocks, maintenance and eligibility rules.
- Staff approval, issue/return, partial/damaged/late custody rules.
- Coordinator high-value approval, department rules and department-scoped analytics.
- Admin user/profile provisioning, resource/category/department management and audit access.
- Public deployment evidence showing all roles at mobile and desktop widths and a persisted end-to-end lifecycle.

## Partially complete

- Accessibility: baseline semantics and dialog/overflow checks are present; comprehensive assistive-technology coverage is not.
- Operations: scripts support test/deploy workflows, but migration lifecycle, CI, monitoring and restore procedures are not fully codified.
- Analytics: renders real seeded/live data and documents its denominator, but has no scale/performance evidence.

## Missing by design

- Public signup, email verification, password reset/recovery, SSO and MFA.
- Email/push notifications, calendar sync, per-unit tracking, mobile native client and optional QR/wall-display features.

## Broken

No reproducible core feature defect was found during this audit. The audit did not attempt destructive or production-mutating test scripts; therefore it does not supersede the dated lifecycle/concurrency evidence already in `docs/evidence`.

## Unknown / requires verification

- Supabase dashboard controls: email provider, redirect list, Data API exposure, session duration, backup retention and advisor findings.
- Vercel environment scoping, monitoring, alerts and rollback procedure.
- Production scale, latency, outage handling, dependency vulnerability state and complete accessibility conformance.
- Institutional retention/deprovision policy and whether accounts should remain Admin-provisioned.

## Critical problems before a broad institutional release

1. Decide and implement an approved account lifecycle, or formally retain provision-only access.
2. Add application-level rate limiting and abuse response for sign-in/sensitive mutations.
3. Establish migration, CI, secret scanning, backup/restore and monitoring procedures.
4. Complete accessibility and production-scale verification.

## Recommended implementation order

```text
1. Product/security owner decides account lifecycle and support policy
2. Configure and verify production Auth/Data API/backups/monitoring
3. Add rate limiting and security/CI checks
4. Establish incremental migrations, drift checks and rollback rehearsal
5. Add signup/recovery only if approved, with full Auth tests
6. Run accessibility and load/performance verification
7. Iterate on optional product features after operational baseline is proven
```

## Documentation rule for future work

Every code or configuration change must update `IMPLEMENTATION_STATUS.md`, `TODO.md`, `KNOWN_ISSUES.md`, `CHANGELOG.md` and the relevant domain document. Claims of completion require a dated command, test result or manual verification record.
