import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getMailTransport } from '@/lib/mail';
import { checkRateLimit, escapeHtml, getClientIp, RATE_LIMIT_MESSAGE } from '@/lib/security';

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Always the same generic response regardless of whether the account
// exists — never confirm/deny an email is registered to whoever's asking.
const GENERIC_MESSAGE = "If that email has an account, we've sent a link to reset the password.";

export async function POST(request: NextRequest) {
  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
  }

  const ip = getClientIp(request);
  const [ipOk, emailOk] = await Promise.all([
    checkRateLimit(`forgot-password:ip:${ip}`, 3600, 10),
    checkRateLimit(`forgot-password:email:${email}`, 3600, 5),
  ]);
  if (!ipOk || !emailOk) {
    return NextResponse.json({ error: RATE_LIMIT_MESSAGE }, { status: 429 });
  }

  // generateLink fails for an email with no account — that's fine, we
  // still return the same generic message either way (see above).
  const { data, error } = await supabaseAdmin.auth.admin.generateLink({ type: 'recovery', email });

  if (!error && data?.properties?.hashed_token) {
    const origin = request.headers.get('origin') ?? new URL(request.url).origin;
    const resetUrl = `${origin}/reset-password?token_hash=${encodeURIComponent(data.properties.hashed_token)}`;
    const name = (data.user?.user_metadata?.name as string | undefined) ?? 'there';

    const transport = getMailTransport();
    if (transport) {
      try {
        await transport.sendMail({
          from: `"EscapePod Kenya" <${process.env.SMTP_USER}>`,
          to: email,
          subject: 'Reset your EscapePod password',
          text: [
            `Hi ${name},`,
            ``,
            `We received a request to reset your EscapePod password. Click the link below to choose a new one:`,
            ``,
            resetUrl,
            ``,
            `This link expires in 1 hour. If you didn't request this, you can safely ignore this email — your password won't change.`,
          ].join('\n'),
          html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
              <h2 style="color: #0A1F3C;">Reset your password</h2>
              <p>Hi ${escapeHtml(name)},</p>
              <p>We received a request to reset your EscapePod password. Click below to choose a new one:</p>
              <p style="margin: 24px 0;">
                <a href="${resetUrl}" style="background: #C9A24B; color: #0A1F3C; padding: 12px 24px; border-radius: 999px; text-decoration: none; font-weight: 600;">Reset Password</a>
              </p>
              <p style="color: #888; font-size: 13px;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email — your password won't change.</p>
            </div>
          `,
        });
      } catch (err) {
        console.error('[forgot-password] failed to send reset email', err);
      }
    } else {
      console.error('[forgot-password] SMTP is not configured — could not send reset email');
    }
  }

  return NextResponse.json({ message: GENERIC_MESSAGE });
}
