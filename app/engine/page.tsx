'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState, useRef, useEffect, useCallback } from 'react'
import type { ChatMessage, Experience, CurateResponse } from '@/lib/types'
import { getCurrentUser, signOut, type User } from '@/lib/auth'

// ── Helpers ───────────────────────────────────────────────────────────────

// Cosmetic-only gradient, deterministic per experience id — there is no
// `image` column on the real inventory yet, so cards get a stable gradient
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

// Minimal, dependency-free renderer for Claude's markdown-flavored replies
// (headings, **bold**, *italic*, "- " bullets, "---" dividers, paragraphs).
// Processed line-by-line rather than block-by-block, since Claude often puts
// a heading directly above body text with no blank line between them.
function renderInline(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="text-cream font-semibold">{part.slice(2, -2)}</strong>
    }
    return (
      <span key={i}>
        {part.split(/(\*[^*]+\*)/g).map((seg, j) =>
          seg.length > 2 && seg.startsWith('*') && seg.endsWith('*')
            ? <em key={j} className="text-cream/90 not-italic font-medium">{seg.slice(1, -1)}</em>
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
            <li key={li} className="flex gap-2 text-sm text-cream/75 leading-relaxed">
              <span className="text-gold/60 shrink-0 mt-0.5">•</span>
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
      if (/^-{3,}$/.test(line)) { flushBullets(); nodes.push(<hr key={`hr-${nodes.length}`} className="border-white/10 my-3" />); continue }
      if (/^#{1,6}\s+/.test(line)) {
        flushBullets()
        nodes.push(<p key={`h-${nodes.length}`} className="text-cream font-semibold mt-3 mb-1">{renderInline(line.replace(/^#{1,6}\s+/, ''))}</p>)
        continue
      }
      if (/^[-*]\s+/.test(line)) { bullets.push(line.replace(/^[-*]\s+/, '')); continue }
      flushBullets()
      nodes.push(<p key={`p-${nodes.length}`} className="text-sm text-cream/80 leading-relaxed">{renderInline(line)}</p>)
    }
    flushBullets()

    return <div key={bi} className="mb-1">{nodes}</div>
  })
}

// ── Icons ─────────────────────────────────────────────────────────────────

function IconEdit() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  )
}

function IconSearch() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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

function IconArrowLeft() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  )
}

function IconShare() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
    </svg>
  )
}

function IconBookmark() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-4.5L5 21V5z" />
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

function IconPanelRight() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path strokeLinecap="round" d="M15 3v18" />
    </svg>
  )
}

// ── Chat input ────────────────────────────────────────────────────────────

interface ChatInputProps {
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  onSubmit: () => void
  placeholder: string
  disabled: boolean
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
}

function ChatInput({ value, onChange, onKeyDown, onSubmit, placeholder, disabled, textareaRef }: ChatInputProps) {
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit() }} className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        rows={1}
        className="w-full bg-white/6 border border-white/10 rounded-xl pl-5 pr-14 py-4 text-cream placeholder-cream/25 text-sm focus:outline-none focus:border-gold/40 transition-colors resize-none leading-relaxed"
        style={{ overflowY: 'hidden' }}
      />
      <button
        type="submit"
        disabled={disabled}
        className="absolute right-3 bottom-3 w-8 h-8 rounded-lg bg-gold disabled:bg-white/10 flex items-center justify-center transition-all hover:bg-gold/90 disabled:cursor-not-allowed"
      >
        <svg className="w-4 h-4 text-navy" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      </button>
    </form>
  )
}

// ── Experience result card (recommendations grid) ─────────────────────────

