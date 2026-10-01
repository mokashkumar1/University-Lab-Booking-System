# Lab Booking Implementation Checklist

**Status:** Planning only. Implementation has not started. All boxes are initially unchecked.

**Goal:** Deliver the finalized lab/equipment booking MVP, verify its core flow and submit its evidence package.

**Source:** [Finalized plan](../../../final-plan.md). This checklist implements that plan; it does not change its MVP, architecture, stack or team roles.

**Architecture:** Browser → Next.js server actions → validation/authentication and server-only DAL → Supabase database transactions → UI refresh. Server authorization remains mandatory for every protected operation.

**Tech stack:** Next.js 16 App Router, TypeScript, Tailwind, shadcn/ui, Recharts, Supabase Postgres/Auth, supabase-js, @supabase/ssr and Vercel.

**Times:** 1 October 2026, Asia/Karachi. Working session 10:00 AM–4:00 PM; feature freeze 3:15 PM; submission target 3:50 PM. Verify the official deadline in Step 01.

## Global constraints

- Preserve the agreed product, stack, architecture and four team roles. Report a critical blocker before proposing a change.
- Driver implements one task at a time on the shared laptop. Data, docs and QA work proceed in parallel under their existing owners.
- Never expose the secret key, trust form-supplied actor IDs/roles or substitute fake roles for authentication.
- Enforce rules from the first booking implementation; the later rules task adds management UI.
- Use explicit +05:00 timestamps and Asia/Karachi display consistently.
- Protect allocations and lifecycle transitions transactionally; apply the same availability rules to recommendations.
- Review current official framework/API documentation when implementing version-sensitive behavior.
- Acceptance outcomes below are expected results, not claims that tests have already passed.
- After each gate: deploy, run its acceptance checks on the live URL, record evidence and update task status. Review working changes with CodeRabbit if available; limit tool setup to five minutes.

## File responsibility map

These are planned areas, not files created by this checklist.

| Area | Responsibility |
|---|---|
| app/ | Login, protected pages, resource screens, booking flow, approvals, issue/return and admin |
| components/ | Shared UI, score bars, charts and any optional display components |
| lib/supabase/ and proxy.ts | Separate session/admin clients and starter session refresh |
| lib/ DAL, validation and recommendation modules | Authorization, input validation, shared eligibility and scoring configuration |
| actions/ | Validated server actions per domain |
| supabase/ | Versioned schema/mutations and reproducible seed data |
| scripts/ | Concurrency and targeted correctness checks |
| docs/ | Task status, decisions, claims, submission material and saved test evidence |

## Order and dependency map

| Step | Deliverable | Must follow | Owner |
|---|---|---|---|
| 01 | Pre-flight and official requirements | None | QA/deploy, Driver |
| 02 | Live starter and environment | 01 | Driver |
| 03 | Schema and database protections | 02 | Driver |
| 04 | Seeded resources and four real accounts | 03 | Data owner prepares; Driver integrates |
| 05 | Session handling, DAL and role enforcement | 03, 04 | Driver |
| 06 | Transactional booking and rules | 03, 05; seed fixtures from 04 | Driver |
| 07 | Resource and admin management | 05, 06 | Driver |
| 08 | Search and day availability | 06, 07 | Driver |
| 09 | Booking form, history and cancellation | 05, 06, 08 | Driver |
| 10 | Approval workflow | 09 | Driver |
| 11 | Issue/return and physical availability | 10 | Driver |
| 12 | Core gate and correctness proof | 07–11 | Driver, QA/deploy |
| 13 | Explained alternatives | 06, 08, 09; after core gate | Driver |
| 14 | Dashboard and scoped analytics | 04, 05, 10, 11 | Driver |
| 15 | Rules management UI | 05, 06 | Driver |
| 16 | Notifications and audit views | Mutation writes from 06, 07, 09–11; 05 | Driver |
| 17 | Required-feature verification | 12–16 | Driver, QA/deploy |
| 18 | Optional features if time remains | 17 passes; G3 timing gates also met | Driver |
| 19 | Feature-freeze readiness | 17; verify any included optional work | Driver, QA/deploy |
| 20 | Final package and submission | 19; parallel docs/recordings prepared | Docs owner, QA/deploy, Driver |

The dependency map identifies prerequisites. Driver follows the numbered order; it does not authorize extra parallel coding.

## Review focus

