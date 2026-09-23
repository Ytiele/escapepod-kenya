// Server-side verification for Google reCAPTCHA v2 (the visible "I'm not a
// robot" checkbox — see components/RecaptchaCheckbox.tsx for the widget
// every form renders). The `action` parameter is kept for forward
// compatibility with a v3 (score-based) token, which does carry one; a v2
// checkbox response has no `score`/`action` fields at all, so those checks
// below simply don't fire for it — this function works unchanged either
// way.
//
// Fails OPEN in two specific cases, matching every other best-effort piece
// of infrastructure on this site (SMTP, PDF generation, conversation
// summarization): if RECAPTCHA_SECRET_KEY isn't set at all, verification is
// skipped entirely — the site keeps working exactly as it did before this
// existed, rather than every form breaking the moment this file shipped
// without keys configured yet. And if Google's own endpoint errors or times
// out, that's treated as "unknown," not "reject" — a Google outage
// shouldn't be able to take down every form on the site. It only actually
// blocks a submission when Google explicitly says the token is invalid,
// missing, or expired.
export async function verifyRecaptcha(token: unknown, action: string): Promise<boolean> {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) return true;
  if (typeof token !== 'string' || !token) return false;

  try {
    const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token }),
    });
    const data = (await res.json()) as { success?: boolean; score?: number; action?: string };
    if (!data.success) return false;
    // A mismatched action means the token was generated for a different
    // form (or replayed) — reject it. A missing action (v2's normal case)
    // is treated as unknown rather than blocking.
    if (data.action && data.action !== action) return false;
    return typeof data.score !== 'number' || data.score >= 0.5;
  } catch (err) {
    console.error('[recaptcha] verification request failed', err);
    return true;
  }
}

export const RECAPTCHA_FAILURE_MESSAGE = 'Please complete the verification and try again.';
