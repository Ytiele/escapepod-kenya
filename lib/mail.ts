import nodemailer from 'nodemailer'
import path from 'node:path'

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

// Site's exact brand palette (app/globals.css --color-navy/gold/cream/
// sand/charcoal) — kept as plain hex here since email HTML has no access
// to CSS variables. Update both places together if the palette ever moves.
export const BRAND = {
  navy: '#011627',
  gold: '#F2A755',
  cream: '#FAF7F2',
  sand: '#F5EDD8',
  charcoal: '#1C1C1C',
} as const

// Embeds the real logo file as a CID attachment rather than linking a
// hosted URL — displays immediately in every mail client, including ones
// that block remote images by default until the user opts in. Spread this
// into every sendMail() call that uses customerEmailShell (or brandedTable
// as its own attachment), alongside any other attachments (e.g. a PDF).
export function getLogoAttachment() {
  return {
    filename: 'escapepod-logo.png',
    path: path.join(process.cwd(), 'public', 'images', 'png logo.png'),
    cid: 'escapepod-logo',
  }
}

// Shared visual shell for every outbound email (customer confirmations AND
// internal team notifications) — navy header with the real logo, cream
// body, gold accents, matching footer with the same contact details as the
// site's own Footer component. `bodyHtml` is trusted, pre-escaped HTML the
// caller builds (see brandedRow/brandedButton below for consistent pieces
// to build it from) — this only wraps it. Requires getLogoAttachment() in
// the same sendMail() call, or the header shows a broken image icon.
export function customerEmailShell(heading: string, bodyHtml: string): string {
  return `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; background: ${BRAND.cream};">
      <div style="background: ${BRAND.navy}; padding: 26px 32px; text-align: center;">
        <img src="cid:escapepod-logo" alt="EscapePod Kenya" style="height: 28px;" />
      </div>
      <div style="padding: 34px 32px; background: #FFFFFF;">
        <p style="color: ${BRAND.gold}; font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; margin: 0 0 10px;">EscapePod Kenya</p>
        <h2 style="color: ${BRAND.navy}; margin: 0 0 20px; font-size: 22px; font-weight: 600; font-family: Georgia, 'Times New Roman', serif;">${heading}</h2>
        <div style="color: ${BRAND.charcoal}; font-size: 14px; line-height: 1.65;">
          ${bodyHtml}
        </div>
      </div>
      <div style="background: ${BRAND.navy}; padding: 22px 32px; text-align: center;">
        <p style="color: rgba(255,255,255,0.85); font-size: 12px; margin: 0 0 6px;">EscapePod Kenya &mdash; The Luxury of Zero Friction</p>
        <p style="color: rgba(255,255,255,0.5); font-size: 11px; margin: 0;">
          <a href="mailto:sales@escapepodkenya.com" style="color: ${BRAND.gold}; text-decoration: none;">sales@escapepodkenya.com</a>
          &nbsp;&middot;&nbsp; +254 117 335 858 &nbsp;&middot;&nbsp; Zamani Business Park, Nairobi
        </p>
      </div>
    </div>
  `
}

// One labeled row inside a brandedTable — `value` should already be
// escaped by the caller (matching the convention every route already
// follows for dynamic content), this only standardizes the styling.
export function brandedRow(label: string, value: string): string {
  return `<tr>
    <td style="padding: 9px 0; color: ${BRAND.charcoal}; opacity: 0.55; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; width: 42%; vertical-align: top;">${label}</td>
    <td style="padding: 9px 0; color: ${BRAND.navy}; font-weight: 600; font-size: 13.5px;">${value}</td>
  </tr>`
}

// A full table of brandedRow()s, on a soft sand card matching the site's
// own sand-background sections.
export function brandedTable(rowsHtml: string): string {
  return `<table style="width: 100%; border-collapse: collapse; background: ${BRAND.sand}; border-radius: 10px; padding: 4px 16px;"><tbody>${rowsHtml}</tbody></table>`
}

// Gold pill CTA, matching every gold button across the site itself.
export function brandedButton(href: string, label: string): string {
  return `<a href="${href}" style="display: inline-block; background: ${BRAND.gold}; color: ${BRAND.navy}; padding: 13px 30px; border-radius: 999px; text-decoration: none; font-weight: 700; font-size: 13px;">${label}</a>`
}

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
