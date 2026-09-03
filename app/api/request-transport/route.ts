import { NextRequest } from 'next/server';
import { getMailTransport, BOOKING_RECIPIENT } from '@/lib/mail';

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

interface Body {
  name?: string;
  email?: string;
  carType?: string;
  serviceType?: 'rent' | 'taxi';
  pickupLocation?: string;
  pickupTime?: string;
  dropoffLocation?: string;
}

export async function POST(request: NextRequest) {
  let body: Body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const name = body.name?.trim();
  const email = body.email?.trim();
  const carType = body.carType?.trim();
  const serviceType = body.serviceType;
  const pickupLocation = body.pickupLocation?.trim();
  const pickupTime = body.pickupTime?.trim();
  const dropoffLocation = body.dropoffLocation?.trim();

  if (!name || !email || !carType || !serviceType) {
    return Response.json({ error: 'Name, email, type of car, and service type are all required.' }, { status: 400 });
  }
  if (!isValidEmail(email)) {
    return Response.json({ error: 'Please provide a valid email address.' }, { status: 400 });
  }
  if (serviceType !== 'rent' && serviceType !== 'taxi') {
    return Response.json({ error: 'Invalid service type.' }, { status: 400 });
  }
  if (serviceType === 'taxi' && (!pickupLocation || !pickupTime || !dropoffLocation)) {
    return Response.json({ error: 'Pickup location, pickup time, and drop-off location are all required for a taxi.' }, { status: 400 });
  }

  const transport = getMailTransport();
  if (!transport) {
    console.error('[request-transport] SMTP is not configured');
    return Response.json(
      { error: 'This request is temporarily unavailable. Please email sales@escapepodkenya.com directly.' },
      { status: 503 }
    );
  }

  const serviceLabel = serviceType === 'rent' ? 'Rent a Car' : 'Hire a Taxi';

  const textLines = [
    `New trusted transport request from the website.`,
    ``,
    `Name: ${name}`,
    `Email: ${email}`,
    `Type of car: ${carType}`,
    `Service: ${serviceLabel}`,
  ];
  const tableRows = [
    `<tr><td style="padding: 8px 0; color: #888;">Name</td><td style="padding: 8px 0; font-weight: 600;">${name}</td></tr>`,
    `<tr><td style="padding: 8px 0; color: #888;">Email</td><td style="padding: 8px 0; font-weight: 600;">${email}</td></tr>`,
    `<tr><td style="padding: 8px 0; color: #888;">Type of Car</td><td style="padding: 8px 0; font-weight: 600;">${carType}</td></tr>`,
    `<tr><td style="padding: 8px 0; color: #888;">Service</td><td style="padding: 8px 0; font-weight: 600;">${serviceLabel}</td></tr>`,
  ];

  if (serviceType === 'taxi') {
    textLines.push(`Pickup location: ${pickupLocation}`, `Pickup time: ${pickupTime}`, `Drop-off location: ${dropoffLocation}`);
    tableRows.push(
      `<tr><td style="padding: 8px 0; color: #888;">Pickup Location</td><td style="padding: 8px 0; font-weight: 600;">${pickupLocation}</td></tr>`,
      `<tr><td style="padding: 8px 0; color: #888;">Pickup Time</td><td style="padding: 8px 0; font-weight: 600;">${pickupTime}</td></tr>`,
      `<tr><td style="padding: 8px 0; color: #888;">Drop-off Location</td><td style="padding: 8px 0; font-weight: 600;">${dropoffLocation}</td></tr>`
    );
  }

  try {
    await transport.sendMail({
      from: `"EscapePod Transport Requests" <${process.env.SMTP_USER}>`,
      to: BOOKING_RECIPIENT,
      replyTo: email,
      subject: `Trusted Transport Request (${serviceLabel}) — ${name}`,
      text: textLines.join('\n'),
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #0A1F3C;">New Trusted Transport Request</h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 12px;">
            ${tableRows.join('\n')}
          </table>
        </div>
      `,
    });
    return Response.json({ ok: true });
  } catch (err) {
    console.error('[request-transport]', err);
    return Response.json({ error: 'Something went wrong sending your request. Please try again.' }, { status: 500 });
  }
}
