# Project Structure

| Path | Purpose and dependencies | Audit status / modification guidance |
| --- | --- | --- |
| `app/` | App Router routes, layouts, global styles and error/loading boundaries. Depends on `components/` and `lib/`. | Complete route shell. Change with responsive and route tests. |
| `app/(app)/` | Protected workspace routes; each route delegates to `components/screens/route.tsx`. Depends on the authenticated layout. | Complete for declared route set. Keep authorization in the DAL/actions, not only these pages. |
| `app/login/` | Email/password and enabled demo-role sign-in. | Working for seeded users; intentionally lacks signup/recovery. |
| `app/setup/` | Configuration guidance shown when Supabase is unavailable. | Informational fallback only. |
| `components/` | Shared shell, booking flow, browse workspace and form/confirmation components. | Core UI implementation. Preserve the responsive shell and accessible dialogs. |
| `components/screens/` | Screen implementations grouped into student, operational, reports and common modules. `route.tsx` maps routes to them. | Complete for current pages; data shape is adapted in `route.tsx`. |
| `components/ui/` | Small Radix/shadcn primitives. | Reuse before creating duplicate primitives. |
| `lib/actions.ts` | Server Actions for sign-in, booking and all mutations. Depends on DAL, validation and RPCs. | Security-critical; preserve server-only authorization checks. |
| `lib/dal.ts` | Authenticated, scoped read model for all screens. | Security-critical; modify with role/ownership regression checks. |
| `lib/availability.ts`, `alternatives.ts`, `analytics.ts` | Client-side display calculations that mirror server constraints for preview and reports. | Database remains authoritative; change alongside tests. |
| `lib/supabase/` | Cookie session client and private admin client. | Do not import the admin client into client components. |
| `supabase/schemas/` | Declarative target schema: core tables/rules, workflows, management. | Authoritative schema source. Generate reviewed incremental migrations for live schema changes. |
| `supabase/tests/` | Isolated SQL plus hosted Auth, concurrency and management verification scripts. | Strong workflow coverage; scripts with hosted credentials may create temporary fixtures. |
| `scripts/` | Bootstrap, seed, Vercel environment sync, live lifecycle and production verification. | `apply-schema.mjs` only supports an empty authorized database; do not rerun it on a populated project. |
| `tests/` | TypeScript unit tests and fixture/live Playwright UI checks. | Keep fixture and live evidence clearly separated. |
| `docs/evidence/` | Checked-in screenshots and JSON test evidence. | Historical evidence; rerun dated tests before making new completion claims. |
| `public/images/` | Fallback lab/equipment photography. | Replace through resource management or carefully update attribution. |
| `final-plan.md` | Approved product, business-rule and acceptance specification. | Product authority; do not redesign around it. |
| `proxy.ts` | Refreshes Supabase session claims and disables shared caching for matching routes. | Security/session critical. |
| `next.config.ts`, `vercel.json`, `package.json` | Build, image, deployment-region and dependency configuration. | Change only with build/deploy verification. |

## Route map

| Route | Screen / access |
| --- | --- |
| `/login`, `/setup` | Public sign-in and configuration guidance. |
| `/dashboard`, `/browse`, `/labs`, `/labs/[id]`, `/equipment`, `/equipment/[id]`, `/book`, `/bookings`, `/bookings/[id]`, `/calendar`, `/notifications`, `/profile` | Authenticated student/faculty workspace; staff roles may also view shared resources. |
| `/approvals`, `/approvals/[id]`, `/blocks` | Lab Staff, Coordinator or Admin as defined by each action. |
| `/issue-return` | Lab Staff or Admin. |
| `/reports`, `/rules` | Coordinator or Admin. |
| `/admin/[id]` | Admin only; valid sections are users, departments, labs, equipment, categories and audit. |

## Configuration contract

See `.env.example` for names only. Required runtime variables include a public Supabase URL/key and a server-only secret/service key. Bootstrap also requires the protected database connection URL and authorized project reference. `.env.local` and `.vercel/` are ignored; no secret files are tracked.
