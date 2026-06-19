'use client'

import { useRouter } from 'next/navigation'

const categories = ['Solo', 'Couples', 'Family', 'Adventure', 'Cultural']

interface Props {
  current?: string
  onChange?: (category: string) => void
}

export default function CategoriesSelect({ current, onChange }: Props) {
  const router = useRouter()

  const handleChange = (val: string) => {
    if (onChange) {
      onChange(val)
    } else {
      router.push(val ? `/stories?category=${encodeURIComponent(val)}` : '/stories')
    }
  }

  return (
    <div className="relative">
      <select
        value={current ?? ''}
        onChange={(e) => handleChange(e.target.value)}
        className="w-full appearance-none bg-navy border border-white/20 rounded-xl px-4 py-2.5 pr-9 text-white text-sm focus:outline-none focus:border-gold cursor-pointer"
      >
        <option value="" style={{ background: '#011627', color: '#ffffff' }}>
          All
        </option>
        {categories.map((c) => (
          <option key={c} value={c} style={{ background: '#011627', color: '#ffffff' }}>
            {c}
          </option>
        ))}
      </select>
      <svg
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  )
}
