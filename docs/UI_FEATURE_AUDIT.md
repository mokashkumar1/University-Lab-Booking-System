# UI Feature Audit

## Shared system

`AppShell` provides desktop sidebar/navigation, mobile Home/Browse/Bookings/Profile navigation, notification access, a keyboard-focusable global search, staff mobile menu and a skip link. `globals.css` centralizes the visual system. `app/loading.tsx`, `app/error.tsx` and `app/not-found.tsx` provide app-level states.

| Screen / route | Main interaction and dependencies | States / responsiveness / accessibility | Status |
| --- | --- | --- | --- |
| `/login` | Password or server-enabled demo role sign-in; Supabase Auth. | Inline action error; labels and password visibility control. | COMPLETE |
| `/dashboard` | Role-aware quick actions, own booking KPIs, live data. | Empty cards supported; mobile-first cards and desktop shell. | COMPLETE |
| `/browse`, `/labs` | Search/filter labs, desktop timeline, resource details. | No-results state; mobile cards, desktop 3-pane workspace. | COMPLETE |
| `/labs/[id]` | Lab overview, rules/location, booking link. | Missing resource falls to not-found pattern; responsive detail layout. | COMPLETE |
| `/equipment`, `/equipment/[id]` | Browse equipment and preselect request. | Empty/no-result UI; image fallback and mobile grid/cards. | COMPLETE |
| `/book` | Resources → date/time → review; submits real request. | Client validation, no-slot guidance, conflict alternatives and reduced-quantity consent. | COMPLETE |
| `/bookings`, `/bookings/[id]` | Upcoming/past/cancelled lists, lifecycle detail/cancel. | Empty tabs; status badges and confirmation dialog. | COMPLETE |
| `/calendar` | Day/list availability. | Empty state and viewport-specific simplification. | COMPLETE |
| `/notifications` | Tabs, mark all/read behavior. | Empty state; unread semantic marker. | COMPLETE |
| `/profile` | Profile/rules summary and sign out. | Active/restricted display; no self-service profile editing. | COMPLETE |
| `/approvals`, `/approvals/[id]` | Review priority/high-value requests, approve/reject. | Permission state, empty tabs; desktop table/mobile cards. | COMPLETE |
| `/issue-return` | Confirm issue/return quantities and conditions. | Empty tabs; focus-trapped confirmation dialog. | COMPLETE |
| `/blocks` | Create temporary blocks, update maintenance. | Empty block state; rejected overlap becomes action error. | COMPLETE |
| `/rules` | Coordinator/Admin rule updates. | Permission and empty rules states. | COMPLETE |
| `/reports` | Recharts reporting and scoped analytics. | Permission state; charts need manual assistive-tech review. | COMPLETE |
| `/admin/[id]` | Users, departments, labs, equipment, categories, audit management. | Permission state; tables become cards on mobile. | COMPLETE |

## Integration findings

All screen routes use `getAppData()` through `components/screens/route.tsx`. That DAL applies role/department scopes before data reaches screen components; submissions route through Server Actions rather than fixture-only handlers. Existing evidence separates fixture checks from live/database checks.

## Accessibility / UI verification status

- Verified: visible labels for primary forms, skip link, `aria-current` navigation, icon button labels, semantic status text, Radix dialog keyboard trapping, app loading/error/not-found screens, six viewport fixture overflow checks, and public role/viewport render checks.
- PARTIAL: no automated WCAG scan, screen-reader task test, keyboard traversal of every screen, contrast measurement or reduced-motion test is recorded. Recharts and full table semantics need a manual accessibility pass before institutional rollout.
- Known visual limitation: dashboard and admin screenshots validate dimensions/rendering but not subjective parity with every design reference after future UI changes.
