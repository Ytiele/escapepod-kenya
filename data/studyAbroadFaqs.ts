// Plain data, deliberately kept out of components/study-abroad/FAQAccordion.tsx
// (a 'use client' module) — a Server Component importing a named export from
// a client module gets back an opaque client reference, not the real value,
// so app/(site)/study-abroad/page.tsx couldn't build its FAQPage JSON-LD from
// it. Both the accordion and the page import this shared, server-safe file
// instead.
export interface QA {
  question: string
  answer: string
}

export const studyAbroadFaqs: QA[] = [
  {
    question: 'How long are the programs?',
    answer:
      'Most of our faculty-led study abroad programs range from 1 to 4 weeks, depending on your course objectives and academic calendar. We work with you to design a schedule that balances learning, exploration, and engagement.',
  },
  {
    question: 'Can Escape Pod support graduate-level content?',
    answer:
      'Yes. We have experience supporting both undergraduate and graduate-level programs, including professional and executive education. We tailor the depth of engagement, site visits, and facilitators to suit your academic goals.',
  },
  {
    question: 'What are your safety protocols?',
    answer:
      'Safety is central to everything we do. We conduct thorough risk assessments, provide pre-arrival safety briefings, maintain 24/7 local support, and work only with vetted partners for transport, accommodation, and activities. Emergency protocols are built into every itinerary.',
  },
  {
    question: 'Can you accommodate dietary restrictions or accessibility needs?',
    answer:
      'Yes. We cater to a wide range of dietary requirements including vegetarian, vegan, halal, gluten-free, and allergy-sensitive meals. We also accommodate accessibility needs wherever possible and advise on suitable destinations and accommodations during the planning phase.',
  },
  {
    question: 'Do you assist with visas and pre-departure prep?',
    answer:
      "Yes. We provide pre-departure orientation materials, packing lists, travel tips, and visa guidance tailored to the countries involved. While we don't process visas directly, we help ensure all documentation is in order ahead of time.",
  },
]
