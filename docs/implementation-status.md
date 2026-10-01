# Implementation and verification

The application is implemented in the current folder and connected to the authorized Supabase project. All required role workspaces are available, with server-side authorization and transactional workflows.

Verified locally and against the hosted database:
- Production Next.js build and TypeScript checks pass.
- 22 application regression tests and 45 PostgreSQL schema/workflow checks pass.
- Hosted SQL checks, all four Auth accounts, admin Auth/profile management, and competing reservations pass.
- 198 fixture screen/viewport checks pass at 390×844, 430×932, 768×1024, 1366×768, 1440×900 and 1920×1080.
- 38 interaction, 36 conflict/alternative, and 54 accessible dialog checks pass.
- 83 authenticated live screen/access checks pass.
- The real browser lifecycle creates a request, displays conflict alternatives, approves, issues and returns equipment, and verifies notifications and audit records.

Evidence is recorded under docs/evidence. Fixture tests are isolated from production; live verification uses real Supabase Auth and database state. Seeded records are expressly demo data. Current resource photography is illustrative and can be replaced through management. Reports disclose their historical reporting window and utilization assumptions.

Production environment variables are encrypted in the linked Vercel project. Local credentials, generated demo passwords, dependency/build folders and deployment tokens are excluded from version control.

Production: https://university-lab-booking-system.vercel.app
34 production browser checks pass across the four authenticated roles at mobile and desktop widths. Results and screenshots are in docs/evidence/production.

The full request → conflict suggestions → staff approval → equipment issue → equipment return lifecycle also passed on the public production URL, with persisted notifications and audit history.