- Consecutive equipment reservations must use peak simultaneous demand, not a sum over the entire window: Steps 06/12.
- Overdue physical custody must block a second issue and flag affected reservations: Steps 11/12.
- Direct requests, ownership and high-value approval must enforce the permissions table: Steps 05/09/10/14.
- Repeated or competing mutations must not duplicate stock movements, late penalties or audit effects: Steps 10/11/12.
- Block changes, adjacent slots and Karachi timestamps must behave consistently in booking and alternatives: Steps 06/08/12/13.

## First: pre-flight, before 10:00 AM

### 01. Verify requirements and readiness

- [ ] QA/deploy records the organizer's deadline, required features, accepted submission formats and whether a video is required.
- [ ] Compare the official deadline with the working schedule. If it conflicts, report the blocker and compress the schedule before coding.
- [ ] Driver confirms GitHub, Supabase and Vercel access, runtime readiness, an empty repository and a charged hotspot.
- [ ] Confirm the four existing owners: Driver, Data owner, Docs owner and QA/deploy.
- [ ] Create a short task-status record and claims log; retain the finalized plan as the specification.

**Acceptance:** Requirements and access are recorded; the driver can begin without an unresolved deadline, credential or submission-format blocker.

**Cannot cut:** Official deadline/requirements verification and required account access.

## G1: live starter, 10:00–10:40 AM

### 02. Deploy the starter

- [ ] Create the official Supabase starter and confirm Next.js 16.
- [ ] Create/connect the Supabase project and separate public/server environment values.
- [ ] Keep the starter's session-refresh files; select the planned hosting region.
- [ ] Connect GitHub/Vercel and deploy the initial page.
- [ ] Docs owner starts the README/PDF skeleton; QA/deploy records the working URL.

**Acceptance:** The deployed URL opens on laptop and phone. Server credentials are absent from browser-delivered code and repository content. G1 is recorded as passed.

**Cannot cut:** A working deployed path. **Can cut:** Initial styling beyond a readable page.

## G2: database and auth, 10:40–11:20 AM

### 03. Establish schema and protections

- [ ] Create the planned enums/tables, including temporary resource blocks, rules, audit and notifications.
- [ ] Add the btree_gist extension and active-booking lab exclusion constraint.
- [ ] Add foreign keys, valid interval/quantity checks and unique booking/equipment pairs.
- [ ] Enable RLS and retain the agreed server-only application-data access model.
- [ ] Establish allowed lifecycle transitions and restrictions on privileged mutation functions.

**Acceptance:** Schema applies to the target database. Invalid intervals/quantities fail. Overlapping active lab reservations fail; adjacent intervals succeed. Client roles cannot execute privileged booking mutations or read application tables directly.

### 04. Integrate reproducible seed data

- [ ] Data owner prepares five labs, about twenty equipment entries, configurable rules and about sixty days of demonstration history.
- [ ] Create four real auth users and matching profiles; configure server-side demo credentials.
- [ ] Include Embedded Systems Lab, Arduino kits and the consistent 20 total / 8 reserved / 5 issued / 7 available fixture.
- [ ] Include separate test slots and fixtures for consecutive reservations, overdue custody, damage, restrictions and department analytics.

**Acceptance:** Seed data loads without invalid references or conflicting active reservations. The four accounts match their assigned roles; demonstration and test dates remain usable on the event date.

### 05. Implement authentication and authorization

- [ ] Set up separate session/admin clients; verify identity with the session client and read the corresponding profile through the admin client.
- [ ] Protect pages, server actions and DAL access with the finalized role/ownership rules.
- [ ] Add normal sign-in/sign-out and DEMO_MODE-gated demo buttons.
- [ ] Verify session refresh and protected-route redirects.

**Acceptance:** Each role can log in and remain logged in after reload. Sign-out removes access. Students are denied admin pages and direct admin actions. Forged actor IDs/roles do not change authorization. Turning DEMO_MODE off removes demo access.

### 06. Build booking transactions and shared eligibility

- [ ] Validate requested resources, attendees, intervals and positive quantities; consolidate duplicate equipment IDs.
- [ ] Enforce duration, per-user quantity, fourteen-day advance limit and late-return restrictions from rules.
- [ ] Check maintenance, closure, temporary blocks, capacity and scheduled lab availability.
- [ ] Lock equipment rows in ascending order and calculate peak simultaneous reservations throughout the interval.
- [ ] Create booking/items/audit atomically; return an explicit reduced-quantity proposal instead of silently changing a request.
- [ ] Restrict function execution to service_role and use the verified actor ID.
- [ ] Add clean slot-conflict handling and one bounded deadlock retry.
- [ ] Apply equivalent allocation checks/locking to operations that change reservations or usable stock.

