# Final Plan: University Lab & Equipment Booking System

## 1. Objective and authority

Build and submit a deployed web app where students and faculty request labs and equipment, staff approve requests and record issue/return, and users receive explainable alternatives when their requested resources are unavailable.

The demonstration must show a working request → approve → issue → return flow, database-enforced lab conflicts, correct equipment quantities and measured evidence.

This plan consolidates the previously finalized plan with the corrections identified during review. Keep the selected product, stack and team roles. Do not restart solution exploration.

**Working session:** 1 October 2026, 10:00 AM–4:00 PM, Asia/Karachi. **Feature freeze:** 3:15 PM. **Target submission:** by 3:50 PM. The older master prompt's 8:30–2:30 schedule, 1:00 freeze and “No auth” instruction are superseded for this plan.

**Organizer verification:** the original official brief was not supplied with these documents. The QA/deploy owner must verify the actual deadline, required features, accepted formats and video requirement before build work starts. Organizer rules override our working assumptions; a conflicting deadline requires compressing the schedule immediately.

## 2. Locked architecture

| Area | Decision |
|---|---|
| Application | Responsive web app deployed on Vercel |
| Frontend | Next.js 16 App Router, TypeScript, Tailwind, shadcn/ui |
| Charts | Recharts |
| Backend | Next.js server actions and a server-only Data Access Layer (DAL) |
| Database and authentication | Supabase Postgres and Auth through supabase-js and @supabase/ssr |
| Database access | RLS enabled; no client data policies; application data accessed through the server-only admin client after authorization |
| Session handling | Keep the starter's proxy.ts and session-refresh helper; verify installed-version behavior against current official documentation |
| Time | Explicit +05:00 input, timestamptz storage, Asia/Karachi display on server and client |
| Hosting regions | Choose a Vercel function region close to the Supabase project |
| Cost | Use free tiers; no paid dependency is required by this plan |

Data flow:

Browser → server action → validate input and authenticate → DAL authorization → database transaction → result, audit record and notification → refreshed UI.

The publishable key may be public. SUPABASE_SECRET_KEY remains server-only. Start the admin-client module with `import 'server-only'`; disable session persistence and keep it separate from the session client.

Authenticate with the session client. Use its verified user ID to read the profile through the admin client. Check role, ownership and any applicable department restriction before performing the requested operation. Never accept the actor's user ID or role from form data. Check protected pages, actions and DAL methods; layouts only render navigation and identity.

Use the normal Supabase password sign-in flow for four seeded demo accounts. Demo buttons are enabled only when DEMO_MODE=true, with credentials stored in server environment variables. Admin demo access is an intentional hackathon demonstration feature; disable it before real institutional use.

**Excluded:** Prisma/Drizzle, SQLite, FastAPI, Resend, Trigger.dev, Socket.io, Realtime, SSO, push notifications, mobile app and a separate AI service. The alternative engine uses deterministic scoring; an LLM is unnecessary.

## 3. Roles

| Capability | Student/Faculty | Lab Staff | Coordinator | Admin |
|---|---|---|---|---|
| Browse resources and availability | Yes | Yes | Yes | Yes |
| Request, cancel eligible own bookings, view own history | Yes | Yes | Yes | Yes |
| Approve/reject ordinary requests | No | Yes | Yes | Yes |
| Approve requests containing high-value equipment | No | No | Yes | Yes |
| Issue, return and record damage | No | Yes | No | Yes |
| Block resources and set maintenance | No | Yes | Yes | Yes |
| Set rules and priority, resolve conflicts | No | No | Yes | Yes |
| Manage users, departments, labs and categories | No | No | No | Yes |
| Analytics | No | No | Own department | All departments |

Hiding a menu is insufficient: enforce the same permissions on direct requests. Cancellation cannot release equipment that is already issued; staff must record its return.

## 4. Scope and acceptance criteria

