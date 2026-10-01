# AI Task Queue

## Current Task

Task ID: UL-OPS-001
Title: Establish a safe production operations baseline
Priority: P1
Status: READY FOR OWNER DECISION
Dependencies: Supabase/Vercel account-owner access and an approved account-lifecycle policy.

### Objective

Turn the verified demo deployment into an operationally supportable institutional deployment without weakening booking or authorization rules.

### Required Changes

1. Decide whether accounts remain Admin-provisioned or add approved signup, verification and recovery flows.
2. Add a rate-limit strategy for sign-in and sensitive mutations.
3. Establish reviewed incremental migrations, drift detection and CI checks.
4. Verify dashboard-only production settings, backups and monitoring.

### Files Expected To Change

Potentially `.github/workflows/*`, `package.json`, Auth routes/actions, Supabase configuration/schema migrations, deployment settings documentation and all status docs. Do not modify the core schema solely to mark this task complete.

### Acceptance Criteria

- Account lifecycle is explicit, tested and documented.
- Abusive login/mutation attempts receive safe limits.
- A schema change can be deployed and rolled back through an approved incremental process.
- CI runs typecheck, tests and build on a pull request.
- Operational owner confirms production Auth, data-access, backup and monitoring configuration.

### Verification

Run the release checklist in `TESTING.md`, security negative tests, a migration rehearsal and an approved production smoke test. Record dated evidence without secrets.

### Notes

The existing application behavior is intentionally unchanged by this documentation task. See `TODO.md` for discrete tasks.
