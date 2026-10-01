# UniLab Project Context

## Purpose

UniLab is a university lab and equipment booking system. Students and faculty request labs and equipment; Lab Staff approve eligible requests and record custody; Coordinators handle high-value approvals and department rules; Administrators manage users and resources. The product's defining workflow is request → conflict alternatives when necessary → approval → issue → return, with persisted notifications and audit entries.

## Users and roles

| Role | Primary work |
| --- | --- |
| Student / Faculty | Browse resources, submit and cancel eligible requests, view bookings and notifications. |
| Lab Staff | Department-scoped approvals, resource blocks and equipment issue/return. |
| Coordinator | Department-scoped approvals, high-value approval, rules and analytics. |
| Admin | Cross-department management, rules, analytics and audit access. |

## Architecture

The application is a Next.js 16 App Router application with TypeScript, React 19, Tailwind CSS 4, Radix/shadcn-style components, Recharts, Supabase Auth and Supabase Postgres.

```text
Browser → Next.js Server Action → server-only DAL → Supabase service client
        → PostgreSQL RPC / transaction → tables, notifications, audit log
        → revalidation → refreshed server-rendered screen
```

The browser only receives the Supabase publishable key. The service/secret key is used only in `lib/supabase/admin.ts`, which is marked `server-only`.

## Data and deployment

- Provider: Supabase project configured through environment variables; project identity is intentionally not repeated here.
- Authentication: Supabase email/password sessions stored in cookies and refreshed through `proxy.ts`.
- Database access: private service client plus privileged RPC functions; no public table access is intended.
- Deployment: Vercel production deployment, with environment values stored outside Git.
- Time zone: user input and display are explicitly Asia/Karachi; timestamps persist in UTC.

## Important design decisions

- Pending requests reserve their lab/equipment window; adjacent bookings are valid through half-open intervals.
- Database functions, not visibility of UI controls, enforce lifecycle and role rules.
- High-value equipment requires Coordinator or Admin approval.
- A damaged return moves the affected equipment row into maintenance. Per-unit asset tracking is out of scope.
- Resources with historical usage are archived, rather than deleted.
- Alternative scoring is deterministic and displays contribution values; reduced-quantity choices require explicit acceptance.

## Verified current state — 2026-10-01

- `npm run typecheck`, `npm test`, and `npm run build` passed during this audit.
- The test suite reported 22 TypeScript tests and 45 isolated PostgreSQL checks passing.
- The hosted Auth verification signed in and resolved active profiles for all four demo roles.
- Existing production evidence records 34 role/viewport checks and a public end-to-end request, conflict, approval, issue, return, notification and audit workflow.

See [AUDIT_REPORT.md](AUDIT_REPORT.md) for evidence limits, missing scope and current priorities.

## Known limitations

- Students can self-register, verify their email and reset passwords through Supabase Auth. Admin and seed provisioning remain available for institutional roles.
- No API route handlers exist; mutations use Server Actions.
- The application has no rate-limit layer or institutional SSO integration.
- Seeded records and images are demo material, not institutional data.
