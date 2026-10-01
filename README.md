# UniLab — University Lab & Equipment Booking System

UniLab is a mobile-first Next.js application for university lab and equipment requests, authorized approvals, physical issue/return and explainable conflict alternatives. The approved specification is `final-plan.md`; the visual references are in `mobile/` and `DESKTOP/`.

## Run locally

Requires Node.js 20.9+ and npm.

```sh
npm ci
cp .env.example .env.local
npm run db:apply
npm run seed
npm run dev
```

On Windows copy `.env.example` to `.env.local` with `Copy-Item`. Fill the actual target project's publishable key, server secret, `POSTGRES_URL_NON_POOLING`, and `SUPABASE_PROJECT_REF=ahewjncliytgfphaepbz` before applying the schema. The bootstrap refuses a different project or an existing application schema. For later changes use reviewed incremental migrations.

The seed provisions real Supabase Auth users, five labs, twenty equipment entries, rules and sixty days of explicitly marked demo history. Random demo passwords are written only into ignored `.env.local`. Transfer the `DEMO_*` variables to Vercel using encrypted environment settings, and enable `DEMO_MODE=true`. Normal password sign-in remains available with demo access disabled. No UI role switch bypasses authentication.

## Architecture and permissions

Browser → authenticated server action → server-only DAL → restricted PostgreSQL RPC → transactional state, audit and notification → refreshed UI.

- Next.js 16 App Router, TypeScript, Tailwind 4, shadcn/ui (Radix), Recharts and Supabase SSR.
- The verified Auth user ID selects the database profile. Form-supplied roles and actor IDs are never trusted.
- Tables have RLS with no browser data policies. Only the server uses the private Supabase key after checking role, ownership and department.
- Database functions independently enforce role/state permissions, including high-value Coordinator/Admin approvals.
- Pending requests hold reservations. Half-open intervals allow adjacent slots. A PostgreSQL exclusion constraint protects lab overlap; ordered resource locks protect stock and eligibility updates.
- Equipment availability uses peak simultaneous quantities, rather than summing consecutive reservations. Physical custody is rechecked at issue.
- Issue/return, damage, late restrictions, cancellations, notifications and audit records are handled transactionally.
- Alternatives use the approved deterministic score and the same database eligibility checks. Reduced quantities require explicit acceptance.
- Times use UTC storage and explicit Asia/Karachi input/display. Reports use stored seeded/live records, with scoped Coordinator access.

## Screens

Student/faculty: dashboard, Browse & Book, labs and equipment details, resource/date/time selection, request summary, booking details/history, calendar, notifications and profile.

Staff: scoped request approvals, high-value routing, equipment issue and return, condition/damage recording and resource blocks.

Coordinator: department approvals, rules and reports. Admin: user, department, resource/category management, global rules, reports and audit views. Desktop uses a sidebar and three-pane browsing workspace; mobile uses Home/Browse/Bookings/Profile bottom navigation and cards.

## Verification

```sh
npm run typecheck
npm test
npm run build
npm run preview:ui
# in another terminal:
npm run test:ui
node tests/ui/interactions.mjs
```

The SQL test executes the exact application schema in isolated PostgreSQL (PGlite) with `btree_gist`. The UI harness uses fixtures only under `tests/ui`, with mocked actions. It does not add an authentication bypass to the application. Browser results and screenshots are in `docs/evidence/ui`.

See `docs/database-verification.md`, `docs/DATABASE.md`, `docs/IMPLEMENTATION_STATUS.md` and `docs/AUDIT_REPORT.md` for measured checks and their limitations. Hosted authentication, transactional behavior, simultaneous competing reservations, and the browser request → approval → issue → return flow have been verified against the connected Supabase project. Evidence is recorded in `docs/evidence`.

## Deployment

The local project is linked to Vercel `mokashs-projects/university-lab-booking-system`. Set the same Supabase and demo variables for Production and Preview as needed. Git integration can deploy `main`; `vercel --prod` also deploys the current source. `.env.local`, `.vercel`, build output and dependency directories are ignored. Private keys are never committed.

The connected Supabase database is provisioned and encrypted Production environment variables are configured. Missing configuration produces an explicit connection-required state; the interface never substitutes pretend authentication.

Images use licensed Pexels and Unsplash source photographs with responsive sizing and fallback placeholders. Replace resource image URLs with your university's photographs through resource management. The default images are illustrative, not photographs of a specific seeded university lab.

## Project handoff documentation

The `docs/` directory is the maintained handoff source for the project:

- `PROJECT_CONTEXT.md` and `PROJECT_STRUCTURE.md` explain the product and codebase.
- `FEATURES.md`, `IMPLEMENTATION_STATUS.md` and `AUDIT_REPORT.md` distinguish verified implementation from omissions and operational gaps.
- `DATABASE.md`, `AUTHENTICATION.md`, `API.md`, `UI_FEATURE_AUDIT.md`, `SECURITY_AUDIT.md` and `TESTING.md` contain domain audits and evidence limits.
- `TODO.md`, `AI_CONTEXT.md`, `AI_TASK_QUEUE.md`, `DECISIONS.md`, `KNOWN_ISSUES.md` and `CHANGELOG.md` are required updates for future work.
