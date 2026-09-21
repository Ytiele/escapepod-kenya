'use client'

import { useState } from 'react'

// Click-to-play facade rather than an always-loaded <iframe> — YouTube's
// embed pulls in a meaningful chunk of JS/trackers on every page load
// even before playback starts. Showing just the thumbnail (i.ytimg.com,
// allowed in next.config.ts's img-src) until the traveler actually clicks
// keeps this page as light as every other one, and only requests
// youtube-nocookie.com (frame-src) once they've opted in.
export default function YouTubeEmbed({
  videoId,
  title,
  className,
}: {
  videoId: string
  title: string
  className?: string
}) {
  const [playing, setPlaying] = useState(false)

  if (playing) {
    return (
      <div className={className}>
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      aria-label={title}
      className={`group relative w-full h-full block cursor-pointer ${className ?? ''}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- a remote
          thumbnail only ever shown once per page, not worth Next/Image's
          optimization pipeline or a remotePatterns entry for one host */}
      <img
        src={`https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`}
        alt={title}
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-navy/25 group-hover:bg-navy/35 transition-colors" />
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="w-16 h-16 rounded-full bg-gold/95 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
          <svg className="w-6 h-6 text-navy translate-x-0.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
      </span>
    </button>
  )
}
