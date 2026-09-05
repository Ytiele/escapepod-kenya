import { creditForImage } from '@/lib/destinations'

// Small, unobtrusive credit line for the bottom-right corner of a photo.
// Plain text rather than a link — this is meant to sit inside things like
// a clickable <button> card, where a nested <a> would be invalid HTML
// that breaks click handling. The credit URL is still real; it's just
// not wired up as a click target here.
export default function PhotoCredit({ src }: { src: string | null }) {
  const credit = creditForImage(src)
  if (!credit) return null
  return (
    <span className="absolute bottom-2 right-2.5 text-[8.5px] text-white/45">
      Photo: {credit.name}
    </span>
  )
}
