'use client'

import Link from 'next/link'
import { useState, useRef, useEffect, useCallback } from 'react'
import { tours } from '@/data/mock'
import type { ChatMessage, Tour, RecommendationData } from '@/lib/types'
import { getStoredUser, type User } from '@/lib/auth'

// ── Static data ───────────────────────────────────────────────────────────

const TOUR_IMAGES: Record<string, string> = {
  'lamu-pod-experience':    '/images/lamu-sunset.jpg',
  'maasai-mara-experience': '/images/mara.jpg',
  'samburu-pod-experience': '/images/elephant.jpg',
  'watamu-pod-experience':  '/images/Kagushia.jpg',
  'laikipia-experience':    '/images/hot ballon.jpg',
  'mount-kenya-experience': '/images/mt kenya.jpg',
}

const LABEL_STYLES: Record<string, string> = {
  'Best Fit':          'bg-gold/20 text-gold border-gold/35',
  'Alternative Luxury':'bg-white/8 text-cream/65 border-white/18',
  'Stretch':           'bg-white/5 text-cream/50 border-white/12',
}

const UPCOMING_EVENTS = [
  { id: 1, name: 'Great Wildebeest Migration',   dates: 'Jul–Oct 2025',     location: 'Maasai Mara',         tag: 'Wildlife',      tourId: 'maasai-mara-experience' },
  { id: 2, name: 'Whale Shark Season',           dates: 'Oct 2025–Jan 2026',location: 'Watamu Marine Reserve',tag: 'Marine',        tourId: 'watamu-pod-experience' },
  { id: 3, name: 'Lamu Cultural Festival',       dates: 'Nov 14–18, 2025',  location: 'Lamu Archipelago',    tag: 'Culture',       tourId: 'lamu-pod-experience' },
  { id: 4, name: 'Rhino Charge Conservation Rally',dates: 'Jun 7, 2025',    location: 'Laikipia',            tag: 'Conservation',  tourId: 'laikipia-experience' },
  { id: 5, name: 'Mount Kenya Winter Ascent',    dates: 'Aug–Sep 2025',     location: 'Mount Kenya',         tag: 'Adventure',     tourId: 'mount-kenya-experience' },
  { id: 6, name: 'Mara River Crossing Season',   dates: 'Aug–Sep 2025',     location: 'Maasai Mara',         tag: 'Wildlife',      tourId: 'maasai-mara-experience' },
]

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

function IconChevronUp() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
    </svg>
  )
}

function IconChevronDown() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  )
}