**Acceptance:** Valid lab-only, equipment-only and combined requests succeed. Invalid rules/resources fail with clear messages and no partial rows. Two consecutive six-kit reservations against ten kits leave four available across both. A ten-kit request with seven available offers seven without creating a different booking automatically.

**G2 gate:** Four-role login and access-denial checks pass; schema and booking protections are ready for the core screens.

**Cannot cut:** Auth, authorization, constraints, transactional quantity checks, initial rule enforcement, seed/demo accounts and audit writes.

## G3: core flow, 11:20 AM–1:15 PM

### 07. Resource and admin management

- [ ] Implement separate labs/equipment screens with planned fields and authorized CRUD.
- [ ] Implement authorized user, department and category management.
- [ ] Add maintenance, closure and temporary blocks; derive Reserved/In Use displays for the selected time.
- [ ] Preserve historical references when removing a resource from use; audit management changes.

**Acceptance:** Authorized roles manage permitted resources. Students cannot mutate them. Maintenance/closure/blocks stop affected booking requests. Archived resources preserve booking history. Eligibility changes cannot race booking creation into an invalid acceptance.

### 08. Search and day availability

- [ ] Add lab, equipment, department, category, date, time, availability and booking-status filters using URL parameters.
- [ ] Display a simple day-slot list and equipment quantities using the shared eligibility calculations.
- [ ] Render Karachi times consistently on server and browser.

**Acceptance:** Each filter changes the matching results and survives a page reload. Booked slots are visibly unavailable. Adjacent intervals remain selectable; scheduled future reservations do not globally close the resource.

### 09. Booking request, history and cancellation

- [ ] Connect the form to the authorized booking transaction; show validation, conflict and quantity messages.
- [ ] Require explicit acceptance of reduced quantities and recheck availability at submission.
- [ ] Add own booking details/history and eligible cancellation.
- [ ] Prevent cancellation from releasing issued equipment; record audit/notification effects.

**Acceptance:** A student requests Embedded Systems Lab and five Arduino kits. Pending requests hold the slot. A competing request receives a clean conflict. Another user's history cannot be accessed. Cancelling an unissued booking releases its allocation; cancelling an issued booking cannot bypass return.

### 10. Approval workflow

- [ ] Build the priority-sorted approval queue from trusted profile/classification data.
- [ ] Add approve/reject with reason and the finalized permission matrix.
- [ ] Route high-value requests to Coordinator/Admin; atomically record approval and Reserved status.
- [ ] Write audit/notification effects and protect against repeated/competing decisions.

**Acceptance:** Ordinary approvals work for permitted roles; staff cannot approve high-value requests. Rejection releases allocations. Repeated approve clicks do not duplicate effects; competing approve/reject requests yield one valid final decision. A user cannot assign themselves priority.

### 11. Issue/return and custody

- [ ] Record quantities, issued_at, due_at, returned_at, condition and damage notes.
- [ ] Recheck physical availability at issue, including overdue equipment and occupied lab overruns.
- [ ] Close bookings only after required returns; preserve late and damage facts together.
- [ ] Apply maintenance after damaged returns and count a late booking once.
- [ ] Make repeated issue/return submissions safe; audit the transaction.

**Acceptance:** Reserved → In Use → Completed works. A late return increments late_count once, including repeated clicks. A damaged late return retains both facts. Unreturned equipment cannot be issued twice; affected future bookings are flagged. An occupied overdue lab cannot accept a second live check-in.

### 12. Prove the core on the live deployment

- [ ] Run request → approve → issue → return using the seeded roles on the live URL.
- [ ] Run ten valid simultaneous requests for an empty dedicated lab slot; expect one success and nine clean rejections.
- [ ] Run equipment concurrency checks; accepted allocations must never exceed stock at any instant.
- [ ] Check consecutive equipment slots, adjacent lab slots, invalid rules, forged permissions, overdue custody and duplicate mutations.
- [ ] Save actual outputs under docs/evidence; clean up only the dedicated test data.
- [ ] QA/deploy records core clips; Docs owner adds architecture/schema evidence to the PDF draft.

