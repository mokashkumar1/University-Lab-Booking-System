# Database Audit

## Provider and connection model

UniLab uses Supabase Postgres and Supabase Auth. Runtime reads and mutations use a server-only Supabase service client. Database bootstrap uses a server-only non-pooling URL and refuses to target a project other than the configured authorized project. Secret values are intentionally omitted from documentation.

The checked-in schema is declarative: `supabase/schemas/01_core.sql`, `02_workflows.sql`, `03_management.sql`; `supabase/config.toml` sets `schema_paths = ["./schemas/*.sql"]`. There are no conventional migration files. This means future live schema changes must be generated and reviewed as incremental migrations; `scripts/apply-schema.mjs` deliberately only initializes an empty public schema.

## Tables and relationships

| Table | Key fields / relationships | Security and status |
| --- | --- | --- |
| `departments` | UUID primary key; unique name; archive flag. | RLS enabled; service role access only. |
| `profiles` | PK is `auth.users.id`; role, department, active/restriction/late fields. | Required bridge from Auth to authorization. |
| `categories` | UUID primary key; unique name; archive flag. | Referenced by equipment. |
| `labs` | Department FK, positive capacity, operational state. | Archive preserves booking history. |
| `equipment` | Lab and optional category FKs, non-negative stock, condition/maintenance/high-value flags. | Stock changes are guarded by management RPC. |
| `bookings` | User and optional lab FKs; interval, status, approval and priority. | GIST exclusion constraint prevents overlapping holding-state lab reservations. |
| `booking_items` | Composite PK `(booking_id, equipment_id)`; positive quantity. | Links a booking to equipment. |
| `issue_returns` | Booking/equipment FKs; quantity, custody and return-condition fields; unique booking/equipment pair. | Tracks physical custody and partial returns. |
| `resource_blocks` | Exactly one lab/equipment FK; valid interval and actor FK. | Prevents blocked resources from being booked. |
| `notifications` | User/optional booking FKs, category/read/time. | Created by workflow functions. |
| `audit_log` | Actor FK, action, entity, before/after JSON. | Mutation audit trail; not tamper-evident. |
| `rules` | Allow-listed key, JSON value, description. | Global rule values. |
| `department_rules` | Composite PK `(department_id, key)`. | Coordinator department overrides. |

## Constraints and indexes

- Required: positive lab capacity, positive booking-item/issue quantities, non-negative equipment stock, `start_at < end_at`, non-empty booking purpose, exact-one-resource blocks.
- Availability: `lab_no_overlap` GIST exclusion constraint uses `tstzrange(..., '[)')` for Pending Approval, Approved, Reserved and In Use bookings. Adjacent intervals are allowed.
- Integrity: foreign keys and unique keys prevent duplicate booking items and duplicate issue rows.
- Operational indexes include booking user/date, equipment booking-items, unreturned custody, user notifications, department/lab resource lookup, block ranges and audit time.

## Security model

All application tables are intended to have RLS enabled with `anon`/`authenticated` privileges revoked. The direct browser Data API is not the product access path. Privileged RPC execution is revoked from `PUBLIC`, `anon` and `authenticated`; only `service_role` receives it. Functions use a fixed `search_path` and `SECURITY INVOKER` behavior, with action/DAL checks supplying verified actor IDs.

## Verified behavior

- The audit reran the isolated schema suite: 45 PostgreSQL checks passed.
- Existing hosted evidence covers transactions, temporary data cleanup, competing lab and equipment reservations, real Auth/profile lookup and management provisioning.
- The public lifecycle evidence covers actual persisted booking, conflict alternative, approval, issue, return, notification and audit rows.

## Database risks and follow-up verification

| Item | Status | Detail |
| --- | --- | --- |
| Live schema drift detection | NEEDS REVIEW | No committed incremental migration history or automated schema-diff CI was found. The bootstrap cannot safely reconcile an existing live schema. |
| Backups / restore exercise | UNKNOWN | Not represented in repository evidence; verify in Supabase/Vercel operational procedures. |
| Production advisor scan | UNTESTED | No current Supabase advisor output is checked in. Run after future schema/RLS changes. |
| Data API exposure settings | NEEDS REVIEW | SQL revokes application-table access, but dashboard API schema exposure settings are not captured in version control. |
| Scale/performance | UNTESTED | DAL paginates bookings but most other reads are bounded only in application code. No production load profile exists. |

## Seed data

`scripts/seed.ts` creates four real Auth users/profiles, five labs, twenty equipment items, configured rules, sixty days of explicitly labeled demo history and an Arduino availability scenario. The script writes generated demo credentials only to ignored `.env.local`. Seed data must not be described as measured university usage.
