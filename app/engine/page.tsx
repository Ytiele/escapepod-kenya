'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import type { ChatMessage, Experience, CurateResponse } from '@/lib/types'
import { getCurrentUser, signOut, type User } from '@/lib/auth'

// ── Helpers ───────────────────────────────────────────────────────────────

// Cosmetic-only gradient, deterministic per experience id — there is no
// `image` column on the real inventory, so cover bands get a stable gradient
// instead of a guessed-at stock photo standing in for verified content.
const GRADIENTS = [
  'from-slate to-navy',
  'from-navy to-[#0a2040]',
  'from-[#0a2040] via-navy to-navy',
  'from-navy via-[#0a2040] to-navy',
]
function gradientFor(key: string) {
  let hash = 0
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0
  return GRADIENTS[hash % GRADIENTS.length]
}

// Real EscapePod photography, mapped only where we're confident it actually
// depicts the destination — everything else falls back to the gradient
// rather than showing a photo of somewhere else as if it were this trip.
const DESTINATION_IMAGES: Record<string, string> = {
  'Maasai Mara': '/images/mara.jpg',
  'Samburu': '/images/journals/samburu.jpg',
  'Mount Kenya': '/images/mt kenya.jpg',
  'Lamu': '/images/lamu-sunset.jpg',
}
function imageForDestination(destination: string): string | null {
  for (const [key, src] of Object.entries(DESTINATION_IMAGES)) {
    if (destination.includes(key)) return src
  }
  return null
}

function priceLabel(exp: Experience) {
  const { price_usd_pp_min: min, price_usd_pp_max: max } = exp
  if (min && max && min !== max) return `$${min.toLocaleString()}–$${max.toLocaleString()}`
  const p = min ?? max
  return p ? `$${p.toLocaleString()}` : 'Price on request'
}

function durationLabel(exp: Experience) {
  if (!exp.duration_days) return null
  return `${exp.duration_days} ${exp.duration_days === 1 ? 'day' : 'days'}`
}

// Minimal, dependency-free renderer for Claude's markdown-flavored replies.
// The system prompt tells Claude not to use emoji at all, but this strips
// any that slip through anyway — belt and braces, since a stray emoji is a
// full-color glyph CSS can't retint to match the site's palette either way.
const EMOJI_RE = /\p{Extended_Pictographic}\uFE0F?/gu

function renderInline(text: string) {
  const withoutEmoji = text.replace(EMOJI_RE, '').replace(/ {2,}/g, ' ').trim()
  return withoutEmoji.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="text-navy font-semibold">{part.slice(2, -2)}</strong>
    }
    return (
      <span key={i}>
        {part.split(/(\*[^*]+\*)/g).map((seg, j) =>
          seg.length > 2 && seg.startsWith('*') && seg.endsWith('*')
            ? <em key={j} className="text-navy/90 not-italic font-medium">{seg.slice(1, -1)}</em>
            : seg
        )}
      </span>
    )
  })
}

function parseTableRow(line: string): string[] {
  return line.replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim())
}
function isTableSeparatorRow(cells: string[]): boolean {
  return cells.length > 0 && cells.every((c) => /^:?-{2,}:?$/.test(c))
}

