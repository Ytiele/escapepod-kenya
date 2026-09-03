import { NextRequest } from 'next/server'
import { getMailTransport, BOOKING_RECIPIENT } from '@/lib/mail'

type BookingBody = {
  name?: string
  email?: string
  date?: string
  time?: string
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(request: NextRequest) {
  let body: BookingBody
  try {
    body = (await request.json()) as BookingBody
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const name = body.name?.trim()
  const email = body.email?.trim()
  const date = body.date?.trim()
  const time = body.time?.trim()

  if (!name || !email || !date || !time) {
    return Response.json({ error: 'Name, email, date, and time are all required.' }, { status: 400 })
  }
  if (!isValidEmail(email)) {
    return Response.json({ error: 'Please provide a valid email address.' }, { status: 400 })
  }

  const transport = getMailTransport()
  if (!transport) {
    console.error('[book-time] SMTP is not configured — set SMTP_HOST, SMTP_USER, SMTP_PASS in .env.local')
    return Response.json(
      { error: 'Booking is temporarily unavailable. Please email sales@escapepodkenya.com directly.' },
      { status: 503 }
    )
  }

  const formattedDate = new Date(`${date}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  try {
    await transport.sendMail({
      from: `"EscapePod Booking" <${process.env.SMTP_USER}>`,
      to: BOOKING_RECIPIENT,
      replyTo: email,
      subject: `New Consultation Booking — ${name}`,
      text: `New consultation request via escapepodkenya.com\n\nName: ${name}\nEmail: ${email}\nRequested Date: ${formattedDate}\nRequested Time: ${time}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #0A1F3C;">New Consultation Booking</h2>
          <p style="color: #333;">A new 20-minute consultation request was submitted on the Contact page.</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
            <tr><td style="padding: 8px 0; color: #888;">Name</td><td style="padding: 8px 0; color: #0A1F3C; font-weight: 600;">${name}</td></tr>
            <tr><td style="padding: 8px 0; color: #888;">Email</td><td style="padding: 8px 0; color: #0A1F3C; font-weight: 600;">${email}</td></tr>
            <tr><td style="padding: 8px 0; color: #888;">Requested Date</td><td style="padding: 8px 0; color: #0A1F3C; font-weight: 600;">${formattedDate}</td></tr>
            <tr><td style="padding: 8px 0; color: #888;">Requested Time</td><td style="padding: 8px 0; color: #0A1F3C; font-weight: 600;">${time}</td></tr>
          </table>
        </div>
      `,
    })

    return Response.json({ ok: true })
  } catch (err) {
    console.error('[book-time]', err)
    return Response.json(
      { error: 'Something went wrong sending your request. Please try again or email us directly.' },
      { status: 500 }
    )
  }
}
