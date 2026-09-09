import { NextRequest } from 'next/server';
import { getMailTransport, BOOKING_RECIPIENT, BRAND, customerEmailShell, brandedRow, brandedTable, getLogoAttachment } from '@/lib/mail';
import { checkRateLimit, clip, escapeHtml, getClientIp, RATE_LIMIT_MESSAGE } from '@/lib/security';

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

  const name = body.name?.trim() ? clip(body.name.trim(), 120) : undefined;
  const email = body.email?.trim();
  const carType = body.carType?.trim() ? clip(body.carType.trim(), 80) : undefined;
  const serviceType = body.serviceType;
  const pickupLocation = body.pickupLocation?.trim() ? clip(body.pickupLocation.trim(), 200) : undefined;
  const pickupTime = body.pickupTime?.trim() ? clip(body.pickupTime.trim(), 40) : undefined;
  const dropoffLocation = body.dropoffLocation?.trim() ? clip(body.dropoffLocation.trim(), 200) : undefined;

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

  const ip = getClientIp(request);
  if (!(await checkRateLimit(`request-transport:ip:${ip}`, 600, 5))) {
    return Response.json({ error: RATE_LIMIT_MESSAGE }, { status: 429 });
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
    brandedRow('Name', escapeHtml(name)),
    brandedRow('Email', escapeHtml(email)),
    brandedRow('Type of Car', escapeHtml(carType)),
    brandedRow('Service', escapeHtml(serviceLabel)),
  ];

  if (serviceType === 'taxi') {
    textLines.push(`Pickup location: ${pickupLocation}`, `Pickup time: ${pickupTime}`, `Drop-off location: ${dropoffLocation}`);
    tableRows.push(
      brandedRow('Pickup Location', escapeHtml(pickupLocation!)),
      brandedRow('Pickup Time', escapeHtml(pickupTime!)),
      brandedRow('Drop-off Location', escapeHtml(dropoffLocation!))
    );
  }

  try {
    await transport.sendMail({
      from: `"EscapePod Transport Requests" <${process.env.SMTP_USER}>`,
      to: BOOKING_RECIPIENT,
      replyTo: email,
      subject: `Trusted Transport Request (${serviceLabel}) — ${name}`,
      attachments: [getLogoAttachment()],
      text: textLines.join('\n'),
      html: `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; color: ${BRAND.charcoal};">
          <h2 style="color: ${BRAND.navy};">New Trusted Transport Request</h2>
          ${brandedTable(tableRows.join(''))}
        </div>
      `,
    });
    // Customer-facing confirmation — sent immediately, right after the team
    // notification above, so whoever just requested transport isn't left
    // wondering whether it went through. Own try/catch: a failure here
    // shouldn't fail the request itself, since the team was already notified.
    try {
      const customerTextLines = [
        `Hi ${name},`,
        ``,
        `We've received your trusted transport request (${serviceLabel}, ${carType}).`,
      ];
      const customerTableRows = [
        brandedRow('Type of Car', escapeHtml(carType)),
        brandedRow('Service', escapeHtml(serviceLabel)),
      ];
      if (serviceType === 'taxi') {
        customerTextLines.push(`Pickup location: ${pickupLocation}`, `Pickup time: ${pickupTime}`, `Drop-off location: ${dropoffLocation}`);
        customerTableRows.push(
          brandedRow('Pickup Location', escapeHtml(pickupLocation!)),
          brandedRow('Pickup Time', escapeHtml(pickupTime!)),
          brandedRow('Drop-off Location', escapeHtml(dropoffLocation!))
        );
      }
      customerTextLines.push(``, `Someone from our team will follow up by email or WhatsApp shortly to confirm details.`, ``, `Warmly,`, `The EscapePod Kenya Team`);

      await transport.sendMail({
        from: `"EscapePod Kenya" <${process.env.SMTP_USER}>`,
        to: email,
        replyTo: BOOKING_RECIPIENT,
        subject: `Trusted Transport Request Received`,
        attachments: [getLogoAttachment()],
        text: customerTextLines.join('\n'),
        html: customerEmailShell(
          'Trusted Transport Request Received',
          `
            <p style="margin: 0 0 20px;">Hi ${escapeHtml(name)}, we've received your trusted transport request.</p>
            ${brandedTable(customerTableRows.join(''))}
            <p style="margin: 20px 0 0;">Someone from our team will follow up by email or WhatsApp shortly to confirm details.</p>
          `
        ),
      });
    } catch (err) {
      console.error('[request-transport] failed to send customer confirmation email', err);
    }

    return Response.json({ ok: true });
  } catch (err) {
    console.error('[request-transport]', err);
    return Response.json({ error: 'Something went wrong sending your request. Please try again.' }, { status: 500 });
  }
}
