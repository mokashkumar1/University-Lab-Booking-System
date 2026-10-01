# Transactional Email Notifications

UniLab sends a Resend email after an authorized Coordinator, Administrator or permitted Lab Staff member approves or rejects a booking. The in-app notification remains the source of record, so a delivery failure never rolls back a valid booking decision.

## Configuration

Add these encrypted Production variables in Vercel:

| Variable | Purpose |
| --- | --- |
| `RESEND_API_KEY` | A newly-created Resend API key. Never commit or paste it in source code. |
| `RESEND_FROM_EMAIL` | A verified sender, such as `UniLab <bookings@your-university-domain.edu>`. |

For a quick Resend test, `UniLab <onboarding@resend.dev>` can send only to the email address associated with the Resend account. Before sending to students, verify a sending domain in Resend and use its sender address.

## Verification

1. Add the two variables in Vercel, then redeploy.
2. Approve or reject a pending booking as an authorized reviewer.
3. Confirm the requester receives the matching message and that the in-app notification is still present.

Duplicate approval/retry delivery is protected with a Resend idempotency key per booking decision.
