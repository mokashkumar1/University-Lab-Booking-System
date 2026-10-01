# Known Issues

## UL-001 — Account lifecycle is deliberately incomplete

- Severity: High for a general institutional launch; not blocking the controlled demo.
- Description: There is no public signup, email verification, password reset, SSO or MFA.
- Reproduction: Open `/login`; only sign-in and configured demo-role entry are offered.
- Expected: Institution chooses and implements its approved account lifecycle.
- Actual: Admin/seed provisioning only.
- Related files: `app/login`, `components/login-form.tsx`, `lib/actions.ts`, `supabase/config.toml`.
- Possible cause: Deferred scope, not a runtime defect.
- Status: OPEN.
- Verification: Approved provider flow plus security/error tests.

## UL-002 — Rate limiting and operational observability are absent

- Severity: High for public exposure.
- Description: No repository-controlled rate limiter, CI workflow, backup/restore test or production monitoring configuration exists.
- Reproduction: Inspect `package.json`, scripts and deployment configuration.
- Expected: Defined abuse controls and release/operational process.
- Actual: Controlled demo relies on provider/platform defaults and manual verification.
- Related files: `lib/actions.ts`, `proxy.ts`, `package.json`, `vercel.json`.
- Status: OPEN.
- Verification: Rate-limit integration tests, CI run, monitoring/backup owner confirmation.

## UL-003 — Accessibility coverage is incomplete

- Severity: Medium.
- Description: The repository has semantic/focus/viewport checks but no automated WCAG, contrast, reduced-motion or screen-reader audit.
- Reproduction: Review `tests/ui/*` and evidence.
- Expected: Accessibility release evidence for changed screens.
- Actual: Baseline is present; comprehensive evidence is missing.
- Related files: `components/`, `app/globals.css`, `tests/ui/`.
- Status: OPEN.
- Verification: Automated and manual assistive-technology checks.

## UL-004 — Existing-schema deployment process needs formalization

- Severity: Medium.
- Description: The bootstrap script intentionally refuses a populated database; no checked-in incremental migration history/CI drift detection exists.
- Reproduction: Read `scripts/apply-schema.mjs`.
- Expected: Safe reviewed schema evolution after initial deployment.
- Actual: Declarative sources exist but operational migration procedure remains manual.
- Related files: `supabase/schemas/`, `supabase/config.toml`, `scripts/apply-schema.mjs`.
- Status: OPEN.
- Verification: Review generated migration, staging apply/rollback and schema-diff check.
