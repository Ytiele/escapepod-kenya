'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { T, useTranslated } from '@/components/i18n/T'

type Sender = 'traveler' | 'admin'

interface BookingMessage {
  id: string
  message: string
  sender: Sender
  created_at: string
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

// Poll interval for picking up an admin's reply — those arrive via a
// scheduled inbox check (app/api/admin/poll-inbox), not instantly, so
// there's no point polling faster than that job runs.
const POLL_INTERVAL_MS = 25_000

function SupportAvatar({ size = 'w-9 h-9' }: { size?: string }) {
  return (
    <span className={`${size} rounded-full bg-gold/15 border border-gold/30 flex items-center justify-center overflow-hidden shrink-0`}>
      <Image src="/images/png logo.png" alt="EscapePod" width={430} height={101} className="w-2/3 h-auto object-contain" />
    </span>
  )
}

// A traveler's own message is stored and emailed to the team (POST
// /api/bookings/[reference]/messages) with reply-to set to the traveler's
// own address. If an admin replies to that email, a scheduled job (see
// app/api/admin/poll-inbox/route.ts) matches the reply back to this
// booking by its reference number and stores it here with sender:
// 'admin' — that's what turns this into a real two-way thread instead of
// a one-way log, and why this panel polls for updates.
export default function BookingChatPanel({ reference }: { reference: string }) {
  const [messages, setMessages] = useState<BookingMessage[]>([])
  const [loaded, setLoaded] = useState(false)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const listRef = useRef<HTMLDivElement>(null)
  const loadErrorMsg = useTranslated("Couldn't load your message history.")
  const sendErrorMsg = useTranslated('Could not send your message.')
  const askPlaceholder = useTranslated('Ask about this booking…')
  const sendAriaLabel = useTranslated('Send message')

  useEffect(() => {
    fetch(`/api/bookings/${reference}/messages`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setMessages(Array.isArray(data.messages) ? data.messages : []))
      .catch(() => setError(loadErrorMsg))
      .finally(() => setLoaded(true))
  }, [reference, loadErrorMsg])

  // Background poll for admin replies. Only swaps state in when the
  // message count actually changed, so a background tick doesn't yank
  // the scroll position while someone's reading older messages.
  useEffect(() => {
    const interval = setInterval(() => {
      fetch(`/api/bookings/${reference}/messages`)
        .then((res) => (res.ok ? res.json() : Promise.reject()))
        .then((data) => {
          const next = Array.isArray(data.messages) ? data.messages : []
          setMessages((prev) => (next.length !== prev.length ? next : prev))
        })
        .catch(() => {})
    }, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [reference])

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  async function send() {
    const text = input.trim()
    if (!text || sending) return
    setSending(true)
    setError('')
    try {
      const res = await fetch(`/api/bookings/${reference}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || sendErrorMsg)
      setMessages((prev) => [...prev, data.message])
      setInput('')
    } catch (err) {
      setError(err instanceof Error ? err.message : sendErrorMsg)
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <aside className="bg-white rounded-3xl border border-navy/8 shadow-sm flex flex-col h-[440px] lg:h-[calc(100vh-8rem)] lg:sticky lg:top-6 overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-navy/8 shrink-0">
        <SupportAvatar />
        <div className="min-w-0">
          <p className="text-navy font-semibold text-[14px] leading-tight">EscapePod Support</p>
          <p className="text-charcoal/45 text-[11px] leading-tight"><T>Replies usually land within 24 hours</T></p>
        </div>
      </div>

      <div ref={listRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        <div className="self-start max-w-[85%] bg-navy/5 text-charcoal/70 text-[13px] leading-relaxed rounded-2xl rounded-bl-sm px-3.5 py-2.5">
          <T>Send us a message about this booking. We reply by email, and the reply shows up here too — no need to wait on this page.</T>
        </div>
        {loaded && messages.length === 0 && !error && (
          <p className="text-center text-[12px] text-charcoal/35 italic mt-2"><T>No messages yet</T></p>
        )}
        {messages.map((m) =>
          m.sender === 'admin' ? (
            <div key={m.id} className="self-start max-w-[85%] flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <SupportAvatar size="w-5 h-5" />
                <span className="text-[10.5px] font-semibold text-navy/60">EscapePod Support</span>
              </div>
              <div className="bg-navy/5 text-charcoal/80 text-[13px] leading-relaxed rounded-2xl rounded-tl-sm px-3.5 py-2.5 whitespace-pre-wrap">
                {m.message}
              </div>
              <span className="text-[10px] text-charcoal/35">{formatTimestamp(m.created_at)}</span>
            </div>
          ) : (
            <div key={m.id} className="self-end max-w-[85%] flex flex-col items-end gap-1">
              <div className="bg-gold/15 text-navy text-[13px] leading-relaxed rounded-2xl rounded-br-sm px-3.5 py-2.5 whitespace-pre-wrap">
                {m.message}
              </div>
              <span className="text-[10px] text-charcoal/35">{formatTimestamp(m.created_at)}</span>
            </div>
          )
        )}
      </div>

      {error && <p className="px-4 pb-2 text-[11px] text-red-600 shrink-0">{error}</p>}

      <div className="border-t border-navy/8 p-3 flex gap-2 shrink-0">
        <textarea
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={askPlaceholder}
          className="flex-1 resize-none border border-navy/15 rounded-xl px-3 py-2 text-[13.5px] text-navy placeholder-navy/30 outline-none focus:border-gold/50 transition-colors max-h-24"
        />
        <button
          onClick={send}
          disabled={sending || !input.trim()}
          className="shrink-0 w-10 h-10 rounded-xl bg-gold text-navy flex items-center justify-center hover:bg-gold/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label={sendAriaLabel}
        >
          <span aria-hidden>→</span>
        </button>
      </div>
    </aside>
  )
}
