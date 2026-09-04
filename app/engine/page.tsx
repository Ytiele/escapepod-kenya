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
function renderInline(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
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

function renderMessageText(text: string) {
  return text.split(/\n{2,}/).map((block, bi) => {
    const nodes: React.ReactNode[] = []
    let bullets: string[] = []

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

    for (const rawLine of block.split('\n')) {
      const line = rawLine.trim()
      if (!line) continue
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
function IconChevronRight() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
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

// ── Row + section types ──────────────────────────────────────────────────

type RowKey = 'overview' | string // 'overview' or an Experience id

interface SheetRowData {
  key: RowKey
  badge: string
  badgeCls: string
  title: string
  kicker: string
  summary: string
  meta: string
}

// ── Sheet row ────────────────────────────────────────────────────────────

function SheetRow({ row, selected, onClick, delay }: { row: SheetRowData; selected: boolean; onClick: () => void; delay: number }) {
  return (
    <button
      onClick={onClick}
      style={{ animationDelay: `${delay}ms` }}
      className={`animate-row-in w-full text-left grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3 px-3 py-3.5 rounded-2xl border-t border-navy/8 transition-colors ${selected ? 'bg-gold/10' : 'hover:bg-navy/5'}`}
    >
      <span className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm shrink-0 ${row.badgeCls}`}>{row.badge}</span>
      <span className="min-w-0 flex flex-col gap-0.5">
        <span className="flex items-baseline gap-2 flex-wrap">
          <span className="text-navy font-medium text-[15px] leading-tight">{row.title}</span>
          <span className="text-xs text-gold font-medium shrink-0">{row.kicker}</span>
        </span>
        <span className="text-[13px] text-charcoal/50 truncate">{row.summary}</span>
      </span>
      <span className="flex items-center gap-3 shrink-0">
        <span className="hidden sm:inline font-mono text-[11px] text-charcoal/40 whitespace-nowrap">{row.meta}</span>
        <span className="text-gold"><IconChevronRight /></span>
      </span>
    </button>
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
}

function ComposerPod({ open, onOpen, value, onChange, onKeyDown, onSubmit, disabled, loading, hint, placeholder, chips, onPick, textareaRef }: ComposerProps) {
  if (!open) {
    return (
      <button
        onClick={onOpen}
        className="animate-pod-in mx-auto flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-gold/10 border border-gold/30 text-navy text-sm shadow-sm hover:bg-gold/15 transition-colors"
      >
        {loading ? <LoadingDots className="w-1.5 h-1.5 bg-gold" /> : (
          <span className="font-mono text-[10px] bg-cream px-1.5 py-0.5 rounded-full text-navy/60">⌘K</span>
        )}
        {hint}
      </button>
    )
  }

  return (
    <div className="animate-pod-in w-full bg-cream border border-navy/10 rounded-3xl shadow-lg overflow-hidden">
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
  )
}

// ── Detail panel ─────────────────────────────────────────────────────────

function OverviewPanel({ text }: { text: string }) {
  return <div className="px-1">{renderMessageText(text)}</div>
}

function ExperiencePanel({ exp, onAsk, onBook }: { exp: Experience; onAsk: (q: string) => void; onBook: () => void }) {
  const asks = [
    `Tell me more about ${exp.name}`,
    'Compare this with the other options',
    'Adjust the budget for this one',
  ]

  return (
    <div className="flex flex-col gap-5">
      <div className={`h-32 rounded-2xl bg-linear-to-br ${gradientFor(exp.id)} flex items-end p-4 relative`}>
        {typeof exp.match_score === 'number' && (
          <span className="absolute top-3 left-3 text-[10px] px-2.5 py-0.5 rounded-full font-semibold border bg-gold/20 text-gold border-gold/35 backdrop-blur-sm">
            {exp.match_score}% match
          </span>
        )}
        <span className="text-cream/70 text-[10px] font-medium tracking-widest uppercase">{exp.destination}</span>
      </div>

      <div className="flex items-center gap-4 text-sm text-charcoal/60 pb-4 border-b border-navy/8">
        <div className="flex items-center gap-1.5"><IconPin /><span>{exp.destination}</span></div>
        {durationLabel(exp) && <span>{durationLabel(exp)}</span>}
        <span className="font-semibold text-navy ml-auto">{priceLabel(exp)}</span>
      </div>

      {exp.key_activities && exp.key_activities.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-navy/40">Key Activities</span>
          <ul className="flex flex-col">
            {exp.key_activities.map((a, i) => (
              <li key={i} className="flex gap-3 text-sm text-charcoal/70 py-2 border-t border-navy/8 first:border-t-0">
                <span className="text-gold shrink-0">✦</span>{a}
              </li>
            ))}
          </ul>
        </div>
      )}

      {(exp.accommodation?.length || exp.travel_style || exp.weather) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {exp.accommodation && exp.accommodation.length > 0 && (
            <div className="bg-navy/4 rounded-xl p-3.5 flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-navy/40">Accommodation</span>
              <span className="text-[13px] text-charcoal/75 leading-relaxed">{exp.accommodation.join(', ')}</span>
            </div>
          )}
          {exp.travel_style && Object.entries(exp.travel_style).map(([k, v]) => (
            <div key={k} className="bg-navy/4 rounded-xl p-3.5 flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-navy/40">{k.replace('_', ' ')}</span>
              <span className="text-[13px] text-charcoal/75 leading-relaxed capitalize">{v}</span>
            </div>
          ))}
          {exp.weather && (
            <div className="bg-navy/4 rounded-xl p-3.5 flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-navy/40">Weather</span>
              <span className="text-[13px] text-charcoal/75 leading-relaxed">{exp.weather}</span>
            </div>
          )}
        </div>
      )}

      {exp.ideal_for && exp.ideal_for.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-navy/40">Ideal For</span>
          <div className="flex flex-wrap gap-1.5">
            {exp.ideal_for.map((item, i) => (
              <span key={i} className="text-xs bg-navy/5 text-charcoal/60 border border-navy/8 px-2.5 py-1 rounded-full">{item}</span>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2 pt-3 border-t border-navy/8">
        <span className="text-[10px] font-bold uppercase tracking-widest text-navy/40">Ask about this</span>
        <div className="flex flex-col gap-1.5">
          {asks.map((q) => (
            <button
              key={q}
              onClick={() => onAsk(q)}
              className="text-left px-3.5 py-2.5 rounded-xl border border-gold/30 text-navy/80 text-[13px] hover:bg-gold/10 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={onBook}
        className="w-full bg-gold text-navy font-semibold py-3.5 rounded-full hover:bg-gold/90 transition-colors text-sm"
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

// ── Main page ─────────────────────────────────────────────────────────────

export default function EnginePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [experiences, setExperiences] = useState<Experience[] | null>(null)
  const [selectedKey, setSelectedKey] = useState<RowKey | null>(null)
  const [recentChats, setRecentChats] = useState<{ id: string; title: string }[]>([])
  const [podOpen, setPodOpen] = useState(true)
  const [navOpen, setNavOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [bookingExp, setBookingExp] = useState<Experience | null>(null)
  const [toast, setToast] = useState('')
  const [vw, setVw] = useState(1280)
  const [catalogDestinations, setCatalogDestinations] = useState<string[]>([])
  const [loadingStage, setLoadingStage] = useState(0)
  const [elapsed, setElapsed] = useState(0)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
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
      if (stored) setRecentChats(JSON.parse(stored))
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

  function flash(msg: string) {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(''), 2600)
  }

  function startNewChat() {
    if (messages.length > 0) {
      const first = messages.find((m) => m.role === 'user')
      if (first) {
        const title = first.content.length > 38 ? first.content.slice(0, 38) + '…' : first.content
        const updated = [{ id: Date.now().toString(), title }, ...recentChats].slice(0, 6)
        setRecentChats(updated)
        try { localStorage.setItem('ep_recent_chats', JSON.stringify(updated)) } catch { /* ignore */ }
      }
    }
    setMessages([]); setInput(''); setExperiences(null); setSelectedKey(null)
    setPodOpen(true); setNavOpen(false)
  }

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return
    const userMsg: ChatMessage = { role: 'user', content: text.trim() }
    const updated = [...messages, userMsg]
    const wasEmpty = messages.length === 0
    setMessages(updated)
    setInput('')
    setSelectedKey(null)
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

      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: data.text || "I'm here — could you tell me a little more about what you have in mind?",
      }])

      if (data.payload?.data && Array.isArray(data.payload.data) && data.payload.data.length > 0) {
        setExperiences(data.payload.data as Experience[])
        flash(`${data.payload.data.length} direction${data.payload.data.length === 1 ? '' : 's'} ready`)
      }
    } catch {
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: 'Something went wrong on our end — please try again in a moment.',
      }])
    } finally { setLoading(false) }
  }, [messages, loading, router])

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

  const lastAssistantText = [...messages].reverse().find((m) => m.role === 'assistant')?.content ?? ''

  const rows: SheetRowData[] = useMemo(() => {
    const out: SheetRowData[] = []
    if (lastAssistantText) {
      out.push({
        key: 'overview',
        badge: '✦',
        badgeCls: 'bg-navy/8 text-gold',
        title: 'Trip overview',
        kicker: 'What we recommend',
        summary: lastAssistantText.replace(/\n+/g, ' ').slice(0, 90),
        meta: '',
      })
    }
    (experiences ?? []).forEach((exp, i) => {
      out.push({
        key: exp.id,
        badge: String(i + 1),
        badgeCls: 'bg-gold text-navy',
        title: exp.name,
        kicker: exp.destination,
        summary: exp.ideal_for?.length ? `Ideal for ${exp.ideal_for.slice(0, 2).join(', ')}` : (exp.key_activities?.[0] ?? ''),
        meta: [priceLabel(exp), durationLabel(exp)].filter(Boolean).join(' · '),
      })
    })
    return out
  }, [lastAssistantText, experiences])

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

  const chips = hasTrip
    ? ['Show me something different', 'Adjust the budget', 'Combine two of these', 'Ask a follow-up question']
    : starters

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
              <button key={c.id} className="text-left px-3 py-2.5 rounded-xl text-[13.5px] text-cream/60 hover:bg-white/6 hover:text-cream/85 transition-colors truncate">
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

        {/* Empty state */}
        {!hasTrip && (
          <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-4 px-6 pb-16 overflow-hidden text-center">
            <span className="w-13 h-13 rounded-full bg-gold/15 flex items-center justify-center text-gold text-xl">✦</span>
            <h1 className="text-navy text-4xl md:text-5xl font-medium tracking-tight">Tell me where you&apos;re going.</h1>
            <p className="text-charcoal/60 text-base max-w-md text-balance">
              Describe the trip the way you&apos;d describe it to a friend — who&apos;s coming, roughly when, what you want out of it. I&apos;ll search our verified inventory and build real, priced directions.
            </p>
          </div>
        )}

        {/* First response still in flight — nothing to show yet, so give this
            its own reassuring state rather than an almost-empty sheet card. */}
        {hasTrip && rows.length === 0 && (
          <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-5 px-6 pb-16 text-center">
            <LoadingDots className="w-3 h-3 bg-gold" />
            <p className="text-navy text-lg font-medium">{LOADING_STAGES[loadingStage]}</p>
            <p className="text-charcoal/50 text-sm max-w-sm">
              This usually takes 20–40 seconds — we&apos;re genuinely searching verified inventory and scoring real matches, not just generating text.
            </p>
            <p className="font-mono text-xs text-navy/30">{elapsed}s elapsed</p>
          </div>
        )}

        {/* Sheet */}
        {hasTrip && rows.length > 0 && (
          <div className="flex-1 min-h-0 overflow-y-auto" style={{ padding: `0 ${mobile ? '13.2px' : '26.4px'} 200px` }}>
            <div className="max-w-2xl mx-auto bg-white/60 rounded-3xl shadow-lg overflow-hidden mt-2">

              <div className={`bg-linear-to-br ${stats ? gradientFor(stats.destinations.join('')) : 'from-slate to-navy'} flex items-center justify-center`} style={{ height: mobile ? 130 : 180 }}>
                <span className="text-cream/50 text-xs font-medium tracking-widest uppercase">
                  {stats ? stats.destinations.join(' · ') : 'Curating your journey'}
                </span>
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

              <div className="px-3 pb-4 flex flex-col">
                {rows.map((row, i) => (
                  <SheetRow key={row.key} row={row} selected={selectedKey === row.key} onClick={() => { setSelectedKey(row.key); setPodOpen(false) }} delay={i * 60} />
                ))}
                {loading && (
                  <div className="flex items-center gap-3 px-3 py-4">
                    <LoadingDots className="w-1.5 h-1.5 bg-gold" />
                    <span className="text-gold text-sm">{LOADING_STAGES[loadingStage]}</span>
                    <span className="ml-auto font-mono text-xs text-navy/30">{elapsed}s</span>
                  </div>
                )}
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
          />
        </div>
      </main>

      {/* ── DETAIL PANEL ────────────────────────────────────────────── */}
      {panelOpen && (
        <>
          {narrow && <div onClick={() => setSelectedKey(null)} className="fixed inset-0 z-70 bg-navy/35" />}
          <aside className={[
            'animate-panel-slide bg-sand border-l border-navy/10 overflow-y-auto',
            narrow ? 'fixed inset-y-0 right-0 z-72 w-[min(420px,86vw)] shadow-lg' : 'relative',
            mobile ? 'w-full' : '',
          ].join(' ')}>
            <div className="sticky top-0 bg-sand z-10 flex items-start gap-3 px-5 py-4 border-b border-navy/8">
              <div className="flex-1 min-w-0">
                <p className="text-[10.5px] font-bold uppercase tracking-widest text-navy/35">
                  {selectedKey === 'overview' ? 'AI recommendation' : `Direction ${(experiences ?? []).findIndex((e) => e.id === selectedKey) + 1}`}
                </p>
                <p className="text-navy text-xl font-medium mt-0.5 truncate">
                  {selectedKey === 'overview' ? 'Trip overview' : selectedExp?.name}
                </p>
              </div>
              <button onClick={() => setSelectedKey(null)} className="w-8 h-8 rounded-full bg-navy/8 flex items-center justify-center text-navy shrink-0">
                <IconX />
              </button>
            </div>
            <div className="p-5">
              {selectedKey === 'overview' ? (
                <OverviewPanel text={lastAssistantText} />
              ) : selectedExp ? (
                <ExperiencePanel
                  exp={selectedExp}
                  onAsk={(q) => { setSelectedKey(null); sendMessage(q) }}
                  onBook={() => setBookingExp(selectedExp)}
                />
              ) : null}
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