function renderMessageText(text: string) {
  return text.split(/\n{2,}/).map((block, bi) => {
    const nodes: React.ReactNode[] = []
    let bullets: string[] = []
    let tableRows: string[][] = []

    const flushBullets = () => {
      if (bullets.length === 0) return
      nodes.push(
        <ul key={`ul-${nodes.length}`} className="space-y-1.5 my-2">
          {bullets.map((l, li) => (
            <li key={li} className="flex gap-2 text-sm text-charcoal/70 leading-relaxed">
              <span className="text-gold shrink-0 mt-0.5">•</span>
              <span>{renderInline(l)}</span>
            </li>
          ))}
        </ul>
      )
      bullets = []
    }

    // Claude sometimes builds an actual GFM table (e.g. a side-by-side
    // comparison) — render it as a real <table>, not literal pipe characters.
    const flushTable = () => {
      if (tableRows.length === 0) return
      const [header, ...rows] = tableRows
      nodes.push(
        <div key={`tbl-${nodes.length}`} className="overflow-x-auto my-3 rounded-xl border border-navy/10">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-navy/5">
                {header.map((h, i) => (
                  <th key={i} className="text-left font-semibold text-navy px-3 py-2 border-b border-navy/10 whitespace-nowrap">{renderInline(h)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri} className="border-t border-navy/8">
                  {row.map((c, ci) => (
                    <td key={ci} className="px-3 py-2 text-charcoal/75 align-top">{renderInline(c)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
      tableRows = []
    }

    for (const rawLine of block.split('\n')) {
      const line = rawLine.trim()
      if (!line) continue
      if (/^\|.*\|$/.test(line)) {
        const cells = parseTableRow(line)
        if (isTableSeparatorRow(cells)) continue // the |---|---| divider row — not data
        flushBullets()
        tableRows.push(cells)
        continue
      }
      flushTable()
      if (/^-{3,}$/.test(line)) { flushBullets(); nodes.push(<hr key={`hr-${nodes.length}`} className="border-navy/10 my-3" />); continue }
      if (/^#{1,6}\s+/.test(line)) {
        flushBullets()
        nodes.push(<p key={`h-${nodes.length}`} className="text-navy font-semibold mt-3 mb-1">{renderInline(line.replace(/^#{1,6}\s+/, ''))}</p>)
        continue
      }
      if (/^[-*]\s+/.test(line)) { bullets.push(line.replace(/^[-*]\s+/, '')); continue }
      flushBullets()
      nodes.push(<p key={`p-${nodes.length}`} className="text-sm text-charcoal/80 leading-relaxed">{renderInline(line)}</p>)
    }
    flushTable()
    flushBullets()

    return <div key={bi} className="mb-1">{nodes}</div>
  })
}

// Real stages of the actual /api/curate pipeline (Haiku intent extraction ->
// Sonnet tool calls against Supabase -> synthesis) — a genuine request here
// routinely takes 15-40s, so the point of rotating through these plus a
// live elapsed-time counter is to make that visible as real work in
// progress, not to fake finer-grained progress than we actually have.
const LOADING_STAGES = [
  'Understanding your request…',
  'Searching verified inventory…',
  'Scoring the best matches…',
  'Curating your directions…',
]

function LoadingDots({ className = 'w-2 h-2 bg-gold' }: { className?: string }) {
  return (
    <span className="flex items-center gap-1">
      {[0, 150, 300].map((d) => (
        <span key={d} className={`rounded-full animate-bounce ${className}`} style={{ animationDelay: `${d}ms` }} />
      ))}
    </span>
  )
}

// ── Icons ─────────────────────────────────────────────────────────────────

function IconEdit() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  )
}
function IconMenu() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
}
function IconX() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}
function IconClock() {
  return (
    <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}
function IconPin() {
  return (
    <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}
function IconSend() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  )
}
function IconSpinner() {
  return <span className="w-4 h-4 border-2 border-navy/25 border-t-navy rounded-full animate-spin" />
}

// ── Itinerary card — compact, match-score-forward, books directly ────────

function ItineraryCard({ exp, index, selected, isCompareAnchor, onView, onBook, delay }: {
  exp: Experience; index: number; selected: boolean; isCompareAnchor: boolean; onView: () => void; onBook: () => void; delay: number
}) {
  const img = imageForDestination(exp.destination)
  return (
    <div
      style={{ animationDelay: `${delay}ms` }}
      className={`animate-row-in flex flex-col bg-white rounded-2xl border overflow-hidden transition-colors ${isCompareAnchor ? 'border-gold ring-2 ring-gold/40' : selected ? 'border-gold/50 ring-1 ring-gold/30' : 'border-navy/8 hover:border-gold/30'}`}
    >
      <button onClick={onView} className="relative h-36 shrink-0 block w-full">
        {img ? (
          <Image src={img} alt={exp.destination} fill sizes="(min-width: 768px) 320px, 100vw" loading="lazy" className="object-cover" />
        ) : (
          <div className={`absolute inset-0 bg-linear-to-br ${gradientFor(exp.id)}`} />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/20 to-transparent" />
        {durationLabel(exp) && (
          <span className="absolute top-3 left-3 flex items-center gap-1.5 bg-gold text-navy text-[11px] font-bold px-3 py-1.5 rounded-full shadow-sm">
            <IconClock /> {durationLabel(exp)}
          </span>
        )}
        {typeof exp.match_score === 'number' && (
          <span className="absolute top-3 right-3 text-[11px] font-bold px-2.5 py-1 rounded-full bg-navy/75 text-gold backdrop-blur-sm">
            {exp.match_score}% match
          </span>
        )}
        <span className="absolute bottom-2.5 left-3 text-cream/60 text-[9.5px] font-bold uppercase tracking-widest">
          {isCompareAnchor ? 'Your current pick' : `Direction ${index + 1}`}
        </span>
      </button>
      <div className="flex-1 flex flex-col px-4 pt-3 pb-3.5">
        <button onClick={onView} className="text-left">
          <h4 className="text-navy font-semibold text-[15px] leading-snug mb-1.5">{exp.name}</h4>
        </button>
        <div className="flex items-center gap-1.5 text-charcoal/50 text-[12.5px] mb-2.5">
          <IconPin /><span className="truncate">{exp.destination}</span>
        </div>
        <button
          onClick={onView}
          className="self-start shrink-0 flex items-center gap-1 border-[3px] border-gold text-navy font-semibold text-[12.5px] px-4 py-2 rounded-full hover:bg-gold/10 transition-colors mb-3"
        >
          See more details <span aria-hidden>→</span>
        </button>
        <div className="flex items-center justify-between gap-2 mt-auto pt-2 border-t border-navy/6">
          <div className="flex flex-col leading-tight">
            <span className="text-[9.5px] text-charcoal/40 uppercase tracking-wide">Starting from</span>
            <span className="text-gold font-bold text-[15px]">{priceLabel(exp)}</span>
          </div>
          <button
            onClick={onBook}
            className="shrink-0 flex items-center gap-1 bg-gold text-navy font-semibold text-[12.5px] px-4 py-2 rounded-full hover:bg-gold/90 transition-colors"
          >
            Book Now <span aria-hidden>→</span>
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Composer pod ─────────────────────────────────────────────────────────

interface ComposerProps {
  open: boolean
  onOpen: () => void
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  onSubmit: () => void
  disabled: boolean
  loading: boolean
  hint: string
  placeholder: string
  chips: string[]
  onPick: (text: string) => void
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  containerRef: React.RefObject<HTMLDivElement | null>
}

// Both states are always mounted and cross-fade via opacity/scale — this is
// what makes the collapse (e.g. from a click outside) read as one smooth
// motion instead of a hard swap between two different elements.
function ComposerPod({ open, onOpen, value, onChange, onKeyDown, onSubmit, disabled, loading, hint, placeholder, chips, onPick, textareaRef, containerRef }: ComposerProps) {
  return (
    <div ref={containerRef} className="relative w-full">
      <button
        onClick={onOpen}
        className={`absolute bottom-0 left-1/2 -translate-x-1/2 flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-gold/10 border border-gold/30 text-navy text-sm shadow-sm hover:bg-gold/15 transition-all duration-300 ease-out ${
          open ? 'opacity-0 scale-95 translate-y-1 pointer-events-none' : 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
        }`}
      >
        {loading ? <LoadingDots className="w-1.5 h-1.5 bg-gold" /> : (
          <span className="font-mono text-[10px] bg-cream px-1.5 py-0.5 rounded-full text-navy/60">⌘K</span>
        )}
        {hint}
      </button>

      <div
        className={`w-full bg-cream border border-navy/10 rounded-3xl shadow-lg overflow-hidden origin-bottom transition-all duration-300 ease-out ${
          open ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' : 'opacity-0 scale-95 translate-y-2 pointer-events-none'
        }`}
      >
        <form onSubmit={(e) => { e.preventDefault(); onSubmit() }} className="flex items-end gap-2 p-3">
          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            onChange={onChange}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            className="flex-1 resize-none border-0 outline-none bg-transparent text-navy placeholder-navy/30 text-[15px] leading-relaxed max-h-28 py-1.5"
          />
          <button
            type="submit"
            disabled={disabled}
            className="shrink-0 w-10 h-10 rounded-full bg-gold text-navy flex items-center justify-center hover:bg-gold/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? <IconSpinner /> : <IconSend />}
          </button>
        </form>
        {chips.length > 0 && (
          <div className="border-t border-navy/8 bg-navy/3 px-4 py-3 flex flex-col gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-navy/35">Suggested next</span>
            <div className="flex gap-2 flex-wrap">
              {chips.map((c) => (
                <button
                  key={c}
                  onClick={() => onPick(c)}
                  className="text-left px-3.5 py-1.5 rounded-full border border-gold/30 bg-gold/10 text-navy/80 text-[13px] hover:bg-gold/20 transition-colors"
                >
                  {c}
                </button>
              ))}
            </div>
            <span className="text-[11px] text-navy/30">Enter to send · Esc to dismiss · ⌘K to summon</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Detail panel ─────────────────────────────────────────────────────────

function ExperiencePanel({ exp, onAsk, onCompare, onBook }: { exp: Experience; onAsk: (q: string) => void; onCompare: () => void; onBook: () => void }) {
  const asks = [
    `Tell me more about ${exp.name}`,
    'Adjust the budget for this one',
  ]

  const img = imageForDestination(exp.destination)

  return (
    <div className="flex flex-col gap-6">
      <div className={`h-40 rounded-2xl overflow-hidden flex items-end p-4 relative shadow-sm ${img ? '' : `bg-linear-to-br ${gradientFor(exp.id)}`}`}>
        {img && (
          <>
            <Image src={img} alt={exp.destination} fill sizes="420px" className="object-cover" />
            <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/20 to-transparent" />
          </>
        )}
        {typeof exp.match_score === 'number' && (
          <span className="absolute top-3 left-3 text-[10px] px-2.5 py-0.5 rounded-full font-semibold border bg-gold/20 text-gold border-gold/35 backdrop-blur-sm">
            {exp.match_score}% match
          </span>
        )}
        <span className="relative text-cream/70 text-[10px] font-medium tracking-widest uppercase">{exp.destination}</span>
      </div>

      <div className="flex items-center gap-4 text-sm text-charcoal/60 pb-5 border-b border-navy/8">
        <div className="flex items-center gap-1.5"><IconPin /><span>{exp.destination}</span></div>
        {durationLabel(exp) && <span>{durationLabel(exp)}</span>}
        <span className="font-semibold text-navy ml-auto">{priceLabel(exp)}</span>
      </div>

      {exp.key_activities && exp.key_activities.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-navy/40">Key Activities</span>
          <ul className="flex flex-col bg-cream/70 border border-navy/8 rounded-2xl overflow-hidden">
            {exp.key_activities.map((a, i) => (
              <li key={i} className="flex gap-3 text-sm text-charcoal/75 px-3.5 py-2.5 border-t border-navy/8 first:border-t-0">
                <span className="text-gold shrink-0">✦</span>{a}
              </li>
            ))}
          </ul>
        </div>
      )}

      {(exp.accommodation?.length || exp.travel_style || exp.weather) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {exp.accommodation && exp.accommodation.length > 0 && (
            <div className="bg-cream/70 border border-navy/8 rounded-2xl p-3.5 flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-navy/40">Accommodation</span>
              <span className="text-[13px] text-charcoal/75 leading-relaxed">{exp.accommodation.join(', ')}</span>
            </div>
          )}
          {exp.travel_style && Object.entries(exp.travel_style).map(([k, v]) => (
            <div key={k} className="bg-cream/70 border border-navy/8 rounded-2xl p-3.5 flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-navy/40">{k.replace('_', ' ')}</span>
              <span className="text-[13px] text-charcoal/75 leading-relaxed capitalize">{v}</span>
            </div>
          ))}
          {exp.weather && (
            <div className="bg-cream/70 border border-navy/8 rounded-2xl p-3.5 flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-navy/40">Weather</span>
              <span className="text-[13px] text-charcoal/75 leading-relaxed">{exp.weather}</span>
            </div>
          )}
        </div>
      )}

      {exp.ideal_for && exp.ideal_for.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-navy/40">Ideal For</span>
          <div className="flex flex-wrap gap-1.5">
            {exp.ideal_for.map((item, i) => (
              <span key={i} className="text-xs bg-cream/70 text-charcoal/60 border border-navy/8 px-2.5 py-1 rounded-full">{item}</span>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2.5 pt-4 border-t border-navy/8">
        <span className="text-[10px] font-bold uppercase tracking-widest text-navy/40">Ask about this</span>
        <div className="flex flex-col gap-1.5">
          <button
            onClick={onCompare}
            className="text-left px-3.5 py-2.5 rounded-xl border border-gold/30 bg-gold/5 text-navy/80 text-[13px] hover:bg-gold/10 transition-colors"
          >
            Compare this with the other options
          </button>
          {asks.map((q) => (
            <button
              key={q}
              onClick={() => onAsk(q)}
              className="text-left px-3.5 py-2.5 rounded-xl border border-gold/30 bg-gold/5 text-navy/80 text-[13px] hover:bg-gold/10 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={onBook}
        className="w-full bg-gold text-navy font-semibold py-3.5 rounded-full hover:bg-gold/90 transition-colors text-sm shadow-sm"
      >
        Book This Journey
      </button>
    </div>
  )
}

// ── Booking confirmation dialog ──────────────────────────────────────────

function BookingDialog({ exp, onClose, onSent }: { exp: Experience; onClose: () => void; onSent: (msg: string) => void }) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'error'>('idle')
  const [error, setError] = useState('')

  async function confirm() {
    setStatus('sending')
    try {
      const res = await fetch('/api/book-experience', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ experienceId: exp.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Something went wrong.')
      onSent('Booking request sent — a travel designer will confirm within 24 hours.')
      onClose()
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    }
  }

  return (
    <div onClick={onClose} className="fixed inset-0 z-92 bg-navy/40 flex items-center justify-center p-4">
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-cream rounded-3xl shadow-lg p-6 flex flex-col gap-3">
        <h3 className="text-navy text-2xl font-medium">Book this journey</h3>
        <p className="text-sm text-charcoal/60 leading-relaxed">
          Send this to the EscapePod team and a travel designer will confirm availability, pricing, and every detail, then follow up within 24 hours. No payment is taken here.
        </p>
        <div className="bg-navy/5 rounded-xl px-4 py-3 flex flex-col gap-1.5 mt-1">
          <div className="flex justify-between text-[13px]"><span className="text-charcoal/50">Journey</span><span className="font-medium text-navy">{exp.name}</span></div>
          <div className="flex justify-between text-[13px]"><span className="text-charcoal/50">Destination</span><span className="font-medium text-navy">{exp.destination}</span></div>
          {durationLabel(exp) && <div className="flex justify-between text-[13px]"><span className="text-charcoal/50">Duration</span><span className="font-medium text-navy">{durationLabel(exp)}</span></div>}
          <div className="flex justify-between text-[13px]"><span className="text-charcoal/50">Price</span><span className="font-medium text-navy">{priceLabel(exp)}</span></div>
        </div>
        {status === 'error' && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex gap-2 mt-2">
          <button onClick={onClose} className="flex-1 border border-navy/15 text-navy font-medium py-3 rounded-full text-sm hover:bg-navy/5 transition-colors">
            Not yet
          </button>
          <button
            onClick={confirm}
            disabled={status === 'sending'}
            className="flex-1 bg-gold text-navy font-semibold py-3 rounded-full text-sm hover:bg-gold/90 disabled:opacity-60 transition-colors"
          >
            {status === 'sending' ? 'Sending…' : 'Send booking request'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Profile dialog ───────────────────────────────────────────────────────

function ProfileDialog({ user, onClose, onSignOut }: { user: User; onClose: () => void; onSignOut: () => void }) {
  return (
    <div onClick={onClose} className="fixed inset-0 z-85 bg-navy/40 flex items-center justify-center p-4">
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm bg-cream rounded-3xl shadow-lg p-6 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <span className="w-13 h-13 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center text-navy font-semibold text-lg shrink-0">
            {user.name[0]?.toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="text-navy font-medium truncate">{user.name}</p>
            <p className="text-charcoal/50 text-sm truncate">{user.email}</p>
          </div>
        </div>
        <button
          onClick={onSignOut}
          className="w-full border border-navy/15 text-navy font-medium py-3 rounded-full text-sm hover:bg-navy/5 transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}

// A recent chat stores the full transcript + last results, not just a
// title — otherwise there'd be nothing to restore when it's clicked.
interface RecentChat {
  id: string
  title: string
  messages: ChatMessage[]
  experiences: Experience[] | null
}

function isRecentChat(v: unknown): v is RecentChat {
  if (!v || typeof v !== 'object') return false
  const r = v as Record<string, unknown>
  return typeof r.id === 'string' && typeof r.title === 'string' && Array.isArray(r.messages)
}

// ── Main page ─────────────────────────────────────────────────────────────

export default function EnginePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [experiences, setExperiences] = useState<Experience[] | null>(null)
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  // The card the traveler was viewing when they asked to "compare this with
  // the other options" — kept marked through the reply so both the initial
  // pick and every alternative stay visible and bookable side by side,
  // instead of the comparison losing track of which one was "the initial."
  const [compareAnchorId, setCompareAnchorId] = useState<string | null>(null)
  const [recentChats, setRecentChats] = useState<RecentChat[]>([])
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [podOpen, setPodOpen] = useState(true)
  const [navOpen, setNavOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [bookingExp, setBookingExp] = useState<Experience | null>(null)
  const [toast, setToast] = useState('')
  const [vw, setVw] = useState(1280)
  const [catalogDestinations, setCatalogDestinations] = useState<string[]>([])
  const [loadingStage, setLoadingStage] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  // Measured live from the composer itself (see effect below) rather than
  // guessed as a fixed number — its open height varies with chip count and
  // viewport width, and a fixed guess previously left the last bit of text
  // sitting underneath it on narrower screens.
  const [composerClearance, setComposerClearance] = useState(140)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const composerRef = useRef<HTMLDivElement>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const mobile = vw < 820
  const narrow = vw < 1180
  const hasTrip = messages.length > 0

  // ── Loading feedback — rotate through real pipeline stages + a live
  // elapsed-time counter, so a genuinely long request (15-40s is normal
  // for the full Haiku -> Sonnet -> Supabase -> Sonnet pipeline) reads as
  // active work, not a stalled page. ──────────────────────────────────
  useEffect(() => {
    if (!loading) { setLoadingStage(0); setElapsed(0); return }
    const start = Date.now()
    const stageId = setInterval(() => setLoadingStage((s) => (s + 1) % LOADING_STAGES.length), 2600)
    const clockId = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000)
    return () => { clearInterval(stageId); clearInterval(clockId) }
  }, [loading])

  // ── Auth + initial data ──────────────────────────────────────────────
  useEffect(() => {
    getCurrentUser().then((u) => { if (!u) router.replace('/login'); else setUser(u) })
    try {
      const stored = localStorage.getItem('ep_recent_chats')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) setRecentChats(parsed.filter(isRecentChat))
      }
    } catch { /* ignore */ }
    fetch('/api/experiences')
      .then((res) => res.json())
      .then((data) => {
        const names = Array.from(new Set((data.experiences ?? []).map((e: Experience) => e.destination))) as string[]
        setCatalogDestinations(names)
      })
      .catch(() => { /* ignore — starters just fall back to generic copy */ })
  }, [router])

  // ── Responsive measurement ───────────────────────────────────────────
  useEffect(() => {
    const measure = () => setVw(document.documentElement.clientWidth || window.innerWidth)
    measure()
    window.addEventListener('resize', measure)
    let ro: ResizeObserver | null = null
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(measure)
      ro.observe(document.documentElement)
    }
    return () => { window.removeEventListener('resize', measure); ro?.disconnect() }
  }, [])

  // ── Composer clearance — keep scrollable content from ever rendering
  // underneath the composer, whatever height it happens to be right now
  // (collapsed pill vs. open with N wrapped chips vs. narrow viewport). ──
  useEffect(() => {
    const el = composerRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver((entries) => {
      const h = entries[0]?.contentRect.height ?? el.offsetHeight
      setComposerClearance(Math.ceil(h) + 64) // + gap to viewport edge + breathing room
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // ── Keyboard shortcuts ───────────────────────────────────────────────
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey
      if (meta && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPodOpen(true)
        setTimeout(() => textareaRef.current?.focus(), 40)
        return
      }
      if (e.key === 'Escape') {
        setSelectedKey(null); setBookingExp(null); setProfileOpen(false); setNavOpen(false)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  // ── Click away from the open composer to collapse it back to the CTA ──
  useEffect(() => {
    if (!podOpen) return
    function onPointerDown(e: PointerEvent) {
      if (composerRef.current && e.target instanceof Node && !composerRef.current.contains(e.target)) {
        setPodOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [podOpen])

  // If the card set changes (a swap, a new search) and the compare anchor
  // no longer exists in it, drop it rather than leave a stale badge.
  useEffect(() => {
    if (compareAnchorId && !(experiences ?? []).some((e) => e.id === compareAnchorId)) {
      setCompareAnchorId(null)
    }
  }, [experiences, compareAnchorId])

  function flash(msg: string) {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(''), 2600)
  }

  // Upsert the given transcript into "Recent plans" under `id`, keeping it
  // at the top. Called after every exchange (not just on "New trip"), so a
  // conversation is never lost just because the user didn't explicitly
  // close it out — and it's always up to date when clicked back into.
  function saveRecent(id: string, msgs: ChatMessage[], exps: Experience[] | null) {
    const first = msgs.find((m) => m.role === 'user')
    if (!first) return
    const title = first.content.length > 38 ? first.content.slice(0, 38) + '…' : first.content
    setRecentChats((prev) => {
      const updated = [{ id, title, messages: msgs, experiences: exps }, ...prev.filter((c) => c.id !== id)].slice(0, 6)
      try { localStorage.setItem('ep_recent_chats', JSON.stringify(updated)) } catch { /* ignore */ }
      return updated
    })
  }

  function startNewChat() {
    setMessages([]); setInput(''); setExperiences(null); setSelectedKey(null)
    setCurrentChatId(null); setSuggestions([]); setCompareAnchorId(null)
    setPodOpen(true); setNavOpen(false)
  }

  function loadRecentChat(c: RecentChat) {
    setMessages(c.messages); setExperiences(c.experiences); setCurrentChatId(c.id)
    setSelectedKey(null); setSuggestions([]); setInput(''); setCompareAnchorId(null)
    setPodOpen(false); setNavOpen(false)
  }

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return
    const userMsg: ChatMessage = { role: 'user', content: text.trim() }
    const updated = [...messages, userMsg]
    const wasEmpty = messages.length === 0
    const chatId = currentChatId ?? Date.now().toString()
    if (!currentChatId) setCurrentChatId(chatId)
    setMessages(updated)
    setInput('')
    setSelectedKey(null)
    setSuggestions([])
    setPodOpen(false)
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    setLoading(true)
    if (!wasEmpty) flash('Updating your plan…')
    try {
      const res = await fetch('/api/curate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updated }),
      })
      if (res.status === 401) { router.replace('/login'); return }
      if (!res.ok) throw new Error('request failed')
      const data: CurateResponse = await res.json()

      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: data.text || "I'm here — could you tell me a little more about what you have in mind?",
      }
      const finalMessages = [...updated, assistantMsg]
      setMessages(finalMessages)
      setSuggestions(Array.isArray(data.suggestions) ? data.suggestions : [])

      let finalExperiences = experiences
      if (data.payload?.data && Array.isArray(data.payload.data) && data.payload.data.length > 0) {
        finalExperiences = data.payload.data as Experience[]
        setExperiences(finalExperiences)
        flash(`${finalExperiences.length} direction${finalExperiences.length === 1 ? '' : 's'} ready`)
      }

      saveRecent(chatId, finalMessages, finalExperiences)
    } catch {
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: 'Something went wrong on our end — please try again in a moment.',
      }])
    } finally { setLoading(false) }
  }, [messages, loading, router, currentChatId, experiences])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) }
  }
  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = e.target.scrollHeight + 'px'
  }

  // ── Derived data ──────────────────────────────────────────────────────
  const stats = useMemo(() => {
    if (!experiences || experiences.length === 0) return null
    const allDestinations = Array.from(new Set(experiences.map((e) => e.destination)))
    // Drop a destination that's just a substring of a longer one already in
    // the list (e.g. "Maasai Mara" when "Maasai Mara + Diani Beach" is also
    // present) — both are real, but showing both reads as a duplicate.
    const destinations = allDestinations.filter((d, i) =>
      !allDestinations.some((other, j) => j !== i && other.length > d.length && other.includes(d))
    )
    const prices = experiences.flatMap((e) => [e.price_usd_pp_min, e.price_usd_pp_max].filter((n): n is number => typeof n === 'number'))
    const durations = experiences.map((e) => e.duration_days).filter((n): n is number => typeof n === 'number')
    return {
      destinations,
      priceRange: prices.length ? `$${Math.min(...prices).toLocaleString()}–$${Math.max(...prices).toLocaleString()}` : '—',
      durationRange: durations.length
        ? (Math.min(...durations) === Math.max(...durations) ? `${Math.min(...durations)}d` : `${Math.min(...durations)}–${Math.max(...durations)}d`)
        : '—',
    }
  }, [experiences])

  const tripTitle = stats ? stats.destinations.slice(0, 2).join(' & ') + (stats.destinations.length > 2 ? ' & more' : '') : ''

  // First destination among this trip's directions that we have a real
  // photo for — falls back to the gradient (handled at the render site)
  // rather than guessing at a photo for somewhere we don't have one.
  const heroImage = stats ? stats.destinations.map(imageForDestination).find((src): src is string => Boolean(src)) ?? null : null

  const lastAssistantText = [...messages].reverse().find((m) => m.role === 'assistant')?.content ?? ''

  const selectedExp = experiences?.find((e) => e.id === selectedKey) ?? null
  const panelOpen = selectedKey !== null

  const starters = useMemo(() => {
    const d = catalogDestinations
    return [
      d[0] ? `A romantic escape to ${d[0]}, mid-range budget` : 'A romantic escape, mid-range budget',
      d[1] ? `Family trip to ${d[1]}, five days` : 'A five-day family trip',
      'Solo adventure — wildlife and photography',
      d[2] ? `Ultra-luxury week combining ${d[0] ?? 'the Mara'} and ${d[2]}` : 'An ultra-luxury week, safari and coast',
    ]
  }, [catalogDestinations])

  // Claude's own conversation-specific quick replies take priority — they're
  // grounded in what it just said (or asked). Only fall back to generic
  // chips/starters when it didn't produce any (e.g. very first turn text
  // parse miss).
  const genericChips = ['Show me something different', 'Adjust the budget', 'Combine two of these', 'Ask a follow-up question']
  const chips = suggestions.length > 0 ? suggestions : (hasTrip ? genericChips : starters)

  // ── Layout ────────────────────────────────────────────────────────────
  const gridCols = mobile
    ? '1fr'
    : narrow
      ? '232px minmax(0,1fr)'
      : (panelOpen ? '264px minmax(520px,1fr) clamp(320px,28vw,420px)' : '264px minmax(520px,1fr)')

  return (
    <div className="h-screen w-full bg-cream text-charcoal overflow-hidden grid" style={{ gridTemplateColumns: gridCols }}>

      {/* Mobile drawer scrim */}
      {mobile && navOpen && (
        <div onClick={() => setNavOpen(false)} className="fixed inset-0 z-65 bg-navy/35" />
      )}

      {/* ── SIDEBAR ─────────────────────────────────────────────────── */}
      <aside className={[
        'flex flex-col gap-4 bg-slate text-cream overflow-hidden',
        mobile ? 'fixed inset-y-0 left-0 z-68 w-[min(286px,84vw)] transition-transform duration-300 ease-out shadow-lg' : 'relative',
        mobile && !navOpen ? '-translate-x-full' : 'translate-x-0',
      ].join(' ')} style={{ padding: '17.6px 17.6px 13.2px' }}>
        <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
          <Image
            src="/images/png logo.png"
            alt="EscapePod"
            width={430}
            height={101}
            priority
            className="h-8 w-auto object-contain brightness-0 invert opacity-90"
          />
        </Link>

        <button
          onClick={startNewChat}
          className="flex items-center justify-center gap-2 w-full py-2.5 px-3.5 rounded-full bg-gold text-navy font-medium text-sm hover:bg-gold/90 transition-colors"
        >
          <IconEdit /> New trip
        </button>

        <div className="flex-1 min-h-0 flex flex-col gap-2">
          <span className="text-[10.5px] font-bold uppercase tracking-widest text-cream/35 px-2">Recent plans</span>
          <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-0.5">
            {recentChats.map((c) => (
              <button
                key={c.id}
                onClick={() => loadRecentChat(c)}
                className={`text-left px-3 py-2.5 rounded-xl text-[13.5px] transition-colors truncate ${
                  c.id === currentChatId ? 'bg-white/10 text-cream' : 'text-cream/60 hover:bg-white/6 hover:text-cream/85'
                }`}
              >
                {c.title}
              </button>
            ))}
            {recentChats.length === 0 && (
              <p className="px-3 py-2 text-xs text-cream/25 italic">No recent chats yet</p>
            )}
          </div>
        </div>

        {user && (
          <button
            onClick={() => setProfileOpen(true)}
            className="flex items-center gap-2.5 pt-3 border-t border-white/8 text-left hover:opacity-80 transition-opacity"
          >
            <span className="w-8.5 h-8.5 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center text-gold font-semibold text-xs shrink-0">
              {user.name[0]?.toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13.5px] font-medium text-cream/85 truncate">{user.name}</span>
              <span className="block text-[11px] text-cream/35">Signed in</span>
            </span>
            <span className="text-cream/30 text-sm">›</span>
          </button>
        )}
      </aside>

      {/* ── MAIN ────────────────────────────────────────────────────── */}
      <main className="relative min-w-0 h-full overflow-hidden flex flex-col">

        {/* Header */}
        <header className="flex items-center gap-3 shrink-0" style={{ padding: `13.2px ${mobile ? '13.2px' : '26.4px'}` }}>
          {mobile && (
            <button onClick={() => setNavOpen(true)} className="w-11 h-11 rounded-full border border-navy/15 flex items-center justify-center text-navy shrink-0">
              <IconMenu />
            </button>
          )}
          {hasTrip && tripTitle && (
            <span className="text-[14px] font-semibold text-navy truncate min-w-0">{tripTitle}</span>
          )}
          {hasTrip && (
            <span className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${loading ? 'bg-gold/20 text-gold' : 'bg-navy/8 text-navy/70'}`}>
              <span className={`w-1.5 h-1.5 rounded-full bg-current ${loading ? 'animate-status-pulse' : ''}`} />
              {loading ? `Building · ${elapsed}s` : 'Plan ready'}
            </span>
          )}
        </header>

        {/* Empty state — scrollable with room reserved at the bottom for the
            composer (which starts open here, and can run tall with wrapped
            starter chips on narrow screens), so this text can never end up
            rendered underneath it; it scrolls into view instead. */}
        {!hasTrip && (
          <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-4 px-6 overflow-y-auto text-center" style={{ paddingBottom: composerClearance }}>
            <span className="w-13 h-13 rounded-full bg-gold/15 flex items-center justify-center text-gold text-xl">✦</span>
            <h1 className="text-navy text-4xl md:text-5xl font-medium tracking-tight">Tell me where you&apos;re going.</h1>
            <p className="text-charcoal/60 text-base max-w-md text-balance">
              Describe the trip the way you&apos;d describe it to a friend — who&apos;s coming, roughly when, what you want out of it. I&apos;ll search our verified inventory and build real, priced directions.
            </p>
          </div>
        )}

        {/* First response still in flight — nothing to show yet, so give this
            its own reassuring state rather than an almost-empty sheet card. */}
        {hasTrip && !lastAssistantText && (
          <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-5 px-6 overflow-y-auto text-center" style={{ paddingBottom: composerClearance }}>
            <LoadingDots className="w-3 h-3 bg-gold" />
            <p className="text-navy text-lg font-medium">{LOADING_STAGES[loadingStage]}</p>
            <p className="text-charcoal/50 text-sm max-w-sm">
              This usually takes 20–40 seconds — we&apos;re genuinely searching verified inventory and scoring real matches, not just generating text.
            </p>
            <p className="font-mono text-xs text-navy/30">{elapsed}s elapsed</p>
          </div>
        )}

        {/* Sheet */}
        {hasTrip && lastAssistantText && (
          <div className="flex-1 min-h-0 overflow-y-auto" style={{ padding: `0 ${mobile ? '13.2px' : '26.4px'} ${composerClearance}px` }}>
            <div className="max-w-3xl mx-auto bg-white/60 rounded-3xl shadow-lg overflow-hidden mt-2">

              {/* The destination pills and title right below already name
                  this trip — showing the same words a third time up here
                  read as repetitive, so this is just the real photo (or a
                  gradient where we don't have one), no text over it. */}
              <div className={`relative overflow-hidden ${heroImage ? '' : `bg-linear-to-br ${stats ? gradientFor(stats.destinations.join('')) : 'from-slate to-navy'}`}`} style={{ height: mobile ? 110 : 140 }}>
                {heroImage && (
                  <Image
                    src={heroImage}
                    alt={stats ? stats.destinations.join(', ') : 'Kenya'}
                    fill
                    sizes="(min-width: 768px) 768px, 100vw"
                    className="object-cover"
                    priority
                  />
                )}
              </div>

              <div className="p-6 flex flex-col gap-3">
                {stats && (
                  <div className="flex gap-2 flex-wrap">
                    {stats.destinations.slice(0, 4).map((d) => (
                      <span key={d} className="px-3 py-1 rounded-full bg-gold/15 text-gold text-xs font-semibold">{d}</span>
                    ))}
                  </div>
                )}
                <h2 className="text-navy text-2xl md:text-3xl font-medium tracking-tight">{tripTitle || 'Your Kenya journey'}</h2>
                {stats && (
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-navy/8">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-navy/35">Options</span>
                      <span className="text-sm font-semibold text-navy">{experiences?.length ?? 0}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-navy/35">Duration</span>
                      <span className="text-sm font-semibold text-navy">{stats.durationRange}</span>
                    </div>
                    <div className="flex flex-col gap-0.5 col-span-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-navy/35">Price range</span>
                      <span className="text-sm font-semibold text-navy">{stats.priceRange}</span>
                    </div>
                  </div>
                )}
              </div>

              {experiences && experiences.length > 0 && (
                <div className="px-6 pb-2 pt-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-navy/35">
                    {experiences.length} verified {experiences.length === 1 ? 'direction' : 'directions'}
                  </span>
                </div>
              )}

              <div className="px-6 pb-4 pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(experiences ?? []).map((exp, i) => (
                  <ItineraryCard
                    key={exp.id}
                    exp={exp}
                    index={i}
                    selected={selectedKey === exp.id}
                    isCompareAnchor={compareAnchorId === exp.id}
                    onView={() => { setSelectedKey(exp.id); setPodOpen(false) }}
                    onBook={() => setBookingExp(exp)}
                    delay={i * 60}
                  />
                ))}
              </div>

              {loading && (
                <div className="flex items-center gap-3 px-6 pb-4">
                  <LoadingDots className="w-1.5 h-1.5 bg-gold" />
                  <span className="text-gold text-sm">{LOADING_STAGES[loadingStage]}</span>
                  <span className="ml-auto font-mono text-xs text-navy/30">{elapsed}s</span>
                </div>
              )}

              {/* Escapepod Intelligence's reasoning — always visible below the cards, never hidden
                  behind a click. When this turn was a comparison, the
                  "Your current pick" card above stays badged so both sides
                  of the comparison — the initial pick and the alternatives —
                  are visible and bookable while the traveler reads it. */}
              <div className="px-6 pb-6">
                <div className="bg-gold/8 border border-gold/20 rounded-2xl p-4">
                  <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gold mb-1.5">
                    ✦ {compareAnchorId ? 'Comparing your options' : 'Why we recommend this'}
                  </span>
                  {renderMessageText(lastAssistantText)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Composer */}
        <div className={`absolute left-1/2 -translate-x-1/2 z-40 w-[min(640px,calc(100%-32px))] ${hasTrip ? 'bottom-6' : 'bottom-10'}`}>
          <ComposerPod
            open={podOpen}
            onOpen={() => { setPodOpen(true); setTimeout(() => textareaRef.current?.focus(), 40) }}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onSubmit={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            loading={loading}
            hint={loading ? `${LOADING_STAGES[loadingStage]} ${elapsed}s` : (hasTrip ? 'Change something' : 'Tell me about your trip')}
            placeholder={hasTrip ? "Swap a direction, shift the budget, add a stop…" : 'A week in Kenya for two, safari and beach, September…'}
            chips={chips}
            onPick={(t) => sendMessage(t)}
            textareaRef={textareaRef}
            containerRef={composerRef}
          />
        </div>
      </main>

      {/* ── DETAIL PANEL ────────────────────────────────────────────── */}
      {panelOpen && (
        <>
          {narrow && <div onClick={() => setSelectedKey(null)} className="fixed inset-0 z-70 bg-navy/35" />}
          <aside className={[
            'animate-panel-slide bg-white border-l border-navy/10 overflow-y-auto',
            narrow ? 'fixed inset-y-0 right-0 z-72 w-[min(420px,86vw)] shadow-2xl' : 'relative',
            mobile ? 'w-full' : '',
          ].join(' ')}>
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm z-10 flex items-start gap-3 px-5 py-4 border-b border-navy/8">
              <div className="flex-1 min-w-0">
                <p className="text-[10.5px] font-bold uppercase tracking-widest text-navy/35">
                  Direction {(experiences ?? []).findIndex((e) => e.id === selectedKey) + 1}
                </p>
                <p className="text-navy text-xl font-medium mt-0.5 truncate">{selectedExp?.name}</p>
              </div>
              <button onClick={() => setSelectedKey(null)} className="w-8 h-8 rounded-full bg-navy/8 flex items-center justify-center text-navy shrink-0">
                <IconX />
              </button>
            </div>
            <div className="p-6">
              {selectedExp && (
                <ExperiencePanel
                  exp={selectedExp}
                  onAsk={(q) => { setSelectedKey(null); sendMessage(q) }}
                  onCompare={() => {
                    setCompareAnchorId(selectedExp.id)
                    setSelectedKey(null)
                    sendMessage('Compare this with the other options')
                  }}
                  onBook={() => setBookingExp(selectedExp)}
                />
              )}
            </div>
          </aside>
        </>
      )}

      {/* ── Overlays ────────────────────────────────────────────────── */}
      {profileOpen && user && (
        <ProfileDialog user={user} onClose={() => setProfileOpen(false)} onSignOut={async () => { await signOut(); router.replace('/login') }} />
      )}
      {bookingExp && (
        <BookingDialog exp={bookingExp} onClose={() => setBookingExp(null)} onSent={flash} />
      )}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-95 bg-navy text-cream px-5 py-2.5 rounded-full text-[13.5px] shadow-lg animate-fade-in">
          {toast}
        </div>
      )}
    </div>
  )
}