| Feature | Done when |
|---|---|
| Authentication and permissions | All four demo roles sign in, survive reload, sign out and receive the correct permissions; student access to admin actions is denied |
| Resource management | Separate lab and equipment screens support authorized CRUD; maintenance, closure and temporary blocks affect booking eligibility |
| Search and availability | Filters cover lab, equipment, department, category, date, time, availability and booking status; a day view distinguishes free and occupied slots |
| Booking and conflicts | A request for a lab and/or equipment succeeds only when rules and quantities allow it; concurrent requests cannot reserve the same lab slot |
| Approval and lifecycle | Authorized staff approve/reject with a reason; high-value requests require Coordinator/Admin approval |
| Issue and return | Staff record actual issue/return times, quantities, condition and damage; repeated submissions do not duplicate these effects |
| Alternative engine | A conflicting request produces up to three explained alternatives, with unavailable or reduced-quantity options clearly identified |
| Dashboard | KPIs and usage insights render from seeded and live data; Coordinator analytics are department-scoped |
| Rules | Duration, per-user quantity, advance limit, high-value approval and late-return restrictions are enforced inside booking creation |
| Notifications and audit | Users see approval/rejection/cancellation notices and computed overdue/reminder indicators; state changes write audit records |

Core screens: login, dashboard, labs, equipment, booking form/detail/history, approvals, issue/return, rules and admin management. Use a simple availability list first. URL query parameters preserve filters. Every submission shows a clear success, conflict or validation message.

## 5. Data model

| Table | Main fields |
|---|---|
| departments | id, name |
| profiles | auth user id, name, role, department_id, late_count, restricted_until |
| labs | id, name, department_id, capacity, location, facilities, operational status |
| equipment | id, name, category, total_quantity, lab_id, condition, maintenance status, unit_value_high |
| bookings | id, user_id, nullable lab_id, start_at, end_at, purpose, attendees, booking_status, approval_status, approved_by, priority, decision reason |
| booking_items | booking_id, equipment_id, quantity |
| issue_returns | booking_id, equipment_id, quantity, issued_at, due_at, returned_at, return_condition, remarks, damage_note |
| resource_blocks | resource reference, start_at, end_at, reason, actor |
| notifications | user_id, message, read, created_at |
| audit_log | actor, action, entity, before/after, created_at |
| rules | key, value |

The small resource_blocks table makes the already-planned temporary blocks representable. It is not an additional product feature.

Use foreign keys, positive quantity checks, start_at < end_at and unique booking/equipment pairs. Consolidate repeated equipment IDs before checking stock. Require at least one resource. Preserve historical records: archive resources with booking history rather than deleting their usage records.

Define booking_status once as a Postgres enum: Draft, Pending Approval, Approved, Reserved, In Use, Completed, Rejected, Cancelled, Returned Late, Damaged. Overdue is computed, not stored as a competing lifecycle state. approval_status records the approval decision, not an independent resource allocation.

Persist operational lab states such as Maintenance and Closed. Derive Reserved/In Use for the displayed time window from bookings, rather than treating every future booking as a global resource closure.

Seed five labs, about twenty equipment entries, four real auth users and matching profiles, configurable rules and about sixty days of realistic booking history. Include the Embedded Systems Lab and Arduino kits. Create the demonstration's 20 total / 8 reserved / 5 issued / 7 available scenario with consistent dates and quantities. Treat seeded history as demonstration data, never measured university usage.

## 6. Database correctness

### Lab conflicts

Begin the schema migration with `create extension if not exists btree_gist;`.

Use an exclusion constraint on lab_id equality and overlapping `tstzrange(start_at, end_at, '[)')` for Pending Approval, Approved, Reserved and In Use bookings. Adjacent slots do not conflict; pending requests hold their slot. Equipment-only bookings have a null lab_id.

The constraint guarantees nonoverlapping scheduled lab reservations. Physical overrun is an operational exception: flag an overdue occupied lab and prevent a second live check-in until staff resolve it. Do not claim the constraint itself predicts overruns.

### Equipment quantities

One create_booking transaction must:

