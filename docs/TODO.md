# Prioritized Work

## P0 — Critical

No known defect currently prevents the seeded demonstration workflow. Do not reclassify as production-ready institutional software without completing the P1 security and operations tasks.

## P1 — High Priority

| Task | Reason | Related files | Dependencies | Status | Verification |
| --- | --- | --- | --- | --- | --- |
| Define account lifecycle | Signup/recovery/verification are intentionally absent; institution must choose provision-only or implement them. | `app/login`, `lib/actions`, Supabase Auth configuration | Product and security owner decision | OPEN | Approved flows, provider config, negative tests. |
| Add rate limiting and abuse protection | Login and sensitive mutation paths have no application-level limiter. | Auth/actions, deployment configuration | Platform choice | OPEN | Automated threshold tests and production monitoring. |
| Establish incremental migration workflow + drift check | Bootstrap cannot update an existing schema and no migration CI exists. | `supabase/schemas`, scripts, CI | Supabase CLI/project access | OPEN | Generate/review migration, schema diff and rollback rehearsal. |
| Confirm production operational settings | Auth providers, redirect URLs, Data API exposure, backups and monitoring live outside the repo. | Supabase/Vercel dashboards | Account owner access | OPEN | Signed checklist / screenshots without secrets. |

## P2 — Medium Priority

| Task | Reason | Related files | Dependencies | Status | Verification |
| --- | --- | --- | --- | --- | --- |
| Automated accessibility pass | Current accessibility evidence is focused, not full WCAG coverage. | `components`, `app/globals.css`, UI tests | Test-tool choice | OPEN | axe/keyboard/screen-reader/contrast results. |
| Add CI checks | Current checks are runnable but no workflow is versioned. | `.github/workflows`, package scripts | GitHub Actions policy | OPEN | PR run executes type, unit, build and non-mutating UI tests. |
| Improve disabled-account messaging | Redirect currently looks like generic sign-in state. | `lib/dal.ts`, login UI | Support/privacy wording | OPEN | Inactive profile test and approved copy review. |
| Document/load-test data reads | DAL fetches several complete datasets; scale limits are unknown. | `lib/dal.ts`, database indexes | Representative data volume | OPEN | Query plan and load test baseline. |

## P3 — Low Priority

| Task | Reason | Related files | Dependencies | Status | Verification |
| --- | --- | --- | --- | --- | --- |
| Replace illustrative images | Current photography is generic. | `public/images`, resource forms, image-source docs | University image rights | OPEN | Responsive image and attribution review. |
| Optional QR/wall-display/heatmap | Deferred by approved plan. | New isolated routes/components | Product approval | NOT STARTED | Permission and viewport checks. |
| Account deletion/deprovision policy | Admin can archive/deactivate but no delete UI. | Admin management/schema | Retention policy | OPEN | Data-retention and session-revocation test. |
