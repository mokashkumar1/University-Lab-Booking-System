# Server Actions and Database RPC Audit

UniLab exposes no custom Route Handler REST API. Browser mutations use Next.js Server Actions; those actions call restricted PostgreSQL RPC functions with the authenticated profile ID obtained server-side.

| Entry point | Input / result | Auth and authorization | Database interaction | Status |
| --- | --- | --- | --- | --- |
| `signInAction` | email, password → redirect/error | Public | Supabase Auth password login | COMPLETE |
| `demoSignInAction` | allowed role → redirect/error | Public only when demo mode is server-enabled | Supabase Auth with server-held demo credentials | COMPLETE |
| `signOutAction` | none → redirect | Authenticated session optional | Supabase Auth logout | COMPLETE |
| `createBookingAction` | lab, interval, purpose, attendees, item quantities, notes → success/conflict alternatives | Active profile | `create_booking`; reads `validate_request` for alternatives | COMPLETE |
| `mutationAction: cancel` | booking ID | Booking owner; RPC rechecks state | `cancel_booking` | COMPLETE |
| `mutationAction: approve/reject` | booking ID, reason | Staff/Coordinator/Admin according to resource and high-value rule | `decide_booking` | COMPLETE |
| `mutationAction: issue/return` | booking ID, quantities, conditions, remarks | Lab Staff/Admin; RPC rechecks | `issue_booking`, `return_booking` | COMPLETE |
| `mutationAction: mark-read` | optional notification ID | Current profile | Scoped notification update | COMPLETE |
| `mutationAction: update-rule` | allow-listed key/value | Coordinator/Admin | `manage_rule` | COMPLETE |
| `mutationAction: block` | one resource, interval, reason | Department-scoped operator | `block_resource` | COMPLETE |
| `mutationAction: maintenance` | resource, status/condition | Department-scoped operator | `manage_resource` | COMPLETE |
| `mutationAction: save-resource` | admin resource/user payload | Admin | Auth admin calls plus `create_profile` / `manage_resource` | COMPLETE |

## RPC inventory

Core: `rule_number`, `rule_for_actor`, `require_actor`, `authorize_department`, `equipment_available`, `validate_request`, `create_booking`.

Workflow: `booking_department`, `authorize_booking`, `lock_booking_resources`, `decide_booking`, `cancel_booking`, `issue_booking`, `return_booking`, `manage_rule`, `block_resource`.

Management: `manage_resource`, `create_profile`, `set_booking_priority`.

All listed functions are revoked from `public`, `anon` and `authenticated`, and granted to `service_role` in `03_management.sql`. Inputs receive Zod validation in actions where appropriate, and database functions remain the final state/authorization check.

## Error behavior and gaps

- User-facing action failures return `ActionResult` with a safe message; unexpected database failures are not intentionally surfaced with raw connection details.
- `mutationFormAction` throws on failure for ordinary HTML form actions, therefore route error boundaries are the fallback for failures without local form state.
- There is no externally consumable REST/OpenAPI contract, webhook API, or rate limiting layer. Add them only with an explicit product requirement.
