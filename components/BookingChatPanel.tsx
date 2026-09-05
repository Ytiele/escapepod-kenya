'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

interface BookingMessage {
  id: string
  message: string
  created_at: string
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

// One-way support log, not a live two-way chat: messages a traveler sends
// here are stored (GET /api/bookings/[reference]/messages) and emailed to
// the team (POST, same route) with reply-to set to the traveler's own
// address. The actual reply happens in their inbox, not back through this
// panel — see scripts/booking-messages-schema.sql for the full flow.
export default function BookingChatPanel({ reference }: { reference: string }) {
  const [messages, setMessages] = useState<BookingMessage[]>([])
  const [loaded, setLoaded] = useState(false)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`/api/bookings/${reference}/messages`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setMessages(Array.isArray(data.messages) ? data.messages : []))
      .catch(() => setError("Couldn't load your message history."))
      .finally(() => setLoaded(true))
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
      if (!res.ok) throw new Error(data.error || 'Could not send your message.')
      setMessages((prev) => [...prev, data.message])
      setInput('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send your message.')
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
        <span className="w-9 h-9 rounded-full bg-gold/15 border border-gold/30 flex items-center justify-center overflow-hidden shrink-0">
          <Image src="/images/png logo.png" alt="EscapePod" width={430} height={101} className="w-6 h-auto object-contain" />
        </span>
        <div className="min-w-0">
          <p className="text-navy font-semibold text-[14px] leading-tight">EscapePod Support</p>
          <p className="text-charcoal/45 text-[11px] leading-tight">We reply by email, usually within 24 hours</p>
        </div>
      </div>

      <div ref={listRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        <div className="self-start max-w-[85%] bg-navy/5 text-charcoal/70 text-[13px] leading-relaxed rounded-2xl rounded-bl-sm px-3.5 py-2.5">
          Send us a message about this booking and we&apos;ll get back to you by email — no need to wait here for a reply.
        </div>
        {loaded && messages.length === 0 && !error && (
          <p className="text-center text-[12px] text-charcoal/35 italic mt-2">No messages yet</p>
        )}
        {messages.map((m) => (
          <div key={m.id} className="self-end max-w-[85%] flex flex-col items-end gap-1">
            <div className="bg-gold/15 text-navy text-[13px] leading-relaxed rounded-2xl rounded-br-sm px-3.5 py-2.5 whitespace-pre-wrap">
              {m.message}
            </div>
            <span className="text-[10px] text-charcoal/35">{formatTimestamp(m.created_at)}</span>
          </div>
        ))}
      </div>

      {error && <p className="px-4 pb-2 text-[11px] text-red-600 shrink-0">{error}</p>}

      <div className="border-t border-navy/8 p-3 flex gap-2 shrink-0">
        <textarea
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about this booking…"
          className="flex-1 resize-none border border-navy/15 rounded-xl px-3 py-2 text-[13.5px] text-navy placeholder-navy/30 outline-none focus:border-gold/50 transition-colors max-h-24"
        />
        <button
          onClick={send}
          disabled={sending || !input.trim()}
          className="shrink-0 w-10 h-10 rounded-xl bg-gold text-navy flex items-center justify-center hover:bg-gold/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Send message"
        >
          <span aria-hidden>→</span>
        </button>
      </div>
    </aside>
  )
}
