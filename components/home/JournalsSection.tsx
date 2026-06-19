'use client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import type { JournalPost } from '@/lib/types'
import { stagger, fromLeft, fromRight, slideUp, scaleFade, viewport } from '@/lib/motion'

interface Props {
  posts: JournalPost[]
}

const journalImages = [
  '/images/journals/lamu.jpg',
  '/images/journals/mara.jpg',
  '/images/journals/samburu.jpg',
]

export default function JournalsSection({ posts }: Props) {
  return (
    <section className="bg-cream py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">

        {/* Header — label from left, link from right */}
        <motion.div
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
        >
          <div>
            <motion.span variants={fromLeft} className="text-gold text-xs font-medium tracking-[0.2em] uppercase">
              The Journals
            </motion.span>
            <motion.h2 variants={slideUp} className="mt-4 text-navy text-4xl md:text-5xl font-medium tracking-tight leading-[1.1]">
              Immersive stories from<br className="hidden md:block" /> the edge of Kenya.
            </motion.h2>
          </div>
          <motion.div variants={fromRight}>
            <Link
              href="/stories"
              className="text-sm font-medium text-gold flex items-center gap-2 hover:gap-3 transition-all group shrink-0"
            >
              Read all stories
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </motion.div>
        </motion.div>

        {/* Cards — stagger with scale */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {posts.map((post, i) => (
            <motion.div
              key={post.slug}
              initial={{ opacity: 0, y: 36, scale: 0.97 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] as [number, number, number, number], delay: i * 0.14 }}
            >
              <Link
                href={`/stories/${post.slug}`}
                className="group relative rounded-2xl overflow-hidden aspect-3/4 flex flex-col justify-end cursor-pointer"
                style={{
                  backgroundImage: `url('${journalImages[i % journalImages.length]}')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/20 to-transparent" />
                <div className="relative z-10 p-6 space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-cream/60">{post.author}</span>
                    <span className="text-cream/30">·</span>
                    <span className="text-xs text-cream/60">{post.date}</span>
                    {post.category && (
                      <>
                        <span className="text-cream/30">·</span>
                        <span className="text-xs font-medium text-gold">{post.category}</span>
                      </>
                    )}
                  </div>
                  <h3 className="text-cream text-xl font-medium leading-tight group-hover:text-gold transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-cream/60 text-sm line-clamp-2 leading-relaxed">
                    {post.excerpt}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.p
          className="text-center text-charcoal/50 text-sm mt-10"
          variants={scaleFade}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
        >
          Read the accounts or{' '}
          <Link href="/engine" className="text-gold underline underline-offset-4 hover:text-navy transition-colors">
            build them into your own journey.
          </Link>
        </motion.p>

      </div>
    </section>
  )
}
