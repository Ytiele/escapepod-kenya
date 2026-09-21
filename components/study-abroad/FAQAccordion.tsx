'use client'

import { useState } from 'react'
import { T } from '@/components/i18n/T'
import { studyAbroadFaqs as faqs } from '@/data/studyAbroadFaqs'

export default function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <div className="max-w-3xl mx-auto divide-y divide-navy/10 border-t border-b border-navy/10">
      {faqs.map((faq, i) => {
        const open = openIndex === i
        return (
          <div key={faq.question}>
            <button
              type="button"
              onClick={() => setOpenIndex(open ? null : i)}
              className="w-full flex items-center justify-between gap-4 py-5 text-left"
              aria-expanded={open}
            >
              <span className="text-navy font-medium text-base"><T>{faq.question}</T></span>
              <svg
                className={`w-4 h-4 text-gold shrink-0 transition-transform ${open ? 'rotate-45' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>
            {open && (
              <p className="pb-5 -mt-1 text-charcoal/60 text-sm leading-relaxed max-w-2xl">
                <T>{faq.answer}</T>
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