1. Validate the verified actor, booking rules, resource eligibility, capacity and temporary blocks.
2. Lock requested equipment rows in ascending ID order.
3. Calculate the maximum simultaneous reserved quantity across the requested interval, using half-open intervals.
4. Reject quantities exceeding the minimum remaining capacity during that interval, or return an explicit reduced-quantity proposal.
5. Create the booking and items together, with the audit record.

Example: ten kits and consecutive reservations of six kits each leave four available throughout. Do not sum both reservations as if twelve kits were occupied simultaneously.

Every operation that changes allocations or usable stock must follow the same locking and validation rules. This includes booking edits/reactivation, issue/return, stock reductions and resource blocks. Serialize resource eligibility changes with creation so a maintenance/block change cannot race a booking into acceptance.

Distinguish scheduled reservations from physical custody. Overdue unreturned equipment remains unavailable for immediate booking/issue. Flag affected future bookings for staff; planned future availability assumes timely return and is rechecked at issue. Do not double-count an active booking and its own issued equipment.

Maintain the planned equipment-row maintenance model: a damaged return can place that equipment entry in maintenance. Per-unit asset tracking is outside this MVP.

Map exclusion violation 23P01 to a clean slot-conflict message. Retry a failed transaction once on deadlock 40P01, then return a clear retry message. Ordered equipment locks reduce deadlock risk; they do not prove every transaction in the application is deadlock-free.

Restrict create_booking execution: revoke from public, anon and authenticated; grant to service_role. Call it using the server-only admin client with the verified actor ID. Apply equivalent restrictions to other privileged mutation functions.

## 7. Lifecycle and repeat safety

- Optional Draft → Pending Approval on submission. Drafts do not hold inventory.
- Approval checks permissions and atomically records the approved decision and moves the booking to Reserved. Approved need not be a separate user action.
- Pending requests may become Rejected or Cancelled. Reserved bookings may become Cancelled before issue, or In Use on issue.
- In Use → Completed, Returned Late or Damaged only after the relevant equipment has actually been returned and the booking is closed.
- Overdue means due_at < now() and returned_at is null. Show it as a computed indicator while the booking remains In Use.
- A return that is both late and damaged retains both facts: terminal status may be Damaged, while lateness is recorded separately.
- Update records, audit and persisted notifications in the same transaction where applicable. Check the current state under lock; repeated issue/return requests must have no duplicate effects. Increment late_count at most once per late booking.
- Prevent users from granting themselves faculty/research priority. Calculate it from trusted profile/request classification and authorized Coordinator/Admin changes.

## 8. Alternative engine

Candidates remain: the same lab shifted ±4 hours in thirty-minute steps, other eligible labs at the requested time and the same time on the next three days. Keep the requested duration.

Use the same eligibility and availability calculations as booking creation. Check lab conflicts, resource blocks, maintenance, capacity, equipment quantities, permitted dates and booking rules. Recheck transactionally when a user submits the selected alternative.

Keep the scoring formula and one configuration file:

`Score = 100 × (0.30 × CapacityFit + 0.20 × DeptMatch + 0.30 × EquipAvail + 0.20 × (1 − ΔTime))`

- CapacityFit: if attendees/capacity exceeds one, drop the lab; if the ratio is at least 0.3, use one; otherwise use 0.4 + 0.6 × (ratio/0.3).
- DeptMatch: one for the requested user's department, otherwise zero.
- EquipAvail: mean fulfilled fraction across requested equipment quantities, capped at one per item. For a lab-only request, use one.
- ΔTime: absolute hours shifted divided by four, capped at one.

Show up to three full-request alternatives first, with four contribution bars. If fewer are available, show clearly labeled reduced-quantity proposals; require explicit acceptance of the changed quantity. Unavailable options cannot be selected. If none work, show a clear empty state rather than inventing suggestions.

The score describes suitability under our weights, not a probability of successful booking. Display the actual calculated score; “Why 95?” is an example, not a promised result.

## 9. Dashboard, notifications and audit

