# Feature Inventory

Status is based on source inspection and the evidence cited below, not visual existence alone.

| Feature | Status | Implementation | Database | Backend/API | Frontend | Tested | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Email/password sign-in | COMPLETE | `login-form.tsx` | Supabase Auth + `profiles` | `signInAction` | `/login` | Hosted four-role Auth check 2026-10-01 | Invalid credential error is intentionally generic. |
| Demo-role access | COMPLETE | Login role buttons | Server-side demo credentials | `demoSignInAction` | `/login` | Production evidence | Enabled only with `DEMO_MODE`. |
| Public signup | MISSING | — | Auth supports it but local config disables signup | — | — | N/A | Intentional account-provisioning model. |
| Email verification / reset | MISSING | — | No recovery implementation | — | — | N/A | Requires product/security decision before addition. |
| Session refresh / logout | COMPLETE | `proxy.ts`, shell/profile forms | Supabase cookies | `signOutAction` | Protected layout | Hosted Auth check; production login checks | Session persistence after a long idle period remains untested. |
| Role authorization | COMPLETE | DAL + actions + SQL functions | Active profile / roles | `assertCan`, RPC authorization | Role-aware navigation | Unit, SQL, live production denial evidence | UI hiding is not relied on. |
| Labs and equipment browsing | COMPLETE | Student screens / browse workspace | `labs`, `equipment`, categories | `getAppData` | Desktop timeline + mobile cards | Fixture/live render checks | Search/filter coverage is UI-driven, not a dedicated query API. |
| Availability preview | COMPLETE | Booking and browse views | bookings, blocks, inventory custody | `validate_request` / `create_booking` | Calendar/time-slot UI | Unit + SQL checks | Server result remains definitive. |
| Lab/equipment booking | COMPLETE | `BookingFlow` | bookings/items | `createBookingAction` → `create_booking` | `/book` | Public lifecycle evidence | No booking edit/reschedule flow. |
| Conflict alternatives | COMPLETE | `alternatives.ts`, booking UI | Uses live availability | Server revalidates choice | Scored alternative cards | Unit, fixture and public lifecycle evidence | Alternatives are capped and deterministic by plan. |
| Booking history/cancellation | COMPLETE | Booking list/detail | bookings | `cancel_booking` | `/bookings` | SQL/lifecycle coverage | Cancellation follows lifecycle restrictions. |
| Approve/reject | COMPLETE | Operational screens | bookings, notifications, audit | `decide_booking` | `/approvals` | SQL/public lifecycle | Rejection reason enforced in action. |
| High-value approval | COMPLETE | Approval detail | equipment flag + bookings | SQL authorization | Distinct badge/routing | Unit/SQL evidence | Lab Staff denied by database. |
| Issue/return/damage | COMPLETE | `IssueReturn` | issue_returns, equipment | issue/return RPC | `/issue-return` | SQL/public lifecycle | Per-unit serial tracking is out of scope. |
| Blocks / maintenance | COMPLETE | Blocks and maintenance control | resource_blocks, resource status | block/manage RPC | `/blocks` | SQL + fixture/live rendering | Existing conflicts must be resolved before block. |
| Notifications / audit | COMPLETE | Notification/audit screens | notifications, audit_log | Transactional workflow writes | `/notifications`, admin audit | Lifecycle evidence | No email/push/background delivery. |
| Rules / department overrides | COMPLETE | Rules screen | rules, department_rules | `manage_rule` | `/rules` | SQL and unit checks | Rule set is deliberately allow-listed. |
| Admin management | COMPLETE | Admin screen forms | profiles/departments/labs/equipment/categories | Auth admin + management RPC | `/admin/*` | Hosted management + production render | No user deletion UI. |
| Analytics | COMPLETE | Recharts reports | bookings/issues/blocks | Scoped DAL/calculation | `/reports` | Unit + render checks | Historical reporting window is documented in analytics code. |
| Loading/error/empty states | COMPLETE | App and screen boundaries | — | — | `loading.tsx`, `error.tsx`, `Empty` | Fixture checks | Mutation-specific network interruption tests are missing. |
| Accessibility baseline | PARTIAL | Semantic inputs, labels, skip link, focus dialog | — | — | Responsive UI | Dialog and overflow checks | Full screen-reader and automated accessibility audit not run. |
