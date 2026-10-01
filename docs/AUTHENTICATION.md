# Authentication Audit

## Status summary

| Capability | Status | Evidence / behavior |
| --- | --- | --- |
| Email/password login | COMPLETE | `lib/actions.ts:signInAction` validates format then invokes `sessionClient().auth.signInWithPassword`. All four seeded roles passed hosted Auth verification during this audit. |
| Demo-role login | COMPLETE | `demoSignInAction` reads server-only configured demo credentials; client submits only a role name. |
| Session management | COMPLETE | `@supabase/ssr` cookie clients are used in `lib/supabase/server.ts` and `proxy.ts`; protected layout calls `getProfile`. |
| Logout | COMPLETE | Server Action calls Supabase `signOut` then redirects to `/login`. |
| Protected routes | COMPLETE | `(app)/layout.tsx` redirects if no active profile. Page/action authorization also checks role and resource scope. |
| Profile synchronization | COMPLETE for Admin provisioning | Admin creates Auth user, then invokes `create_profile`; failure attempts Auth cleanup. Email updates use compensating rollback. |
| Duplicate email handling | COMPLETE | Supabase Auth reports the attempted duplicate; error is returned as a safe action error. |
| Invalid credentials | COMPLETE | A generic sign-in failure is shown, limiting account enumeration. |
| Inactive profile | COMPLETE with UX caveat | DAL treats it as no profile and redirects to login. It does not explain that the account was disabled. |
| Public signup | MISSING (intentional) | `supabase/config.toml` disables signup; no signup UI/action exists. |
| Email verification | MISSING | Seed/Admin provisioning sets `email_confirm: true`; no verification journey exists. |
| Password reset / forgot password | MISSING | No reset route or Auth recovery action exists. |
| SSO / MFA | MISSING | Not in the approved plan. |

## End-to-end flow

```text
Email/password form → server action → Supabase Auth session cookie
→ proxy refreshes claims → protected layout obtains user
→ DAL loads active profile with server-only client → AppShell
```

Admin provisioning follows a separate safe sequence:

```text
Admin form → validation → Auth admin createUser → create_profile RPC
→ audit log; on profile failure, attempt Auth user deletion
```

## Security observations

- Authentication values supplied by a form are validated; roles and actor IDs are never accepted from the browser for authorization.
- Service credentials remain server-side according to imports and ignored-file inspection.
- `proxy.ts` refreshes claims but does not itself make authorization decisions; DAL and database functions do.
- There is no application-level sign-in rate limiter, recovery-flow throttling or explicit session-revocation process beyond Supabase logout. This is a P1 hardening task before non-demo institutional rollout.

## Verification still required

- Confirm production Supabase email/provider settings if signup or recovery is ever enabled.
- Test session expiry, cookie refresh after prolonged inactivity, disabled-account messaging and Admin email-change failure recovery against the deployed environment.