KPIs: total, approved, pending and cancelled bookings, equipment issued and overdue equipment. Insights: most-booked labs, most-used equipment, utilization and damage reports. Planned charts: department usage, peak hours, monthly bookings, underused labs and rejection reasons.

Use a defined reporting window. Document the denominator used for utilization, excluding blocked/closed periods where relevant. Keep approved KPIs based on approval decisions so Reserved bookings are counted correctly. Separate current inventory totals from availability for a selected future window.

Persist notifications on approval, rejection and cancellation. Compute approaching and overdue indicators when the user loads or refreshes the page; no background delivery is promised. If persisting an overdue notice, deduplicate it by user and issue record.

Audit important mutations. Provide resource activity history. Do not call the audit log tamper-evident: the privileged server can edit it.

## 10. Schedule and gates

| Time, Asia/Karachi | Driver work | Gate |
|---|---|---|
| Before 10:00 | Verify official requirements, accounts, runtime, hotspot and empty repo | Pre-flight ready |
| 10:00–10:40 | Starter, Supabase project, environment variables, GitHub and Vercel | G1: live URL loads |
| 10:40–11:20 | Schema, constraints, transactional booking, seed data, auth and DAL | G2: all four roles work; student denied admin access |
| 11:20–1:15 | Resource screens, availability, booking, approvals, issue/return and core checks | G3: full core flow works live |
| 1:15–1:55 | Alternative engine, shared eligibility checks and contribution bars | Three tested conflict scenarios |
| 1:55–2:35 | Dashboard, rule management, notifications and audit views | Required-feature pass |
| 2:35–3:15 | Correctness buffer first; optional items only if core and required features pass | G4: freeze at 3:15 |
| 3:15–3:50 | Final regression, README, explanation PDF, video export, links and submission | G5: submitted |
| 3:50–4:00 | Submission/upload buffer | No planned feature work |

Rules must be enforced during G2/G3; the later rules task adds management UI and verification, not the first enforcement. Run correctness checks as features land, rather than postponing all tests to the submission window.

This is an aggressive budget, not a guarantee of completion. If G3 misses 1:15, cancel optional work. Spend its window on the required flow and evidence. Freeze means no new features; critical fixes may continue.

## 11. Team responsibilities

| Owner | Responsibility and handoff |
|---|---|
| Driver | Sequential implementation on the shared laptop, migrations, integration, commits and deploys; update tasks after each gate |
| Data owner | Prepare seed data on a separate device; driver owns schema changes; include stock and overdue edge cases |
| Docs owner | Start submission skeleton at G1, add architecture/screenshots from G3, maintain the claims log and assemble the PDF |
| QA/deploy | Confirm organizer rules at pre-flight, test each live gate on a phone, record short clips and own the final submission checklist |

No new team roles are required. The non-driver owners work in parallel without competing for the main keyboard. Handoffs use short shared documents and ready-to-use data, not lengthy meetings.

## 12. Optional features and cut order

Scoring bars are required and already included in the alternative engine. Remaining optional order:

1. QR link to the authorized issue/return page, estimated thirty minutes. Use the phone camera, not a scanner library.
2. Token-protected wall display showing only lab name, status and next booking time, estimated twenty minutes.
3. CSS-grid lab timeline, estimated forty-five minutes, only if G3 finishes by 12:45 and time remains. Use polling and the normal authorization rules.
4. Utilization heatmap, estimated thirty minutes, only if time remains.

The normal optional window is forty minutes. QR plus wall display do not both fit their estimates; choose the next item only if enough time remains. A teammate with an additional development device may prepare an isolated optional branch after G3, but merge only after verification.

Cut optional work first, then reduce extra charts and audit-screen polish. Keep booking rules, audit writes, permissions, conflicts, approvals, issue/return and alternatives. The earlier cut order included notifications; only omit a feature described as required after checking the official brief, and disclose any unmet requirement.

