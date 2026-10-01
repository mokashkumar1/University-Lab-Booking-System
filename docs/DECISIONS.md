# Architecture Decisions

## Server Actions plus restricted database RPC

### Context

Booking and custody changes must remain secure and transactional.

### Decision

Use Next.js Server Actions → server-only DAL/service client → restricted Supabase PostgreSQL functions.

### Reason

It keeps credentials out of the browser and lets PostgreSQL enforce concurrency, inventory and lifecycle transitions.

### Consequences

There is no public REST API contract. Any future integration needs an explicitly designed and authorized API layer.

## Pending requests reserve resources

### Context

The approved product requires actionable conflict feedback and protection against conflicting requests.

### Decision

Treat Pending Approval as a holding state in the GIST exclusion and stock calculations.

### Reason

Two users cannot both receive apparent availability for the same protected slot.

### Consequences

Cancellation/rejection must release allocation; the workflow functions own that transition.

## Service-role-only table/function access

### Context

Role and department authorization is more complex than a simple row-owner policy.

### Decision

Revoke direct browser application-table access and privileged function execution; use server-side checks and database rechecks.

### Reason

Prevents UI-only authorization from becoming a bypass.

### Consequences

Service code and environment management are security-critical; do not move admin client usage into client code.

## Admin-provisioned accounts for the demo

### Context

University membership validation was not defined in the approved plan.

### Decision

Disable public signup and seed/provision accounts through Admin workflows.

### Consequences

Password recovery/email verification are not available and must be designed before general rollout.

## Archive resources, preserve history

### Context

Bookings/audit rows require stable historic resource references.

### Decision

Use archive flags instead of destructive resource deletion.

### Consequences

Management views need to make archive state visible; data retention/deprovision policy remains open.
