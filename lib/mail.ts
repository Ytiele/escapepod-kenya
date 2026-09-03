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