**G3 gate:** The complete core flow works live, critical correctness checks pass and evidence is saved. If G3 is not passed by 1:15 PM, cancel optional work and use its later window to recover required work.

**Cannot cut:** Resource management, working availability, request/history/cancellation, approvals, issue/return, permissions, rule enforcement, audit writes or conflict/quantity guarantees. **Can cut:** Visual polish and optional timeline UI; retain the list.

## Alternatives, 1:15–1:55 PM

### 13. Explainable alternative engine

- [ ] Generate the finalized candidates: ±4 hours in thirty-minute steps, other labs at the same time and the same time on the next three days.
- [ ] Reuse booking eligibility for conflicts, blocks, maintenance, capacity, equipment quantities and rules.
- [ ] Keep the finalized scoring weights/terms in one configuration file.
- [ ] Display up to three full-request options first with four contribution bars; label reduced quantities explicitly.
- [ ] Disable unavailable options, support an empty state and revalidate the chosen request transactionally.
- [ ] Save three conflict scenarios with selected alternative, actual score and term breakdown.

**Acceptance:** All three scenarios produce correctly explained results. Forbidden slots are not selectable. Score contributions match the formula. Reduced quantities require consent. A candidate becoming occupied before submission produces a clean conflict rather than bypassing checks.

**Cannot cut:** Alternative engine, eligibility checks and contribution bars. **Can cut:** Extra animations or presentation polish.

## Dashboard and supporting views, 1:55–2:35 PM

### 14. Dashboard and analytics

- [ ] Add total/approved/pending/cancelled booking KPIs and issued/overdue equipment counts.
- [ ] Add most-booked labs, most-used equipment, utilization and damage insights.
- [ ] Implement the planned department, peak-hour, monthly, underused-lab and rejection-reason charts.
- [ ] Define the reporting window/utilization denominator and distinguish current stock from future-window availability.
- [ ] Enforce own-department Coordinator analytics and all-department Admin analytics server-side.

**Acceptance:** Known seeded fixtures produce the expected counts; a completed live flow updates them. Approved counts include approved Reserved bookings. Empty datasets render clearly. Coordinator requests cannot retrieve another department's analytics.

### 15. Rules management UI

- [ ] Expose the existing rule settings to Coordinator/Admin and protect updates server-side.
- [ ] Verify edited limits affect the next booking transaction.
- [ ] Verify staff/student attempts to change rules are rejected; audit changes.

**Acceptance:** Changing a configured duration/quantity/advance limit changes acceptance immediately. Late restrictions and high-value routing remain enforced. No UI-only rule can be bypassed by calling an action directly.

### 16. Notifications and audit views

- [ ] Display persisted approval/rejection/cancellation messages with read/unread state.
- [ ] Show computed approaching/overdue indicators on load/refresh; deduplicate any persisted overdue notices.
- [ ] Add authorized audit/resource activity views over the writes already implemented in earlier steps.

**Acceptance:** The intended user sees each decision notice; another user cannot read it. Refresh updates due-state indicators without duplicate notices. A traced booking has the expected actor/action history.

**Cut options:** Reduce extra charts and audit-screen polish after optional work is removed. Do not remove a chart/notification capability required by the verified organizer brief. Keep underlying audit writes, reporting accuracy and authorization.

## Correctness buffer and optional work, 2:35–3:15 PM

### 17. Verify all required features

- [ ] QA/deploy maps every verified organizer requirement to a working screen and acceptance result.
- [ ] Resolve core failures first, then recommendation/reporting/supporting-feature failures.
- [ ] Run the finalized demo scenario against the deployed app and check evidence completeness.
- [ ] Confirm the Docs owner has enough material for final export and QA has usable recordings.

**Acceptance:** Required-feature checks pass on the deployment; critical defects are resolved; evidence distinguishes expected outcomes from measured results.

### 18. Optional features, only if Step 17 passes

- [ ] Confirm G3 passed by 1:15 PM; otherwise skip this step entirely.
- [ ] Consider QR first (thirty-minute estimate); staff authorization must still protect issue/return.
- [ ] Consider the token-protected wall display next (twenty-minute estimate); expose only lab/status/next-time data.
- [ ] Consider the CSS-grid timeline only if G3 passed by 12:45 and enough time remains (forty-five-minute estimate).
- [ ] Consider the utilization heatmap last (thirty-minute estimate).
- [ ] Verify and deploy only completed optional features before freeze; exclude unfinished optional changes.