Out of scope: email/push, SSO, mobile app, calendar sync, ID scanning, waitlists, demand forecasting, damage-image upload, drag-and-drop scheduling and an evidence-export button.

## 13. Verification and proof

| Test | Expected result |
|---|---|
| Lab concurrency | Ten valid simultaneous requests for an empty dedicated slot: one success, nine clean conflict rejections |
| Equipment concurrency | Concurrent accepted reservations never exceed stock at any instant |
| Consecutive reservations | Ten kits, six reserved in each of two adjacent slots: a four-kit request covering both succeeds |
| Quantity shortage | Ten requested with seven available: explicit seven-kit proposal; no silent quantity change |
| Overdue custody | Unreturned equipment cannot be issued twice or treated as physically free |
| Duplicate actions | Repeated issue/return requests cause no duplicate quantities or late penalties |
| Permissions | Student denied admin mutations; staff denied high-value approval; Coordinator analytics remain department-scoped |
| Resource eligibility | Blocked/maintenance resources rejected in both recommendations and final submission |
| Time and adjacency | Karachi times match on server/browser; adjacent valid lab slots succeed |
| Alternatives | Three conflict scenarios with selected alternative, score and contribution breakdown |

Save results under docs/evidence. The lab concurrency script uses a dedicated test resource/slot and cleans up its own data. Record failures and limitations as well as successes.

Expected results above are acceptance criteria, not measured results. Publish numbers only after running the tests. Keep a claims log: claim, status (Verified / Unverified / Our result), source or test, and owner. Verify framework/API details against current official docs during implementation. Do not make unverified competitor, performance or Top 5 predictions.

## 14. Submission and fallbacks

Planned package, subject to official verification:

- GitHub repository and working live URL.
- README with setup, environment variable names, demo instructions and limitations; never include production secrets.
- Explanation PDF with folder map, architecture/data flow, schema diagram, exclusion constraint, equipment lock/calculation explanation and measured evidence.
- Approximately three-minute demo video if required: problem → booking → conflict/alternatives → approval → issue/return → dashboard → proof. Record clips as gates pass; rough-cut in parallel.

Demo scenario: student requests Embedded Systems Lab and five Arduino kits; a seeded conflicting slot exposes alternatives; the student selects one; authorized staff approve, issue and return it; the dashboard updates.

| Risk | Fallback |
|---|---|
| Network failure | Hotspot and recorded demonstration |
| Setup/auth trouble | Official Supabase starter and a focused current-doc check; do not replace required auth with fake roles |
| Core runs late | Cancel optional work and reduce presentation polish |
| Visual timeline stalls | Keep the plain day availability list |
| Tool setup consumes time | Stop after five minutes and use the existing workflow |
| A technical blocker exceeds fifteen minutes | Name it, attempt one focused diagnosis and use the predefined simpler path; never weaken booking/security guarantees to appear finished |
| Live demo fails | Use recorded evidence and report the live limitation honestly |

Before submission, open the deployed app, repository and PDF as a new viewer. Check login, permissions, broken links, secrets, formats and every official required field. The docs owner removes unsupported claims; QA/deploy confirms upload completion.

## 15. Implementation handoff

Suggested structure:

```text
app/                 auth, dashboard, labs, equipment, bookings, approvals, issue, admin
components/          UI, charts, score bars, optional QR/timeline
lib/                 session/admin clients, DAL, recommendation config, validation
actions/             server actions by domain
supabase/            migrations and seed.sql
scripts/             concurrency and targeted correctness checks
docs/                plan, decisions, tasks, claims and evidence
proxy.ts             starter session refresh
```

Implement one gate at a time. Keep main working, use branches, deploy at gates and apply focused CodeRabbit review when available. Use Context7 or official documentation for version-sensitive code; skip unavailable tools without changing the architecture.

A task is complete only when its files exist, its user flow works, relevant checks pass and the task record is updated. Deliver complete working files, preserve required authentication, and test the critical path before reporting success.

**Next action:** pre-flight verification, then G1. This document is a planning deliverable; implementation has not started.