function IconCheck() {
  return (
    <svg className="w-5 h-5 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}

function IconClock() {
  return (
    <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────

function parseMsgContent(content: string) {
  try { return JSON.parse(content) } catch { return null }
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
        style={{ maxHeight: '180px' }}
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

// ── Tour result card (recommendations grid) ───────────────────────────────

function TourResultCard({ tour, rec, onView }: { tour: Tour; rec?: RecommendationData; onView: (id: string) => void }) {
  const img = TOUR_IMAGES[tour.id]
  return (
    <div
      className="bg-white/4 border border-white/8 rounded-2xl overflow-hidden cursor-pointer hover:border-gold/35 hover:bg-white/6 transition-all group"
      onClick={() => onView(tour.id)}
    >
      <div className="h-44 bg-white/6 overflow-hidden relative">
        {img && <img src={img} alt={tour.title} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />}
        {rec && (
          <div className="absolute top-3 left-3">
            <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold border backdrop-blur-sm ${LABEL_STYLES[rec.label] ?? ''}`}>
              {rec.label}
            </span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h4 className="font-semibold text-cream text-sm leading-snug mb-0.5">{rec?.journeyName ?? tour.title}</h4>
        <div className="flex items-center gap-1 text-cream/35 text-xs mb-3">
          <IconPin /><span>{tour.location}</span>
        </div>
        {rec?.whyThisFits && (
          <p className="text-xs text-cream/50 leading-relaxed line-clamp-3 mb-3 italic">{rec.whyThisFits}</p>
        )}
        <div className="flex items-center justify-between pt-3 border-t border-white/6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gold">${tour.price.toLocaleString()}</span>
            <span className="text-xs text-cream/30">{tour.days} days</span>
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

// ── Right panel — Travel Plan + rich content ──────────────────────────────

function DetailRightPanel({ tour, rec }: { tour: Tour; rec?: RecommendationData }) {
  const [openDay, setOpenDay] = useState<number>(1)

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Day accordion */}
      <div className="p-4 space-y-2">
        {tour.itinerary.map((day) => {
          const isOpen = openDay === day.day
          return (
            <div key={day.day} className={`rounded-lg border overflow-hidden transition-colors ${isOpen ? 'border-white/15' : 'border-white/8'}`}>
              <button
                className="w-full flex items-center justify-between px-4 py-3 text-left bg-white/4 hover:bg-white/6 transition-colors"
                onClick={() => setOpenDay(isOpen ? -1 : day.day)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-bold text-cream/35 shrink-0">Day {day.day}</span>
                  <span className="text-sm text-cream/80 font-medium truncate">{day.title}</span>
                </div>
                {isOpen ? <IconChevronUp /> : <IconChevronDown />}
              </button>
              {isOpen && (
                <div className="px-4 py-3 bg-white/2">
                  <ul className="space-y-1.5">
                    {day.description.split('. ').filter(Boolean).map((s, i) => (
                      <li key={i} className="flex gap-2 text-sm text-cream/55 leading-relaxed">
                        <span className="text-white/20 mt-1.5 shrink-0">•</span>
                        <span>{s.replace(/\.$/, '')}.</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Rich Claude-generated content */}
      {rec && (
        <div className="px-4 pb-6 space-y-5 border-t border-white/6 pt-4">

          {rec.accommodation && (
            <div>
              <p className="text-[10px] font-bold text-cream/30 uppercase tracking-widest mb-2">Accommodation</p>
              <p className="text-sm text-cream/65">{rec.accommodation}</p>
            </div>
          )}

          {rec.signatureExperiences?.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-cream/30 uppercase tracking-widest mb-2">Signature Experiences</p>
              <ul className="space-y-1.5">
                {rec.signatureExperiences.map((exp, i) => (
                  <li key={i} className="flex gap-2 text-sm text-cream/60">
                    <span className="text-gold/60 shrink-0 mt-0.5">✦</span>{exp}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {rec.travelNotes?.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-cream/30 uppercase tracking-widest mb-2">Travel Notes</p>
              <ul className="space-y-1.5">
                {rec.travelNotes.map((note, i) => (
                  <li key={i} className="flex gap-2 text-sm text-cream/50">
                    <span className="text-white/20 shrink-0">—</span>{note}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {rec.whatToPack?.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-cream/30 uppercase tracking-widest mb-2">What to Pack</p>
              <div className="flex flex-wrap gap-1.5">
                {rec.whatToPack.map((item, i) => (
                  <span key={i} className="text-xs bg-white/6 text-cream/55 border border-white/8 px-2.5 py-1 rounded-full">{item}</span>
                ))}
              </div>
            </div>
          )}

          {rec.enhancements?.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-cream/30 uppercase tracking-widest mb-2">Optional Enhancements</p>
              <ul className="space-y-1.5">
                {rec.enhancements.map((enh, i) => (
                  <li key={i} className="flex gap-2 text-sm text-cream/60">
                    <span className="text-gold shrink-0">+</span>{enh}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Lead capture form ─────────────────────────────────────────────────────

interface LeadForm { name: string; email: string; phone: string; dates: string; travelers: string }

function LeadCapturePanel({ message, onSubmit, submitted }: { message: string; onSubmit: () => void; submitted: boolean }) {
  const [form, setForm] = useState<LeadForm>({ name: '', email: '', phone: '', dates: '', travelers: '' })
  const set = (k: keyof LeadForm) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, [k]: e.target.value }))
  const inputCls = 'w-full bg-white/6 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-cream placeholder-cream/25 focus:outline-none focus:border-gold/40 transition-colors'

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="w-12 h-12 rounded-full bg-gold/15 border border-gold/30 flex items-center justify-center mb-5">
          <IconCheck />
        </div>
        <h3 className="font-semibold text-cream mb-2">Your journey is ready for final curation.</h3>
        <p className="text-sm text-cream/45 max-w-sm">An EscapePod travel designer will be in touch within 24 hours to prepare your personalized proposal.</p>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto px-6 py-8">
      <p className="text-base text-cream/80 leading-relaxed mb-6">{message}</p>
      <div className="space-y-3">
        <input className={inputCls} placeholder="Your name" value={form.name} onChange={set('name')} />
        <input className={inputCls} type="email" placeholder="Email address" value={form.email} onChange={set('email')} />
        <input className={inputCls} type="tel" placeholder="Phone number (optional)" value={form.phone} onChange={set('phone')} />
        <input className={inputCls} placeholder="Preferred travel dates" value={form.dates} onChange={set('dates')} />
        <input className={inputCls} placeholder="Number of travelers" value={form.travelers} onChange={set('travelers')} />
      </div>
      <button
        onClick={onSubmit}
        disabled={!form.name || !form.email}
        className="mt-5 w-full bg-gold text-navy font-semibold py-3 rounded-xl hover:bg-gold/90 transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Continue Planning with EscapePod
      </button>
      <p className="text-xs text-cream/25 text-center mt-3">An EscapePod specialist will contact you within 24 hours.</p>
    </div>
  )
}

// ── Sidebar search panel (tours + events) ─────────────────────────────────

function SearchPanel({ onSelectTour }: { onSelectTour: (t: Tour) => void }) {
  return (
    <div className="flex-1 overflow-y-auto">
      {/* Tours section */}
      <div className="px-4 pt-4 pb-2">
        <p className="text-[10px] font-bold text-cream/30 uppercase tracking-widest mb-3">Tours</p>
        <div className="space-y-1">
          {tours.map((tour) => {
            const img = TOUR_IMAGES[tour.id]
            return (
              <button
                key={tour.id}
                onClick={() => onSelectTour(tour)}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/6 transition-colors text-left group"
              >
                <div className="w-12 h-12 rounded-lg bg-white/8 overflow-hidden shrink-0">
                  {img && <img src={img} alt={tour.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />}
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-cream/80 font-medium truncate group-hover:text-cream transition-colors">{tour.title}</p>
                  <p className="text-xs text-cream/35 truncate">{tour.location}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gold font-medium">${tour.price.toLocaleString()}</span>
                    <span className="text-[10px] text-cream/25">{tour.days} days</span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4 my-3 border-t border-white/6" />

      {/* Events section */}
      <div className="px-4 pb-5">
        <p className="text-[10px] font-bold text-cream/30 uppercase tracking-widest mb-3">Upcoming Events</p>
        <div className="space-y-1">
          {UPCOMING_EVENTS.map((event) => (
            <button
              key={event.id}
              onClick={() => {
                if (event.tourId) {
                  const t = tours.find(t => t.id === event.tourId)
                  if (t) onSelectTour(t)
                }
              }}
              className="w-full flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/6 transition-colors text-left group"
            >
              <div className="w-2 h-2 rounded-full bg-gold/60 shrink-0 mt-1.5" />
              <div className="min-w-0">
                <p className="text-sm text-cream/75 font-medium group-hover:text-cream transition-colors truncate">{event.name}</p>
                <div className="flex items-center gap-1 text-cream/30 text-xs mt-0.5">
                  <IconClock /><span>{event.dates}</span>
                </div>
                <p className="text-xs text-cream/25 mt-0.5">{event.location}</p>
                <span className="inline-block mt-1 text-[10px] text-gold/60 border border-gold/20 px-1.5 py-0.5 rounded">{event.tag}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────

export default function EnginePage() {
  const [user, setUser] = useState<User | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [resultTours, setResultTours] = useState<Tour[] | null>(null)
  const [activeRecs, setActiveRecs] = useState<RecommendationData[]>([])
  const [tourKey, setTourKey] = useState(0)
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null)
  const [recentChats, setRecentChats] = useState<{ id: string; title: string }[]>([])
  const [leadCaptureMsg, setLeadCaptureMsg] = useState<string | null>(null)
  const [leadSubmitted, setLeadSubmitted] = useState(false)
  const [sidebarView, setSidebarView] = useState<'recents' | 'search'>('recents')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setUser(getStoredUser())
    try {
      const stored = localStorage.getItem('ep_recent_chats')
      if (stored) setRecentChats(JSON.parse(stored))
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, resultTours, loading])

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
    setMessages([]); setInput(''); setResultTours(null); setActiveRecs([])
    setSelectedTour(null); setLeadCaptureMsg(null); setLeadSubmitted(false)
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
      const res = await fetch('/api/tour-engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updated.map(m => ({ role: m.role, content: m.content })) }),
      })
      const data = await res.json()
      const parsed = data.parsed
      setMessages(prev => [...prev, { role: 'assistant', content: data.text, tourIds: parsed?.tourIds }])

      if (parsed?.type === 'lead_capture') { setLeadCaptureMsg(parsed.message); return }

      if (parsed?.recommendations?.length) {
        setActiveRecs(parsed.recommendations)
        const matched = (parsed.recommendations as RecommendationData[])
          .map(r => tours.find(t => t.id === r.tourId)).filter(Boolean) as Tour[]
        setResultTours(matched); setTourKey(k => k + 1)
      } else if (parsed?.tourIds?.length) {
        const matched = (parsed.tourIds as string[]).map(id => tours.find(t => t.id === id)).filter(Boolean) as Tour[]
        setResultTours(matched); setTourKey(k => k + 1)
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: JSON.stringify({ type: 'question', message: 'Something went wrong — please try again.' }),
      }])
    } finally { setLoading(false) }
  }, [messages, loading])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 180) + 'px'
  }

  const hasConversation = messages.length > 0
  const firstName = user?.name?.split(' ')[0] ?? 'Traveler'
  const selectedRec = activeRecs.find(r => r.tourId === selectedTour?.id)

  const chatProps: ChatInputProps = {
    value: input, onChange: handleInputChange, onKeyDown: handleKeyDown,
    onSubmit: () => sendMessage(input),
    placeholder: !hasConversation
      ? 'Tell me about the journey you have in mind…'
      : resultTours ? 'Ask to adjust, combine options, or refine further…'
      : 'Type your answer or select an option above…',
    disabled: !input.trim() || loading, textareaRef,
  }

  return (
    <div className="flex h-screen bg-navy overflow-hidden">

      {/* ── LEFT SIDEBAR ────────────────────────────────────────────── */}
      <aside className="w-70 border-r border-white/8 flex flex-col bg-slate shrink-0">

        {/* Logo */}
        <div className="px-5 py-4 border-b border-white/6">
          <Link href="/">
            <img src="/images/png logo.png" alt="EscapePod" className="h-10 w-auto object-contain brightness-0 invert opacity-90" />
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
            <IconSearch /> Search Tours
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
            onSelectTour={(t) => {
              setSelectedTour(t)
              // Ensure we're in chat mode to show detail view
              if (!hasConversation) {
                setMessages([{ role: 'assistant', content: JSON.stringify({ type: 'question', message: `Here's what we have in store for ${t.title}. Feel free to ask me anything about this journey, or tell me more about what you're looking for and I'll refine your options.` }) }])
              }
            }}
          />
        )}

        {/* User */}
        <div className="px-3 py-3 border-t border-white/6">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/6 transition-colors cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center shrink-0">
              {user
                ? <span className="text-xs font-semibold text-gold">{user.name[0].toUpperCase()}</span>
                : <svg className="w-4 h-4 text-cream/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              }
            </div>
            <span className="text-sm text-cream/65 font-medium truncate">{user ? user.name : 'Sign in'}</span>
          </div>
        </div>
      </aside>

      {/* ── MAIN + RIGHT PANEL ──────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Center column */}
        <div className="flex flex-col flex-1 overflow-hidden">

          {/* Header */}
          <header className="flex items-center px-6 h-14 border-b border-white/8 shrink-0 gap-4">
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <div className="w-7 h-7 rounded-full bg-white/8 overflow-hidden shrink-0 flex items-center justify-center">
                <img src="/images/Escape pod logo.jpg" alt="" className="w-full h-full object-cover" />
              </div>
              <span className="text-sm font-semibold text-cream/80 truncate">Escapepod Tour Engine</span>
            </div>
            {selectedTour && (
              <button className="flex items-center gap-1.5 text-sm text-cream/35 hover:text-cream/70 transition-colors shrink-0">
                Share <IconShare />
              </button>
            )}
          </header>

          {/* ── WELCOME STATE ── */}
          {!hasConversation && (
            <div className="flex flex-col items-center justify-center flex-1 px-8 pb-10" style={{ background: 'radial-gradient(ellipse at 50% 20%, rgba(242,167,85,0.07) 0%, transparent 65%)' }}>
              <div className="w-24 h-24 mb-7 flex items-center justify-center opacity-90">
                <img src="/images/Escape pod logo.jpg" alt="EscapePod" className="w-full h-full object-contain" />
              </div>
              <h1 className="text-4xl font-bold text-cream text-center mb-3 leading-tight">
                Welcome Back {firstName}
              </h1>
              <p className="text-cream/40 text-center mb-10 max-w-md text-base leading-relaxed">
                True luxury is not found in a static itinerary — it is built around your specific rhythm.
              </p>
              <div className="w-full max-w-2xl">
                <ChatInput {...chatProps} placeholder="Tell me about the journey you have in mind…" />
              </div>
            </div>
          )}

          {/* ── LEAD CAPTURE ── */}
          {hasConversation && leadCaptureMsg && !selectedTour && (
            <div className="flex-1 overflow-y-auto">
              <LeadCapturePanel
                message={leadCaptureMsg}
                onSubmit={() => setLeadSubmitted(true)}
                submitted={leadSubmitted}
              />
            </div>
          )}

          {/* ── TOUR DETAIL ── */}
          {hasConversation && selectedTour && !leadCaptureMsg && (
            <>
              <div className="flex-1 overflow-y-auto px-8 py-6">
                <div className="flex items-center gap-3 mb-6">
                  <button onClick={() => setSelectedTour(null)} className="text-cream/30 hover:text-cream/70 transition-colors">
                    <IconArrowLeft />
                  </button>
                  <h2 className="text-xl font-semibold text-cream">{selectedTour.title}</h2>
                </div>

                <div className="h-52 bg-white/6 rounded-2xl mb-6 overflow-hidden relative">
                  {TOUR_IMAGES[selectedTour.id] && (
                    <img src={TOUR_IMAGES[selectedTour.id]} alt={selectedTour.title} className="w-full h-full object-cover opacity-90" />
                  )}
                  {selectedRec && (
                    <div className="absolute top-3 left-3">
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold border backdrop-blur-sm ${LABEL_STYLES[selectedRec.label] ?? ''}`}>
                        {selectedRec.label}
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent" />
                </div>

                <div className="flex items-center gap-6 text-sm text-cream/50 mb-6 pb-6 border-b border-white/6">
                  <div className="flex items-center gap-1.5"><IconPin /><span>{selectedTour.location}</span></div>
                  <span>{selectedTour.days} Days</span>
                  <span className="font-bold text-gold">${selectedTour.price.toLocaleString()}</span>
                </div>

                {selectedRec?.journeyName && (
                  <h3 className="text-lg font-semibold text-cream mb-3">{selectedRec.journeyName}</h3>
                )}
                {selectedRec?.whyThisFits
                  ? <p className="text-sm text-cream/55 leading-relaxed mb-6 italic">{selectedRec.whyThisFits}</p>
                  : <p className="text-sm text-cream/55 leading-relaxed mb-6">{selectedTour.description}</p>
                }

                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 border border-cream/25 text-cream/80 font-medium px-6 py-2.5 rounded-xl hover:bg-cream hover:text-navy transition-all text-sm"
                >
                  Book Tour
                </Link>
              </div>
              <div className="shrink-0 border-t border-white/8 px-8 py-4">
                <ChatInput {...chatProps} placeholder="Who will be traveling on this journey?" />
              </div>
            </>
          )}

          {/* ── CHAT / RESULTS ── */}
          {hasConversation && !selectedTour && !leadCaptureMsg && (
            <>
              <div className="flex-1 overflow-y-auto">

                {/* Recommendations */}
                {resultTours && resultTours.length > 0 && !loading && (
                  <div key={tourKey} className="animate-slide-up">
                    <div className="px-8 pt-8 pb-5">
                      <p className="text-lg font-medium text-cream">
                        Hi {firstName}, here are some recommendations based on what you&apos;ve shared.
                      </p>
                    </div>
                    <div className="px-8 pb-8">
                      <div className="grid grid-cols-3 gap-5">
                        {resultTours.map(tour => (
                          <TourResultCard
                            key={tour.id}
                            tour={tour}
                            rec={activeRecs.find(r => r.tourId === tour.id)}
                            onView={id => { const t = tours.find(t => t.id === id); if (t) setSelectedTour(t) }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Q&A conversation */}
                {!resultTours && (
                  <div className="max-w-2xl mx-auto px-8 py-8 space-y-6">
                    {messages.map((msg, i) => {
                      const parsed = parseMsgContent(msg.content)
                      const isLastAssistant = msg.role === 'assistant' && i === messages.length - 1 && !loading
                      return (
                        <div key={i} className={`flex animate-slide-up ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          {msg.role === 'assistant' ? (
                            <div className="flex-1 max-w-lg">
                              <p className="text-sm text-cream/80 leading-relaxed">{parsed?.message ?? msg.content}</p>
                              {parsed?.type === 'question' && isLastAssistant && parsed.options && (
                                <div className="flex flex-wrap gap-2 mt-4">
                                  {(parsed.options as string[]).map((opt) => (
                                    <button
                                      key={opt}
                                      onClick={() => sendMessage(opt)}
                                      className="text-sm text-cream/50 border border-white/12 px-4 py-1.5 rounded-full hover:border-gold/50 hover:text-cream hover:bg-gold/5 transition-all"
                                    >
                                      {opt}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="max-w-sm bg-gold/10 border border-gold/15 rounded-2xl rounded-br-sm px-4 py-3 text-sm text-cream/80 leading-relaxed">
                              {msg.content}
                            </div>
                          )}
                        </div>
                      )
                    })}
                    {loading && (
                      <div className="flex gap-1.5 items-center pt-1 animate-fade-in">
                        {[0, 150, 300].map(d => (
                          <span key={d} className="w-1.5 h-1.5 bg-gold/40 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                        ))}
                      </div>
                    )}
                    <div ref={messagesEndRef} />
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
        {selectedTour && !leadCaptureMsg && (
          <aside className="w-95 border-l border-white/8 flex flex-col bg-slate shrink-0">
            <div className="flex items-center justify-between px-5 h-14 border-b border-white/8 shrink-0">
              <h3 className="font-semibold text-cream">Travel Plan</h3>
              <button className="flex items-center gap-1.5 text-sm text-cream/35 hover:text-cream/70 transition-colors">
                <IconBookmark /> Bookmark
              </button>
            </div>
            <DetailRightPanel tour={selectedTour} rec={selectedRec} />
          </aside>
        )}
      </div>
    </div>
  )
}
