# UniLab database verification and setup

The desired database schema is versioned in `supabase/schemas/01_core.sql`, `02_workflows.sql` and `03_management.sql`. Supabase CLI configuration uses declarative schema paths. No migration history has been invented and no database belonging to another project has been modified.

## Verified evidence

Run `node supabase/tests/sql-verification.mjs` after installing project dependencies. This starts an isolated PostgreSQL WASM engine with the real `btree_gist` extension and executes the exact production SQL. Auth user IDs and Supabase database roles are created only within this ephemeral test instance.

45 assertions passed on 1 October 2026:

- Schema syntax and all functions load successfully.
- Ten kits with consecutive six-kit bookings leave four available throughout the combined interval.
- Equipment stock cannot be overbooked; adjacent lab slots are accepted; overlapping lab slots fail with PostgreSQL exclusion violation.
- Student approval and resource/rule mutations are denied.
- Staff cannot approve high-value requests; Coordinator can approve requests in their department.
- Repeated approvals, cancellations, issues and returns produce a single effect. Cumulative partial returns preserve remaining physical custody and stay In Use until every issued item is returned.
- Issued bookings cannot be cancelled.
- A late damaged return records damage, maintenance and exactly one late-count increment.
- Department rules override global booking limits and are enforced by request validation.
- Reducing inventory below peak reservations is denied; an admissible update succeeds.
- Blocks conflict with existing reservations, including equipment-only reservations in the blocked lab. Issue rechecks owning-lab closure/blocks and equipment damage.
- Updating an equipment entry without moving its assigned lab succeeds while reservations exist.
- Lab capacity cannot be reduced below booked attendees.
- Admin profile creation and email updates must match the real Auth account. Rules reject nulls, fractions, wrong types and attempts to disable high-value approval.
- Every application table has RLS enabled; authenticated callers cannot execute privileged booking RPCs.

These local tests run exact SQL. Additional live checks subsequently passed on the authorized Universitylab project:

- `node --env-file=.env.local supabase/tests/hosted-verification.mjs`: 16 hosted transaction assertions; temporary resources, transitions, notifications, audits and late counters rolled back completely.
- `node --env-file=.env.local supabase/tests/concurrency-verification.mjs`: ten simultaneous lab requests commit exactly once and reject all nine others with 23P01; simultaneous eight-of-ten equipment requests commit exactly once and reject the second after the stock lock/recheck. Dedicated random-ID fixtures and all generated rows are removed afterward.
- `node --env-file=.env.local supabase/tests/auth-verification.mjs`: all four actual demo accounts sign in with passwords, resolve active profiles and sign out successfully.

Hosted SQL/Auth verification does not prove a browser lifecycle or deployed UI. Those checks are reported separately by the application verification owner.

## Project setup

The authorized project is Universitylab, `ahewjncliytgfphaepbz`. Populate `.env.local` with the target project's URL, publishable key, server secret/service-role key and a database URL. Keep `.env.local` out of version control. An empty secret is not a configured integration.

The guarded bootstrap script requires `SUPABASE_PROJECT_REF=ahewjncliytgfphaepbz` and a matching project URL. Run:

```powershell
$env:SUPABASE_PROJECT_REF = 'ahewjncliytgfphaepbz'
node --env-file=.env.local scripts/apply-schema.mjs
npm run seed
```

`apply-schema.mjs` refuses a populated public schema, applies all three files within one transaction and never prints credentials. For subsequent changes, edit declarative schemas, generate and review a migration using the installed Supabase CLI's documented declarative workflow, then apply that incremental migration. Do not rerun bootstrap against a populated schema.

The seed creates five labs, twenty equipment entries, four real Supabase Auth demo users and profiles, rules and sixty days of explicitly marked demo history. The live Arduino scenario has twenty total kits, eight reserved and five issued, leaving seven for the immediate window. Demo role passwords are generated randomly and saved only in `.env.local`; push those server environment variables to Vercel securely. Names are `DEMO_STUDENT_EMAIL/PASSWORD`, `DEMO_LAB_STAFF_EMAIL/PASSWORD`, `DEMO_COORDINATOR_EMAIL/PASSWORD`, `DEMO_ADMIN_EMAIL/PASSWORD`, plus `DEMO_MODE=true`. Disable demo access before institutional use.

Seed history uses stable IDs and preserves previously created booking records. Run on the dedicated demonstration project: resource/profile defaults are refreshed deliberately by this setup utility and should not be used as a production maintenance command.

## Access and workflow

No browser data policies are installed. Anonymous and authenticated table grants are revoked. The server-only DAL verifies Auth identity and permissions before using the service role. SQL functions independently check active profiles, roles, department ownership and state. Privileged RPC execution is revoked from PUBLIC, anon and authenticated and granted to service_role. All functions use a fixed search_path and SECURITY INVOKER.

All resource-owning lab locks precede equipment locks; both are taken in UUID order. Creation, issue/return, blocks and management reuse these locks. The booking transaction consolidates duplicate requested equipment IDs and computes peak simultaneous occupancy using grouped half-open interval events. Physical overdue custody is included for immediate requests without double-counting the booking allocation. Issue rechecks physical stock. Damaged returns preserve late facts and place the equipment entry in maintenance.

Global rules are Admin-managed; Coordinators write overrides for their department. Coordinator/Admin priority updates use `set_booking_priority`, which enforces department scope and writes an audit record. Cross-department equipment requests require an Admin to approve or operate.

## Hosted setup status

On 1 October 2026, the user supplied the missing private project credentials. The guarded bootstrap confirmed the authorized project's public schema was empty and deployed all schema files transactionally. Real Supabase Auth users and application data were seeded successfully. Hosted SQL, concurrency and Auth checks above passed. Generated demo credentials remain in the ignored server environment file and must be transferred to Vercel without printing them.

