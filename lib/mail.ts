import nodemailer from 'nodemailer'

// SMTP transport for outbound mail (booking requests, etc).
// Configure via .env.local — see .env.local.example.
export function getMailTransport() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    return null
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465, // true for 465, false for other ports (STARTTLS)
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  })
}

export const BOOKING_RECIPIENT = process.env.BOOKING_EMAIL_TO || 'sales@escapepodkenya.com'

// IMAP access to the same inbox BOOKING_RECIPIENT delivers to — used by
// app/api/admin/poll-inbox/route.ts to pull an admin's email reply back
// into a booking's chat panel. Defaults to the SMTP credentials (same
// mailbox, most providers support both protocols on the same account);
// set IMAP_HOST/IMAP_USER/IMAP_PASS separately only if that's not the case.
export function getImapConfig() {
  const host = process.env.IMAP_HOST || process.env.SMTP_HOST
  const user = process.env.IMAP_USER || process.env.SMTP_USER
  const pass = process.env.IMAP_PASS || process.env.SMTP_PASS

  if (!host || !user || !pass) {
    return null
  }

  return {
    host,
    port: Number(process.env.IMAP_PORT) || 993,
    secure: true,
    auth: { user, pass },
  }
}