**Acceptance if included:** QR does not bypass permissions. Display requires its token and leaks no user/purpose data. Timeline agrees with authoritative availability. Heatmap agrees with its reporting data.

**Can cut:** All of Step 18. The normal forty-minute window cannot fit both QR and wall display at their estimates. Correctness recovery takes priority over every optional item.

## G4: what must work before 3:15 PM

### 19. Feature-freeze checklist

- [ ] Live deployed app opens on phone and laptop; real authentication and four-role permissions pass.
- [ ] Planned resource/admin management, maintenance and temporary blocks work.
- [ ] Search/day availability and Karachi-time rendering work.
- [ ] Lab-only, equipment-only and combined requests enforce rules, conflicts and quantities.
- [ ] Own history and eligible cancellation work without releasing issued stock.
- [ ] Authorized approval/rejection, high-value routing and lifecycle transitions work.
- [ ] Issue/return, overdue custody, damage/late recording and repeat safety work.
- [ ] Alternatives and explanation bars work, including explicit reduced-quantity acceptance.
- [ ] Dashboard, required charts, scoped analytics and rules management work.
- [ ] Notifications, computed reminders, audit writes and required activity views work.
- [ ] Lab/equipment concurrency, quantity shortage, adjacency, consecutive reservations, permissions and duplicate-action checks pass; actual proof is saved.
- [ ] Three alternative scenarios are recorded with scores and contributions.
- [ ] All organizer-required features are mapped to evidence; any unmet requirement is explicitly recorded rather than silently relabeled optional.
- [ ] Included optional work is verified; unfinished optional work is excluded.
- [ ] Submission draft, screenshots and raw clips are ready for final assembly.
- [ ] Record G4 and freeze new feature work at 3:15 PM.

**Freeze rule:** Only critical fixes, focused regression, documentation/export and submission remain afterward. Required work still failing at freeze is a blocker to report, not permission to expand the feature window or claim completion.

## G5: finalize and submit, 3:15–3:50 PM

### 20. Complete submission

- [ ] Driver fixes only critical defects and reruns checks affected by those fixes.
- [ ] Docs owner finalizes README setup/demo instructions and honest limitations.
- [ ] Export the explanation PDF with folder map, architecture/schema diagrams, booking guarantees and measured proof.
- [ ] Finalize the roughly three-minute video if required; re-record only changed screens.
- [ ] Audit the claims log and remove unsupported facts, comparisons and performance claims.
- [ ] QA/deploy opens the app, repository and exported documents as a new viewer; checks permissions, links, formats and secrets.
- [ ] Submit every official required item by the target time and record submission confirmation.

**Acceptance:** Required uploads/links are accessible to judges, submission is confirmed and reported outcomes match saved evidence. The 3:50–4:00 window is reserved for upload/submission problems, not feature work.

## Parallel work throughout the sequence

| Owner | Start | Ongoing work | Handoff |
|---|---|---|---|
| Data owner | Pre-flight/G1 | Seed data, stock/date edge cases and expected fixture counts | Ready-to-integrate data after schema agreement; Driver applies schema changes |
| Docs owner | G1 | README/PDF skeleton, claims log, diagrams, screenshots and proof | Draft ready before freeze; final export during G5 |
| QA/deploy | Pre-flight | Official requirements, live gate checks, phone testing and short recordings | Acceptance results after each gate; submission checklist/confirmation during G5 |
| Driver | G1 | Numbered implementation tasks, integration, verification and deployment | Working gate and task-status update; next task only after prerequisites pass |

## If we fall behind

1. Remove all unstarted optional work: heatmap/timeline/display/QR; preserve the required score bars.
2. Reduce extra chart and audit-screen polish within the finalized plan and verified official requirements.
3. Keep simple resource/day-slot screens; reduce visual polish and demo re-recording.
4. Protect permissions, transactional bookings, rules, approvals, issue/return, overdue correctness, alternatives, audit writes and required submission evidence.
5. Do not silently cut anything required by the official brief. Record the missed requirement and notify the team if it cannot be recovered.

At G3's 1:15 checkpoint, cancel optional work if the core is incomplete. At 2:35, optional work requires all required checks to pass. At 3:15, stop features. For a blocker exceeding fifteen minutes: name it, attempt one focused diagnosis and use the already-planned simpler fallback without weakening guarantees.

**Next action when implementation is authorized:** complete Step 01, then Step 02. Creating this checklist does not authorize or start application implementation.
