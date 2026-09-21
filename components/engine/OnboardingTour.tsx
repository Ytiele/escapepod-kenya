'use client'

import { useState } from 'react'
import { T } from '@/components/i18n/T'

// First-time walkthrough for the Curation Engine. Deliberately a
// self-contained, illustrated modal carousel rather than a coach-mark
// tour that highlights live DOM elements: the engine's real UI (chips,
// cards, compare view) only exists conditionally, after an AI response —
// there's nothing to point at on a first, empty visit. A fixed set of
// small mockups here stays accurate regardless of what state the engine
// is actually in, and can't break if a card's markup changes later.
//
// Persistence + the "how it works" replay entry point live in
// app/engine/page.tsx (localStorage 'ek_engine_tour_seen' + a sidebar
// button that reopens this with `open`).

const STEP_COUNT = 8

function MockChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center border border-navy/15 rounded-full px-3 py-1.5 text-[11px] text-navy/70 whitespace-nowrap">
      {children}
    </span>
  )
}

function MockBubble({ role, children }: { role: 'user' | 'assistant'; children: React.ReactNode }) {
  return (
    <div className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <span
        className={`inline-block max-w-[85%] rounded-2xl px-3.5 py-2 text-[12px] leading-snug ${
          role === 'user' ? 'bg-navy text-cream' : 'bg-navy/6 text-navy/80'
        }`}
      >
        {children}
      </span>
    </div>
  )
}

function MockExperienceCard({ compact }: { compact?: boolean }) {
  return (
    <div className={`rounded-xl border border-navy/10 bg-white overflow-hidden shrink-0 ${compact ? 'w-32' : 'w-full max-w-[220px]'}`}>
      <div className="h-14 bg-linear-to-br from-slate to-navy" />
      <div className="p-2.5 flex flex-col gap-1">
        <div className="h-2 w-4/5 rounded-full bg-navy/20" />
        <div className="h-1.5 w-2/5 rounded-full bg-navy/10" />
        <div className="mt-1 flex items-center justify-between">
          <span className="text-[9.5px] font-semibold text-gold">$2,450 pp</span>
          <span className="text-[9px] text-navy/40">4d</span>
        </div>
      </div>
    </div>
  )
}

interface Step {
  eyebrow: string
  title: string
  body: string
  visual: React.ReactNode
}

