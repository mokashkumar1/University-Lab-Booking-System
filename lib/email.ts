import 'server-only';
import { Resend } from 'resend';

type BookingDecisionEmail = {
  bookingId: string;
  recipient: { email: string; name: string };
  approved: boolean;
  reason?: string;
};

const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character] || character);

export async function sendBookingDecisionEmail({ bookingId, recipient, approved, reason }: BookingDecisionEmail) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { sent: false as const, reason: 'not-configured' as const };

  const status = approved ? 'approved and reserved' : 'rejected';
  const safeName = escapeHtml(recipient.name || 'there');
  const safeReason = escapeHtml(reason || 'No reason was provided.');
  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'UniLab <onboarding@resend.dev>',
    to: [recipient.email],
    subject: approved ? 'UniLab booking approved' : 'UniLab booking update',
    html: `<main style="font-family:Arial,sans-serif;color:#10213f;line-height:1.6"><h1>UniLab booking update</h1><p>Hi ${safeName},</p><p>Your booking request has been <strong>${status}</strong>.</p>${approved ? '<p>You can view your reservation and booking details in UniLab.</p>' : `<p><strong>Reason:</strong> ${safeReason}</p>`}<p>Thank you,<br/>UniLab</p></main>`,
  }, { idempotencyKey: `booking-decision/${bookingId}/${approved ? 'approved' : 'rejected'}` });
  if (error) throw new Error(`Resend rejected the notification: ${error.message}`);
  return { sent: true as const, id: data?.id };
}

export async function sendAuthLink(email: string, actionLink: string, isSignup: boolean) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('RESEND_API_KEY is not configured. Falling back to console logging for auth links:', actionLink);
    return;
  }
  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'UniLab <onboarding@resend.dev>',
    to: [email],
    subject: isSignup ? 'Confirm your UniLab account' : 'Reset your UniLab password',
    html: `<main style="font-family:Arial,sans-serif;color:#10213f;line-height:1.6"><h1>UniLab Account</h1><p>Hi,</p><p>Please ${isSignup ? 'confirm your email address' : 'reset your password'} by clicking the link below:</p><p><a href="${escapeHtml(actionLink)}">${isSignup ? 'Confirm Email' : 'Reset Password'}</a></p><p>Thank you,<br/>UniLab</p></main>`,
  });
  if (error) throw new Error(`Resend rejected the auth email: ${error.message}`);
}

