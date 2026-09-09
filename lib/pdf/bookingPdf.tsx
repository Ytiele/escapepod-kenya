import fs from 'node:fs';
import path from 'node:path';
import { Document, Page, View, Text, Image, StyleSheet, renderToBuffer } from '@react-pdf/renderer';

// Same palette as app/globals.css (--color-navy/gold/cream/sand/charcoal) —
// kept as plain hex here since a PDF renderer has no access to CSS
// variables. Update both places together if the brand palette ever moves.
const COLORS = {
  navy: '#011627',
  gold: '#F2A755',
  cream: '#FAF7F2',
  sand: '#F5EDD8',
  charcoal: '#1C1C1C',
};

// react-pdf's <Image> takes a Buffer directly — no need to serve these
// over HTTP just to embed them. Filenames under public/images/ are
// trusted (site assets, not user input), so a plain join is fine.
function readPublicImage(relativePath: string): Buffer | null {
  try {
    return fs.readFileSync(path.join(process.cwd(), 'public', relativePath));
  } catch {
    return null;
  }
}

const styles = StyleSheet.create({
  page: { fontFamily: 'Helvetica', backgroundColor: '#FFFFFF' },
  header: {
    backgroundColor: COLORS.navy,
    paddingHorizontal: 36,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: { width: 120 },
  headerRef: { color: COLORS.gold, fontSize: 9, letterSpacing: 1.5 },
  cover: { width: '100%', height: 155, objectFit: 'cover' },
  body: { paddingHorizontal: 36, paddingTop: 22, paddingBottom: 44 },
  eyebrow: { color: COLORS.gold, fontSize: 9, letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 7 },
  title: { color: COLORS.navy, fontSize: 21, marginBottom: 4, fontFamily: 'Helvetica-Bold' },
  subtitle: { color: COLORS.charcoal, fontSize: 10.5, opacity: 0.65, marginBottom: 16 },
  sectionTitle: {
    color: COLORS.navy,
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: 15,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.sand,
    paddingBottom: 6,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '50%', marginBottom: 10, paddingRight: 12 },
  cellLabel: { fontSize: 8, color: COLORS.charcoal, opacity: 0.5, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 },
  cellValue: { fontSize: 12, color: COLORS.navy, fontFamily: 'Helvetica-Bold' },
  list: { marginTop: 2 },
  listItem: { flexDirection: 'row', fontSize: 10.5, color: COLORS.charcoal, marginBottom: 6 },
  bullet: { color: COLORS.gold, marginRight: 8, fontFamily: 'Helvetica-Bold' },
  listText: { flex: 1, lineHeight: 1.35 },
  priceBox: {
    backgroundColor: COLORS.sand,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginTop: 17,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: { fontSize: 9, color: COLORS.charcoal, opacity: 0.65, textTransform: 'uppercase', letterSpacing: 1 },
  priceValue: { fontSize: 18, color: COLORS.navy, fontFamily: 'Helvetica-Bold' },
  note: { fontSize: 9.5, color: COLORS.charcoal, opacity: 0.65, marginTop: 11, lineHeight: 1.4 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.navy,
    paddingHorizontal: 36,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: { color: 'rgba(255,255,255,0.55)', fontSize: 8 },
  footerGold: { color: COLORS.gold, fontSize: 8 },
});

export interface BookingPdfData {
  reference: string | null;
  packageName: string;
  destination: string;
  durationDays: number | null;
  numTravelers: number;
  startDate: string | null;
  priceLabel: string;
  accommodation: string[];
  keyActivities: string[];
  travelerName: string;
  isCustom?: boolean;
}

function formatDate(iso: string | null): string {
  if (!iso) return 'To be confirmed';
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function BookingDocument({
  data,
  coverImage,
  logo,
}: {
  data: BookingPdfData;
  coverImage: Buffer | null;
  logo: Buffer | null;
}) {
  return (
    <Document title={`${data.isCustom ? 'Custom Itinerary Request' : 'Booking Confirmation'} — ${data.packageName}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          {logo ? <Image src={logo} style={styles.logo} /> : <Text style={{ color: COLORS.gold, fontSize: 14, fontFamily: 'Helvetica-Bold' }}>ESCAPEPOD KENYA</Text>}
          {data.reference && <Text style={styles.headerRef}>REF {data.reference}</Text>}
        </View>

        {coverImage && <Image src={coverImage} style={styles.cover} />}

        <View style={styles.body}>
          <Text style={styles.eyebrow}>{data.isCustom ? 'Custom Itinerary Request' : 'Booking Confirmation'}</Text>
          <Text style={styles.title}>{data.packageName}</Text>
          <Text style={styles.subtitle}>Prepared for {data.travelerName}</Text>

          <Text style={styles.sectionTitle}>Journey Details</Text>
          <View style={styles.grid}>
            <View style={styles.cell}>
              <Text style={styles.cellLabel}>Destination</Text>
              <Text style={styles.cellValue}>{data.destination}</Text>
            </View>
            <View style={styles.cell}>
              <Text style={styles.cellLabel}>Duration</Text>
              <Text style={styles.cellValue}>{data.durationDays ? `${data.durationDays} day${data.durationDays === 1 ? '' : 's'}` : 'To be confirmed'}</Text>
            </View>
            <View style={styles.cell}>
              <Text style={styles.cellLabel}>Travelers</Text>
              <Text style={styles.cellValue}>{data.numTravelers}</Text>
            </View>
            <View style={styles.cell}>
              <Text style={styles.cellLabel}>Preferred Start Date</Text>
              <Text style={styles.cellValue}>{formatDate(data.startDate)}</Text>
            </View>
          </View>

          {data.accommodation.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>{data.isCustom ? 'Candidate Accommodation' : 'Accommodation'}</Text>
              <View style={styles.list}>
                {data.accommodation.map((a, i) => (
                  <View key={i} style={styles.listItem}>
                    <Text style={styles.bullet}>—</Text>
                    <Text style={styles.listText}>{a}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {data.keyActivities.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>{data.isCustom ? 'Signature Activities' : 'Key Activities'}</Text>
              <View style={styles.list}>
                {data.keyActivities.map((a, i) => (
                  <View key={i} style={styles.listItem}>
                    <Text style={styles.bullet}>—</Text>
                    <Text style={styles.listText}>{a}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          <View style={styles.priceBox}>
            <Text style={styles.priceLabel}>{data.isCustom ? 'Pricing' : 'Estimated Price'}</Text>
            <Text style={styles.priceValue}>{data.priceLabel}</Text>
          </View>

          <Text style={styles.note}>
            {data.isCustom
              ? 'This destination isn’t in our verified, priced catalogue yet — a travel designer will build a real, priced itinerary by hand and follow up by email within 24 hours. No payment has been taken.'
              : 'A travel designer will confirm availability, pricing, and every detail within 24 hours. No payment has been taken yet.'}
          </Text>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>EscapePod Kenya — The Luxury of Zero Friction</Text>
          <Text style={styles.footerGold}>sales@escapepodkenya.com</Text>
        </View>
      </Page>
    </Document>
  );
}

// Best-effort: returns null on any failure (missing image, renderer error,
// etc). Callers should treat that as "no PDF this time" and still send the
// email without an attachment — a PDF generation hiccup should never block
// a booking confirmation from going out.
export async function generateBookingPdf(data: BookingPdfData, destinationImagePath: string | null): Promise<Buffer | null> {
  try {
    const logo = readPublicImage('images/png logo.png');
    const coverImage = destinationImagePath ? readPublicImage(destinationImagePath.replace(/^\//, '')) : null;
    return await renderToBuffer(<BookingDocument data={data} coverImage={coverImage} logo={logo} />);
  } catch (err) {
    console.error('[bookingPdf] failed to generate PDF', err);
    return null;
  }
}