function ExperienceCard({ exp, onView }: { exp: Experience; onView: (exp: Experience) => void }) {
  return (
    <div
      className="bg-white/4 border border-white/8 rounded-2xl overflow-hidden cursor-pointer hover:border-gold/35 hover:bg-white/6 transition-all group"
      onClick={() => onView(exp)}
    >
      <div className={`h-28 bg-linear-to-br ${gradientFor(exp.id)} relative flex items-end p-4`}>
        {typeof exp.match_score === 'number' && (
          <div className="absolute top-3 left-3">
            <span className="text-[10px] px-2.5 py-0.5 rounded-full font-semibold border bg-gold/20 text-gold border-gold/35 backdrop-blur-sm">
              {exp.match_score}% match
            </span>
          </div>
        )}
        <span className="text-cream/60 text-[10px] font-medium tracking-widest uppercase">{exp.destination}</span>
      </div>
      <div className="p-4">
        <h4 className="font-semibold text-cream text-sm leading-snug mb-0.5">{exp.name}</h4>
        <div className="flex items-center gap-1 text-cream/35 text-xs mb-3">
          <IconPin /><span>{exp.destination}</span>
        </div>
        {exp.ideal_for && exp.ideal_for.length > 0 && (
          <p className="text-xs text-cream/50 leading-relaxed line-clamp-2 mb-3 italic">
            Ideal for {exp.ideal_for.slice(0, 2).join(', ')}
          </p>
        )}
        <div className="flex items-center justify-between pt-3 border-t border-white/6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gold">{priceLabel(exp)}</span>
            {durationLabel(exp) && <span className="text-xs text-cream/30">{durationLabel(exp)}</span>}
          </div>
          <div className="text-cream/20 group-hover:text-gold transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Right panel — verified experience detail ───────────────────────────────

// Sends the traveler's full profile + the chosen experience to EscapePod by
// email (see /api/book-experience) — the server re-fetches both from
// Supabase itself rather than trusting anything the client sends.
function BookButton({ experienceId }: { experienceId: string }) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  async function handleBook() {
    setStatus('sending')
    try {
      const res = await fetch('/api/book-experience', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ experienceId }),
      })
      setStatus(res.ok ? 'sent' : 'error')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'sent') {
    return (
      <div className="bg-gold/10 border border-gold/30 rounded-2xl px-5 py-4 text-center">
        <p className="text-cream font-medium text-sm">Request sent.</p>
        <p className="text-cream/50 text-xs mt-1">A travel designer will be in touch within 24 hours.</p>
      </div>
    )
  }

  return (
    <>
      <button
        onClick={handleBook}
        disabled={status === 'sending'}
        className="flex items-center justify-center bg-gold text-navy font-semibold px-8 py-3.5 rounded-full hover:bg-gold/90 transition-colors text-sm w-full disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {status === 'sending' ? 'Sending…' : 'Book This Journey'}
      </button>
      {status === 'error' && (
        <p className="text-center text-xs text-red-400 mt-2">Something went wrong — please try again.</p>
      )}
      <p className="text-center text-[11px] text-cream/25 mt-3">A travel designer will be in touch within 24 hours.</p>
    </>
  )
}

function DetailRightPanel({ exp }: { exp: Experience }) {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
      {exp.accommodation && exp.accommodation.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-cream/30 uppercase tracking-widest mb-2">Accommodation</p>
          <ul className="space-y-1">
            {exp.accommodation.map((a, i) => <li key={i} className="text-sm text-cream/65">{a}</li>)}
          </ul>
        </div>
      )}

      {exp.key_activities && exp.key_activities.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-cream/30 uppercase tracking-widest mb-2">Key Activities</p>
          <ul className="space-y-1.5">
            {exp.key_activities.map((a, i) => (
              <li key={i} className="flex gap-2 text-sm text-cream/60">
                <span className="text-gold/60 shrink-0 mt-0.5">✦</span>{a}
              </li>
            ))}
          </ul>
        </div>
      )}

      {exp.travel_style && Object.keys(exp.travel_style).length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-cream/30 uppercase tracking-widest mb-2">Travel Style</p>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(exp.travel_style).map(([k, v]) => (
              <span key={k} className="text-xs bg-white/6 text-cream/55 border border-white/8 px-2.5 py-1 rounded-full capitalize">
                {k.replace('_', ' ')}: {v}
              </span>
            ))}
          </div>
        </div>
      )}

      {exp.ideal_for && exp.ideal_for.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-cream/30 uppercase tracking-widest mb-2">Ideal For</p>
          <div className="flex flex-wrap gap-1.5">
            {exp.ideal_for.map((item, i) => (
              <span key={i} className="text-xs bg-white/6 text-cream/55 border border-white/8 px-2.5 py-1 rounded-full">{item}</span>
            ))}
          </div>
        </div>
      )}

      {exp.weather && (
        <div>
          <p className="text-[10px] font-bold text-cream/30 uppercase tracking-widest mb-2">Weather</p>
          <p className="text-sm text-cream/65">{exp.weather}</p>
        </div>
      )}

      <div className="pt-4 border-t border-white/6">
        <BookButton experienceId={exp.id} />
      </div>
    </div>
  )
}

