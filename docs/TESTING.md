# Testing and Verification

## Current evidence

| Layer | Command / evidence | Status |
| --- | --- | --- |
| Type checking | `npm run typecheck` | Passed during audit, 2026-10-01. |
| Unit/business logic | `npm test` runs Vitest | Passed: 22 tests. Covers availability, permissions, timestamps, alternatives, analytics and validation. |
| Exact schema | `npm test` runs `supabase/tests/sql-verification.mjs` | Passed: 45 PGlite PostgreSQL checks. |
| Hosted Auth | `node --env-file=.env.local supabase/tests/auth-verification.mjs` | Passed during audit for Student, Lab Staff, Coordinator, Admin. |
| Hosted transactions/concurrency | Existing `database-verification.md` and scripts | Previously passed; not rerun during this documentation audit because they create temporary hosted fixtures. |
| Fixture UI | `tests/ui/verify.mjs`, interaction/conflict/dialog scripts | Existing evidence: 198 viewport-screen checks, 38 interactions, 36 conflict checks, 54 dialog checks. Fixtures mock actions and do not prove database integration. |
| Live UI | `tests/ui/live-readonly.mjs`, production evidence | Existing evidence: 83 local authenticated route/access checks and 34 public production checks. |
| End-to-end lifecycle | `scripts/live-flow.mjs`, `docs/evidence/live/core-flow.json` | Existing public evidence: request, conflict, approval, issue, return, notifications and audit persisted. |
| Production build | `npm run build` | Passed during audit, 2026-10-01. |

## Tests not present or not evidenced

- Hosted verification-email and recovery-email delivery (application routes and live profile provisioning are covered; provider delivery needs a controlled-account test).
- Rate limiting, account lockout, session expiry/revocation and provider misconfiguration.
- Automated accessibility/WCAG, screen-reader, contrast and reduced-motion testing.
- Load, endurance, backup/restore, failure injection, observability and disaster recovery.
- Full production mutation test on every deployment. The lifecycle script mutates demo data and should be run deliberately.
- CI workflow to run tests and deploy checks on pull requests.

## Manual release checklist

- [ ] Confirm Supabase/Vercel production variables exist without printing secrets.
- [ ] Run `npm run typecheck`, `npm test` and `npm run build`.
- [ ] Run hosted Auth verification with approved demo credentials.
- [ ] Review the deployed app at 390px and desktop widths for Student, Lab Staff, Coordinator and Admin.
- [ ] Run a controlled lifecycle test only in the demo environment; confirm its created booking reaches terminal state.
- [ ] Verify direct unauthorized route/action attempts are denied.
- [ ] Perform keyboard, screen-reader and contrast checks for changed UI.
- [ ] Record test date, commit and scope in `docs/evidence` and update the status documents.
