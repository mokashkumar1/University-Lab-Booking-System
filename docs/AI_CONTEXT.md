# AI Continuation Context

## Project in one paragraph

UniLab is a deployed, mobile-first university lab/equipment booking app. It uses Next.js App Router server components/Server Actions, a server-only Supabase service client and PostgreSQL RPC functions. The real demo flow is verified: Student request → database conflict alternatives → authorized approval → staff issue → return → notifications/audit.

## Do not change without evidence

- Do not replace the Next.js/Supabase/server-action/RPC architecture.
- Do not expose the service-role key or give browser roles direct application table access.
- Do not weaken database constraints, high-value approval, stock locks, interval rules or authorization just to unblock UI work.
- Do not rerun `scripts/apply-schema.mjs` against a populated database; it is a guarded empty-schema bootstrap.
- Do not treat demo images/history as real university statistics.
- Do not redesign the approved mobile-first design language in `final-plan.md` and reference image folders.

## Start here

1. Read `PROJECT_CONTEXT.md`, `AUDIT_REPORT.md`, `TODO.md` and the relevant domain document.
2. Read `final-plan.md` for product/business requirements.
3. For code work, trace route → `components/screens/route.tsx` → component → `lib/actions.ts`/`lib/dal.ts` → SQL function.
4. Make the smallest coherent change, then update this documentation, `IMPLEMENTATION_STATUS.md`, `TODO.md`, `KNOWN_ISSUES.md` and `CHANGELOG.md` if status changes.

## Important files

- Server auth/data: `lib/supabase/*`, `lib/dal.ts`, `lib/actions.ts`, `lib/permissions.ts`.
- Business logic: `lib/availability.ts`, `lib/alternatives.ts`, `lib/analytics.ts`, `lib/validation.ts`.
- Schema: `supabase/schemas/01_core.sql`, `02_workflows.sql`, `03_management.sql`.
- UI router: `components/screens/route.tsx`; protected layout: `app/(app)/layout.tsx`.
- Evidence/scripts: `tests/`, `supabase/tests/`, `scripts/live-flow.mjs`, `scripts/verify-production.mjs`.

## Current phase

The demo implementation is complete and verified. The next phase is operational hardening: account lifecycle decisions, rate limiting, migrations/CI, Supabase/Vercel operational confirmation and accessibility coverage.

## Known limitations

- No public signup/email verification/password reset/SSO/MFA.
- No application-level rate limiting or versioned CI workflow.
- Production dashboard settings, backups, observability and load behavior are not evidenced in source control.
- Session expiry and full accessibility coverage require verification.