export default function OnboardingTour({ open, onFinish, onGoToBookings }: {
  open: boolean
  onFinish: () => void
  onGoToBookings: () => void
}) {
  const [step, setStep] = useState(0)

  if (!open) return null

  const steps: Step[] = [
    {
      eyebrow: 'Welcome',
      title: 'Welcome to the Curation Engine',
      body: 'Tell us what you want, in your own words — no forms, no filters. We search our verified inventory and build real, priced directions around it.',
      visual: (
        <div className="flex items-center justify-center h-24">
          <span className="w-14 h-14 rounded-full bg-gold/15 flex items-center justify-center text-gold text-2xl">✦</span>
        </div>
      ),
    },
    {
      eyebrow: 'Step 1',
      title: 'Start with a sentence — or a suggestion',
      body: "Describe the trip like you would to a friend: who's coming, roughly when, what you're after. Not sure where to start? Tap a suggested prompt to get going instantly.",
      visual: (
        <div className="flex flex-col gap-2 items-center py-2">
          <div className="flex flex-wrap gap-2 justify-center max-w-[280px]">
            <MockChip><T>A quiet coastal escape</T></MockChip>
            <MockChip><T>Family safari in August</T></MockChip>
            <MockChip><T>Compare beach vs. bush</T></MockChip>
          </div>
        </div>
      ),
    },
    {
      eyebrow: 'Step 2',
      title: "See real, priced options — not generic text",
      body: 'Every response includes actual verified experiences: destination, duration, price per person, and why we matched it to what you asked for.',
      visual: (
        <div className="flex justify-center py-1">
          <MockExperienceCard />
        </div>
      ),
    },
    {
      eyebrow: 'Step 3',
      title: 'Open any card for the full picture',
      body: "Tap a card to expand it — accommodation, day-by-day activities, and who it's ideal for, all in one place before you decide.",
      visual: (
        <div className="flex justify-center py-1">
          <div className="w-full max-w-[220px] rounded-xl border border-gold/40 bg-white overflow-hidden">
            <div className="h-14 bg-linear-to-br from-slate to-navy" />
            <div className="p-2.5 flex flex-col gap-1.5">
              <div className="h-2 w-4/5 rounded-full bg-navy/20" />
              <div className="flex items-center gap-1 text-[9.5px] font-medium text-gold">
                <T>View details</T> <span>▾</span>
              </div>
              <div className="mt-0.5 space-y-1 border-t border-navy/8 pt-1.5">
                <div className="h-1.5 w-full rounded-full bg-navy/8" />
                <div className="h-1.5 w-3/4 rounded-full bg-navy/8" />
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      eyebrow: 'Step 4',
      title: 'Ask to compare',
      body: 'Say something like "compare this with the other options" and we\'ll line up your current pick against alternatives, side by side, so the trade-offs are obvious.',
      visual: (
        <div className="flex items-center justify-center gap-2 py-1">
          <MockExperienceCard compact />
          <span className="text-[10px] font-bold text-navy/30">VS</span>
          <MockExperienceCard compact />
        </div>
      ),
    },
    {
      eyebrow: 'Step 5',
      title: 'Refine it — just by asking',
      body: 'Nothing is final. Say "make it shorter", "swap in the coast", or "keep it under $2,000pp" and we adjust the plan around your feedback.',
      visual: (
        <div className="flex flex-col gap-2 py-1 max-w-[260px] mx-auto">
          <MockBubble role="user"><T>Make it 5 days instead of 4</T></MockBubble>
          <MockBubble role="assistant"><T>Done — here's the adjusted plan.</T></MockBubble>
        </div>
      ),
    },
    {
      eyebrow: 'Step 6',
      title: 'Book This Journey — no payment yet',
      body: "When something's right, tap Book This Journey, choose your dates and traveler count, and send the request. A travel designer confirms availability and pricing within 24 hours — nothing is charged here.",
      visual: (
        <div className="flex justify-center py-2">
          <span className="bg-gold text-navy font-semibold text-[12px] px-5 py-2.5 rounded-full">
            <T>Book This Journey</T>
          </span>
        </div>
      ),
    },
    {
      eyebrow: 'Last step',
      title: 'Every request lives on My Bookings',
      body: "Once you've sent a request, it shows up on your My Bookings page with its reference, status, and payment progress — so you can always find your way back to it.",
      visual: (
        <div className="flex justify-center py-1">
          <div className="w-full max-w-[240px] rounded-xl border border-navy/10 bg-white p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold uppercase tracking-widest text-gold">EK-384046</span>
              <span className="text-[8.5px] font-semibold px-2 py-0.5 rounded-full bg-gold/15 text-gold"><T>Pending</T></span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-navy/8 overflow-hidden">
              <div className="h-full w-1/3 rounded-full bg-gold" />
            </div>
          </div>
        </div>
      ),
    },
  ]

  const current = steps[step]
  const isFirst = step === 0
  const isLast = step === STEP_COUNT - 1

  return (
    <div
      onClick={onFinish}
      className="fixed inset-0 z-99 bg-navy/50 flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-cream rounded-3xl shadow-lg p-6 flex flex-col gap-4"
      >
        <div className="flex items-center justify-between">
          <span className="text-gold text-[11px] font-medium tracking-[0.15em] uppercase"><T>{current.eyebrow}</T></span>
          <button onClick={onFinish} className="text-charcoal/40 hover:text-charcoal/70 text-xs font-medium transition-colors">
            <T>Skip tour</T>
          </button>
        </div>

        <div className="bg-navy/4 rounded-2xl">{current.visual}</div>

        <div>
          <h3 className="text-navy text-lg font-medium leading-tight"><T>{current.title}</T></h3>
          <p className="mt-2 text-charcoal/60 text-sm leading-relaxed"><T>{current.body}</T></p>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-1.5">
          {steps.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${i === step ? 'w-5 bg-gold' : 'w-1.5 bg-navy/15'}`}
            />
          ))}
        </div>

        {isLast ? (
          <div className="flex flex-col gap-2">
            <button
              onClick={onGoToBookings}
              className="w-full bg-gold text-navy font-semibold py-3 rounded-full text-sm hover:bg-gold/90 transition-colors"
            >
              <T>Go to My Bookings</T>
            </button>
            <button
              onClick={onFinish}
              className="w-full border border-navy/15 text-navy font-medium py-2.5 rounded-full text-sm hover:bg-navy/5 transition-colors"
            >
              <T>Start Curating</T>
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            {!isFirst && (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="flex-1 border border-navy/15 text-navy font-medium py-3 rounded-full text-sm hover:bg-navy/5 transition-colors"
              >
                <T>Back</T>
              </button>
            )}
            <button
              onClick={() => setStep((s) => s + 1)}
              className="flex-1 bg-gold text-navy font-semibold py-3 rounded-full text-sm hover:bg-gold/90 transition-colors"
            >
              <T>Next</T>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
