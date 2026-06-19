'use client'

import Link from 'next/link'
import { useState } from 'react'
import { posts } from '@/data/mock'
import CategoriesSelect from '@/components/stories/CategoriesSelect'

const gradients = [
  'from-slate to-navy',
  'from-navy to-[#0a2040]',
  'from-[#0a2040] via-navy to-navy',
  'from-navy via-[#0a2040] to-navy',
]

export default function StoriesPage() {
  const [featured, ...allRest] = posts
  const [categoryFilter, setCategoryFilter] = useState('')
  const [displayedCount, setDisplayedCount] = useState(6)

  const rest = categoryFilter
    ? allRest.filter((p) => p.category?.toLowerCase() === categoryFilter.toLowerCase())
    : allRest

  const displayedPosts = rest.slice(0, displayedCount)
  const hasMore = displayedCount < rest.length

  const handleCategoryChange = (cat: string) => {
    setCategoryFilter(cat)
    setDisplayedCount(6)
  }

  const handleLoadMore = () => setDisplayedCount((n) => n + 6)

  return (
    <>
      <section
        className="relative bg-cover bg-center min-h-[55vh] flex items-end pb-16 pt-40 overflow-hidden"
        style={{
          backgroundImage: `url('${encodeURI('/images/hot ballon.jpg')}')`,
        }}
      >
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10 w-full">
          <span className="text-gold text-xs font-medium tracking-[0.2em] uppercase">The Journals</span>
          <h1 className="mt-4 text-cream text-5xl md:text-6xl font-medium leading-[1.1] tracking-tight max-w-2xl">
            Stories from the edge of Kenya.
          </h1>
        </div>
      </section>

      {/* Featured article — half-screen hero card */}
      <section className="bg-cream pt-12 pb-0">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <Link
            href={`/stories/${featured.slug}`}
            className="group relative flex items-end rounded-3xl overflow-hidden mb-16"
            style={{ minHeight: '50vh' }}
          >
            {/* Background — sunset image, anchored to bottom */}
            <div
              className="absolute inset-0 bg-cover bg-bottom"
              style={{ backgroundImage: `url('${encodeURI(featured.image ?? '/images/lamu-sunset.jpg')}')` }}
            />
            {/* Layered gradient overlays for depth */}
            <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/30 to-transparent" />
            <div className="absolute inset-0 bg-linear-to-r from-black/40 to-transparent" />

            {/* Featured badge */}
            <div className="absolute top-6 left-6">
              <span className="bg-gold text-navy text-xs font-medium px-3 py-1.5 rounded-full tracking-wide uppercase">
                Featured
              </span>
            </div>

            {/* Read time badge */}
            <div className="absolute top-6 right-6">
              <span className="bg-cream/10 border border-cream/20 text-cream/70 text-xs px-3 py-1.5 rounded-full backdrop-blur-sm">
                {featured.readTime}
              </span>
            </div>

            {/* Content overlaid at bottom */}
            <div className="relative z-10 p-8 lg:p-14 w-full max-w-3xl">
              <div className="flex items-center gap-3 mb-4">
                {featured.category && (
                  <span className="text-gold text-xs font-medium tracking-widest uppercase">
                    {featured.category}
                  </span>
                )}
                <span className="text-cream/30">·</span>
                <span className="text-cream/50 text-xs">{featured.author}</span>
                <span className="text-cream/30">·</span>
                <span className="text-cream/50 text-xs">{featured.date}</span>
              </div>

              <h2 className="text-cream text-4xl md:text-5xl lg:text-6xl font-medium leading-[1.1] tracking-tight mb-5 group-hover:text-gold transition-colors duration-300">
                {featured.title}
              </h2>

              <p className="text-cream/70 text-base md:text-lg leading-relaxed mb-8 max-w-2xl">
                {featured.excerpt}
              </p>

              <div className="inline-flex items-center gap-3 bg-gold text-navy font-medium px-6 py-3 rounded-full text-sm group-hover:bg-gold/90 transition-colors">
                Read the account
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>
          </Link>

          <div className="pb-16">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-10 items-start">

              {/* Stories grid */}
              <div>
                <h3 className="text-navy text-sm font-medium tracking-widest uppercase mb-8">
                  Recent Stories
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {displayedPosts.map((post, i) => (
                    <Link
                      key={post.slug}
                      href={`/stories/${post.slug}`}
                      className="group rounded-2xl overflow-hidden border border-navy/10 hover:border-navy/30 transition-all"
                    >
                      <div
                        className={`relative h-52 ${post.image ? '' : `bg-linear-to-br ${gradients[(i + 1) % gradients.length]}`}`}
                        style={
                          post.image
                            ? {
                                backgroundImage: `url('${encodeURI(post.image)}')`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                              }
                            : undefined
                        }
                      >
                        <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent" />
                        {post.category && (
                          <div className="absolute top-3 left-3">
                            <span className="bg-gold/20 text-gold text-xs px-3 py-1 rounded-full font-medium">
                              {post.category}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="p-5 bg-cream">
                        <div className="flex items-center gap-2 mb-2 text-xs text-charcoal/50">
                          <span>{post.author}</span>
                          <span>·</span>
                          <span>{post.date}</span>
                        </div>
                        <h3 className="text-navy font-medium text-lg leading-tight mb-2 group-hover:text-gold transition-colors line-clamp-2">
                          {post.title}
                        </h3>
                        <p className="text-charcoal/60 text-sm leading-relaxed line-clamp-2">
                          {post.excerpt}
                        </p>
                        <p className="text-gold text-xs font-medium mt-3">{post.readTime}</p>
                      </div>
                    </Link>
                  ))}
                </div>

                <div className="text-center mt-12">
                  <button
                    type="button"
                    onClick={hasMore ? handleLoadMore : undefined}
                    disabled={!hasMore}
                    className="border border-navy/20 text-navy font-medium px-8 py-3 rounded-full text-sm hover:border-navy hover:bg-navy/5 transition-all disabled:opacity-40 disabled:cursor-default"
                  >
                    Load More
                  </button>
                </div>
              </div>

              {/* Sidebar */}
              <aside className="space-y-6 lg:sticky lg:top-24">
                {/* Categories */}
                <div className="bg-navy rounded-2xl p-6">
                  <h4 className="text-cream text-sm font-medium uppercase tracking-wider mb-4">
                    Categories
                  </h4>
                  <CategoriesSelect current={categoryFilter || undefined} onChange={handleCategoryChange} />
                </div>

                {/* Latest Posts */}
                <div className="bg-navy rounded-2xl p-6">
                  <h4 className="text-cream text-sm font-medium uppercase tracking-wider mb-5">
                    Latest Posts
                  </h4>
                  <div className="space-y-4">
                    {posts.slice(0, 4).map((p) => (
                      <Link key={p.slug} href={`/stories/${p.slug}`} className="group flex gap-3">
                        <div
                          className="shrink-0 w-14 h-14 rounded-xl bg-linear-to-br from-slate to-navy"
                          style={
                            p.image
                              ? {
                                  backgroundImage: `url('${encodeURI(p.image)}')`,
                                  backgroundSize: 'cover',
                                  backgroundPosition: 'center',
                                }
                              : undefined
                          }
                        />
                        <div>
                          {p.category && (
                            <span className="text-gold text-xs font-medium">{p.category}</span>
                          )}
                          <p className="text-cream/80 text-sm font-medium leading-tight mt-0.5 group-hover:text-gold transition-colors line-clamp-2">
                            {p.title}
                          </p>
                          <p className="text-cream/40 text-xs mt-1">{p.date}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Newsletter */}
                <div className="bg-gold/10 border border-gold/30 rounded-2xl p-6">
                  <h4 className="text-navy text-sm font-medium uppercase tracking-wider mb-3">
                    Subscribe to Newsletter
                  </h4>
                  <p className="text-charcoal/60 text-xs mb-4 leading-relaxed">
                    Rare destinations and unreleased itineraries, delivered elegantly.
                  </p>
                  <input
                    type="email"
                    placeholder="Your email"
                    className="w-full bg-cream border border-navy/10 rounded-xl px-4 py-2.5 text-navy text-sm focus:outline-none focus:border-gold mb-3"
                  />
                  <button
                    type="button"
                    className="w-full bg-navy text-cream font-medium py-2.5 rounded-xl text-sm hover:bg-navy/80 transition-colors"
                  >
                    Subscribe
                  </button>
                </div>
              </aside>

            </div>
          </div>
        </div>
      </section>
    </>
  )
}