// ── Sidebar search panel — real verified inventory ─────────────────────────

function SearchPanel({ onSelectExperience }: { onSelectExperience: (exp: Experience) => void }) {
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/experiences')
      .then(res => res.json())
      .then(data => setExperiences(data.experiences ?? []))
      .catch(() => setExperiences([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-4 pt-4 pb-5">
        <p className="text-[10px] font-bold text-cream/30 uppercase tracking-widest mb-3">Verified Experiences</p>
        {loading && <p className="px-3 py-2 text-xs text-cream/20 italic">Loading…</p>}
        <div className="space-y-1">
          {experiences.map((exp) => (
            <button
              key={exp.id}
              onClick={() => onSelectExperience(exp)}
              className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/6 transition-colors text-left group"
            >
              <div className={`w-12 h-12 rounded-lg shrink-0 bg-linear-to-br ${gradientFor(exp.id)}`} />
              <div className="min-w-0">
                <p className="text-sm text-cream/80 font-medium truncate group-hover:text-cream transition-colors">{exp.name}</p>
                <p className="text-xs text-cream/35 truncate">{exp.destination}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-gold font-medium">{priceLabel(exp)}</span>
                  {durationLabel(exp) && <span className="text-[10px] text-cream/25">{durationLabel(exp)}</span>}
                </div>
              </div>
            </button>
          ))}
          {!loading && experiences.length === 0 && (
            <p className="px-3 py-2 text-xs text-cream/20 italic">No experiences available yet.</p>
          )}
        </div>
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
  const [resultKey, setResultKey] = useState(0)
  const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null)
  const [recentChats, setRecentChats] = useState<{ id: string; title: string }[]>([])
  const [sidebarView, setSidebarView] = useState<'recents' | 'search'>('recents')
  const [leftOpen, setLeftOpen] = useState(true)
  const [rightOpen, setRightOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      if (mobile) setLeftOpen(false)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    getCurrentUser().then((u) => { if (!u) router.replace('/login'); else setUser(u) })
    try {
      const stored = localStorage.getItem('ep_recent_chats')
      if (stored) setRecentChats(JSON.parse(stored))
    } catch { /* ignore */ }
  }, [router])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, experiences, loading])

  function startNewChat() {
    if (messages.length > 0) {
      const first = messages.find(m => m.role === 'user')
      if (first) {
        const title = first.content.length > 38 ? first.content.slice(0, 38) + '…' : first.content
        const updated = [{ id: Date.now().toString(), title }, ...recentChats].slice(0, 6)
        setRecentChats(updated)
        try { localStorage.setItem('ep_recent_chats', JSON.stringify(updated)) } catch { /* ignore */ }
      }
    }
    setMessages([]); setInput(''); setExperiences(null)
    setSelectedExperience(null)
    setSidebarView('recents')
  }

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return
    const userMsg: ChatMessage = { role: 'user', content: text.trim() }
    const updated = [...messages, userMsg]
    setMessages(updated)
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    setLoading(true)
    try {
      const res = await fetch('/api/curate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updated }),
      })
      if (res.status === 401) { router.replace('/login'); return }
      if (!res.ok) throw new Error('request failed')
      const data: CurateResponse = await res.json()

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.text || "I'm here — could you tell me a little more about what you have in mind?",
      }])

      if (data.payload?.data && Array.isArray(data.payload.data) && data.payload.data.length > 0) {
        setExperiences(data.payload.data as Experience[])
        setResultKey(k => k + 1)
      }
    } catch {
      setMessages(prev => [...prev, {
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

  const hasConversation = messages.length > 0
  const firstName = user?.name?.split(' ')[0] ?? 'Traveler'

  const chatProps: ChatInputProps = {
    value: input, onChange: handleInputChange, onKeyDown: handleKeyDown,
    onSubmit: () => sendMessage(input),
    placeholder: !hasConversation
      ? 'What journey do you have in mind...'
      : experiences ? 'Ask to adjust, combine options, or refine further…'
      : 'Type your answer or select an option above…',
    disabled: !input.trim() || loading, textareaRef,
  }

  return (
    <div className="flex h-screen bg-navy overflow-hidden">

      {/* Mobile backdrops */}
      {leftOpen && isMobile && (
        <div className="fixed inset-0 z-40 bg-black/60" onClick={() => setLeftOpen(false)} />
      )}
      {rightOpen && selectedExperience && isMobile && (
        <div className="fixed inset-0 z-40 bg-black/60" onClick={() => setRightOpen(false)} />
      )}

      {/* ── LEFT SIDEBAR ────────────────────────────────────────────── */}
      <aside className={[
        'flex flex-col bg-slate border-r border-white/8 shrink-0',
        'transition-all duration-300 ease-in-out overflow-hidden',
        'fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto',
        leftOpen
          ? 'w-70 translate-x-0'
          : '-translate-x-full lg:translate-x-0 w-70 lg:w-0',
      ].join(' ')}>

        {/* Logo */}
        <div className="px-5 py-4 border-b border-white/6">
          <Link href="/">
            <Image
              src="/images/png logo.png"
              alt="EscapePod"
              width={430}
              height={101}
              loading="lazy"
              className="h-10 w-auto object-contain brightness-0 invert opacity-90"
            />
          </Link>
        </div>

        {/* Nav */}
        <div className="px-3 py-3 space-y-0.5 border-b border-white/6">
          <button
            onClick={startNewChat}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-cream/55 hover:bg-white/6 hover:text-cream transition-colors text-sm"
          >
            <IconEdit /> New Chat
          </button>
          <button
            onClick={() => setSidebarView(v => v === 'search' ? 'recents' : 'search')}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-colors text-sm ${sidebarView === 'search' ? 'bg-white/8 text-cream' : 'text-cream/55 hover:bg-white/6 hover:text-cream'}`}
          >
            <IconSearch /> Search Experiences
          </button>
        </div>

        {/* Recents or Search panel */}
        {sidebarView === 'recents' ? (
          <div className="flex-1 px-3 pt-4 overflow-y-auto">
            <p className="text-[10px] text-cream/25 uppercase tracking-widest px-3 mb-2 font-bold">Recents</p>
            <div className="space-y-0.5">
              {recentChats.map(chat => (
                <button key={chat.id} className="w-full text-left px-3 py-2 rounded-lg text-sm text-cream/45 hover:bg-white/6 hover:text-cream/75 transition-colors truncate">
                  {chat.title}
                </button>
              ))}
              {recentChats.length === 0 && (
                <p className="px-3 py-2 text-xs text-cream/20 italic">No recent chats yet</p>
              )}
            </div>
          </div>
        ) : (
          <SearchPanel
            onSelectExperience={(exp) => {
              setSelectedExperience(exp)
              setRightOpen(true)
              if (!hasConversation) {
                setMessages([{
                  role: 'assistant',
                  content: `Here's what we have for **${exp.name}** in ${exp.destination}. Ask me anything about it, or tell me more about what you're looking for and I'll refine the options.`,
                }])
              }
              if (isMobile) setLeftOpen(false)
            }}
          />
        )}

        {/* User */}
        <div className="px-3 py-3 border-t border-white/6">
          {user ? (
            <button
              onClick={async () => { await signOut(); setUser(null); router.replace('/login') }}
              className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-white/6 transition-colors text-left group"
            >
              <div className="w-8 h-8 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center shrink-0">
                <span className="text-xs font-semibold text-gold">{user.name[0].toUpperCase()}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-cream/65 font-medium truncate">{user.name}</p>
                <p className="text-xs text-cream/25 group-hover:text-cream/40 transition-colors">Sign out</p>
              </div>
            </button>
          ) : (
            <button
              onClick={() => router.push('/login')}
              className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-white/6 transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-cream/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <span className="text-sm text-cream/65 font-medium">Sign in</span>
            </button>
          )}
        </div>
      </aside>

      {/* ── MAIN + RIGHT PANEL ──────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Center column */}
        <div className="flex flex-col flex-1 overflow-hidden">

          {/* Header */}
          <header className="flex items-center px-4 h-14 border-b border-white/8 shrink-0 gap-3">
            <button
              onClick={() => setLeftOpen(o => !o)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-cream/50 hover:bg-white/8 hover:text-cream transition-colors shrink-0"
              aria-label="Toggle sidebar"
            >
              <IconMenu />
            </button>
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <div className="relative w-7 h-7 rounded-full bg-white/8 overflow-hidden shrink-0 flex items-center justify-center">
                <Image src="/images/Escape pod logo.jpg" alt="" fill sizes="28px" priority className="object-cover" />
              </div>
              <span className="text-sm font-semibold text-cream/80 truncate">Escapepod Curation Engine</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {selectedExperience && (
                <>
                  <button
                    onClick={() => setRightOpen(o => !o)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-cream/40 hover:bg-white/8 hover:text-cream transition-colors"
                    aria-label="Toggle travel plan"
                  >
                    <IconPanelRight />
                  </button>
                  <button className="flex items-center gap-1.5 text-sm text-cream/35 hover:text-cream/70 transition-colors mr-1">
                    Share <IconShare />
                  </button>
                </>
              )}
              {user ? (
                <button
                  onClick={async () => { await signOut(); setUser(null); router.replace('/login') }}
                  className="w-8 h-8 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center hover:bg-gold/30 transition-colors shrink-0"
                  title={`${user.name} — click to sign out`}
                >
                  <span className="text-xs font-semibold text-gold">{user.name[0].toUpperCase()}</span>
                </button>
              ) : (
                <button
                  onClick={() => router.push('/login')}
                  className="text-sm text-cream/40 hover:text-cream/80 transition-colors px-2.5 py-1 rounded-lg hover:bg-white/6 border border-white/8 hover:border-white/15"
                >
                  Sign in
                </button>
              )}
            </div>
          </header>

          {/* ── WELCOME STATE ── */}
          {!hasConversation && (
            <div className="flex flex-col items-center justify-center flex-1 px-8 pb-10" style={{ background: 'radial-gradient(ellipse at 50% 20%, rgba(242,167,85,0.07) 0%, transparent 65%)' }}>
              <div className="relative w-24 h-24 mb-7 flex items-center justify-center opacity-90">
                <Image src="/images/Escape pod logo.jpg" alt="EscapePod" fill sizes="96px" className="object-contain" />
              </div>
              <h1 className="text-4xl font-bold text-cream text-center mb-3 leading-tight">
                Welcome Back {firstName}
              </h1>
              <p className="text-cream/40 text-center mb-10 max-w-md text-base leading-relaxed">
                True luxury is not found in a static itinerary — it is built around your specific rhythm.
              </p>
              <div className="w-full max-w-2xl">
                <ChatInput {...chatProps} placeholder="What journey do you have in mind..." />
              </div>
            </div>
          )}

          {/* ── EXPERIENCE DETAIL ── */}
          {hasConversation && selectedExperience && (
            <>
              <div className="flex-1 overflow-y-auto px-8 py-6">
                <div className="flex items-center gap-3 mb-6">
                  <button onClick={() => setSelectedExperience(null)} className="text-cream/30 hover:text-cream/70 transition-colors">
                    <IconArrowLeft />
                  </button>
                  <h2 className="text-xl font-semibold text-cream">{selectedExperience.name}</h2>
                </div>

                <div className={`h-52 rounded-2xl mb-6 overflow-hidden relative flex items-end p-5 bg-linear-to-br ${gradientFor(selectedExperience.id)}`}>
                  {typeof selectedExperience.match_score === 'number' && (
                    <div className="absolute top-3 left-3">
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full font-semibold border bg-gold/20 text-gold border-gold/35 backdrop-blur-sm">
                        {selectedExperience.match_score}% match
                      </span>
                    </div>
                  )}
                  <span className="text-cream/70 text-sm font-medium tracking-wide">{selectedExperience.destination}</span>
                </div>

                <div className="flex items-center gap-6 text-sm text-cream/50 mb-6 pb-6 border-b border-white/6">
                  <div className="flex items-center gap-1.5"><IconPin /><span>{selectedExperience.destination}</span></div>
                  {durationLabel(selectedExperience) && <span>{durationLabel(selectedExperience)}</span>}
                  <span className="font-bold text-gold">{priceLabel(selectedExperience)}</span>
                </div>

                <div className="max-w-xs">
                  <BookButton experienceId={selectedExperience.id} />
                </div>
              </div>
              <div className="shrink-0 border-t border-white/8 px-8 py-4">
                <ChatInput {...chatProps} placeholder="Ask anything about this journey…" />
              </div>
            </>
          )}

          {/* ── CHAT / RESULTS ── */}
          {hasConversation && !selectedExperience && (
            <>
              <div className="flex-1 overflow-y-auto">
                <div className="max-w-2xl mx-auto px-8 py-8 space-y-6">
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex animate-slide-up ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {msg.role === 'assistant' ? (
                        <div className="flex-1 max-w-lg">{renderMessageText(msg.content)}</div>
                      ) : (
                        <div className="max-w-sm bg-gold/10 border border-gold/15 rounded-2xl rounded-br-sm px-4 py-3 text-sm text-cream/80 leading-relaxed">
                          {msg.content}
                        </div>
                      )}
                    </div>
                  ))}
                  {loading && (
                    <div className="flex gap-1.5 items-center pt-1 animate-fade-in">
                      {[0, 150, 300].map(d => (
                        <span key={d} className="w-1.5 h-1.5 bg-gold/40 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                      ))}
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {experiences && experiences.length > 0 && !loading && (
                  <div key={resultKey} className="animate-slide-up px-8 pb-8 max-w-5xl mx-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                      {experiences.map(exp => (
                        <ExperienceCard
                          key={exp.id}
                          exp={exp}
                          onView={(e) => { setSelectedExperience(e); setRightOpen(true) }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="shrink-0 border-t border-white/8 px-8 py-4">
                <ChatInput {...chatProps} />
              </div>
            </>
          )}
        </div>

        {/* ── RIGHT PANEL — detail only ────────────────────────────── */}
        {selectedExperience && (
          <aside className={[
            'flex flex-col bg-slate border-l border-white/8 shrink-0',
            'transition-all duration-300 ease-in-out overflow-hidden',
            'fixed lg:relative inset-y-0 right-0 z-50 lg:z-auto',
            'w-full sm:w-95',
            rightOpen
              ? 'translate-x-0'
              : 'translate-x-full lg:translate-x-0 lg:w-0',
          ].join(' ')}>
            <div className="flex items-center justify-between px-5 h-14 border-b border-white/8 shrink-0">
              <h3 className="font-semibold text-cream">Travel Plan</h3>
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-1.5 text-sm text-cream/35 hover:text-cream/70 transition-colors">
                  <IconBookmark /> Bookmark
                </button>
                <button
                  onClick={() => setRightOpen(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-cream/35 hover:bg-white/8 hover:text-cream transition-colors"
                  aria-label="Close panel"
                >
                  <IconX />
                </button>
              </div>
            </div>
            <DetailRightPanel exp={selectedExperience} />
          </aside>
        )}
      </div>
    </div>
  )
}
