import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { posts } from '@/data/mock'
import CategoriesSelect from '@/components/stories/CategoriesSelect'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = posts.find((p) => p.slug === slug)
  if (!post) return {}
  return {
    title: post.title,
    description: post.excerpt,
  }
}

export default async function StoryPage({ params }: Props) {
  const { slug } = await params
  const post = posts.find((p) => p.slug === slug)
  if (!post) notFound()

  const related = posts.filter((p) => p.slug !== slug).slice(0, 3)

  return (
    <>
      <article className="bg-cream">
        <section
          className="relative min-h-[60vh] flex items-end pb-16 pt-40 overflow-hidden"
          style={
            post.image
              ? { backgroundImage: `url('${post.image}')`, backgroundSize: 'cover', backgroundPosition: 'bottom' }
              : undefined
          }
        >
          {post.image ? (
            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/50 to-black/30" />
          ) : (
            <>
              <div className="absolute inset-0 bg-navy" />
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: `radial-gradient(ellipse at 40% 50%, #3C1101 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, #F2A755 0%, transparent 50%)`,
                }}
              />
            </>
          )}
          <div className="relative z-10 max-w-4xl mx-auto px-6 lg:px-10 w-full">
            <div className="flex items-center gap-4 mb-5">
              <Link href="/stories" className="text-cream/50 hover:text-cream text-sm flex items-center gap-1.5 transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                The Journals
              </Link>
              {post.category && (
                <>
                  <span className="text-cream/20">/</span>
                  <span className="bg-gold/20 text-gold text-xs px-3 py-1 rounded-full font-medium">
                    {post.category}
                  </span>
                </>
              )}
            </div>
            <h1 className="text-cream text-4xl md:text-5xl lg:text-6xl font-medium leading-[1.1] tracking-tight">
              {post.title}
            </h1>
            <div className="mt-6 flex items-center gap-4 text-sm text-cream/50">
              <span className="font-medium text-cream/70">{post.author}</span>
              <span>·</span>
              <span>{post.date}</span>
              <span>·</span>
              <span>{post.readTime}</span>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-16">
            <div
              className="prose prose-lg prose-navy max-w-none text-charcoal/80 leading-relaxed"
              style={{ lineHeight: '1.85' }}
            >
              {post.content.trim().split('\n\n').map((para, i) => {
                if (para.startsWith('**') && para.endsWith('**')) {
                  return (
                    <h3 key={i} className="text-navy font-medium text-xl mt-10 mb-4">
                      {para.replace(/\*\*/g, '')}
                    </h3>
                  )
                }
                return (
                  <p key={i} className="mb-6 text-charcoal/70 leading-relaxed">
                    {para}
                  </p>
                )
              })}

              <div className="mt-12 pt-8 border-t border-navy/10">
                <Link
                  href="/engine"
                  className="inline-flex items-center gap-3 bg-gold text-navy font-medium px-7 py-3.5 rounded-full text-sm hover:bg-gold/90 transition-colors"
                >
                  Curate a similar journey
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            </div>

            <aside className="space-y-8">
              <div className="bg-navy rounded-2xl p-6">
                <h4 className="text-cream text-sm font-medium uppercase tracking-wider mb-4">
                  Categories
                </h4>
                <CategoriesSelect current={post.category} />
              </div>

              <div className="bg-navy rounded-2xl p-6">
                <h4 className="text-cream text-sm font-medium uppercase tracking-wider mb-5">
                  Latest Posts
                </h4>
                <div className="space-y-4">
                  {related.map((rel) => (
                    <Link
                      key={rel.slug}
                      href={`/stories/${rel.slug}`}
                      className="group flex gap-3"
                    >
                      <div
                          className="shrink-0 w-14 h-14 rounded-xl bg-linear-to-br from-slate to-navy"
                          style={
                            rel.image
                              ? {
                                  backgroundImage: `url('${encodeURI(rel.image)}')`,
                                  backgroundSize: 'cover',
                                  backgroundPosition: 'center',
                                }
                              : undefined
                          }
                        />
                      <div>
                        {rel.category && (
                          <span className="text-gold text-xs font-medium">{rel.category}</span>
                        )}
                        <p className="text-cream/80 text-sm font-medium leading-tight mt-0.5 group-hover:text-gold transition-colors line-clamp-2">
                          {rel.title}
                        </p>
                        <p className="text-cream/40 text-xs mt-1">{rel.date}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

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
      </article>

      <section className="bg-sand py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <h3 className="text-navy text-sm font-medium tracking-widest uppercase mb-8">
            Related Posts
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {related.map((rel) => (
              <Link
                key={rel.slug}
                href={`/stories/${rel.slug}`}
                className="group flex flex-col rounded-2xl overflow-hidden border border-navy/10 hover:border-navy/30 transition-all"
              >
                <div
                  className="h-44 bg-linear-to-br from-slate to-navy relative shrink-0"
                  style={
                    rel.image
                      ? {
                          backgroundImage: `url('${encodeURI(rel.image)}')`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                        }
                      : undefined
                  }
                >
                  <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent" />
                  {rel.category && (
                    <span className="absolute top-3 left-3 bg-gold/20 text-gold text-xs px-3 py-1 rounded-full font-medium">
                      {rel.category}
                    </span>
                  )}
                </div>
                <div className="flex-1 p-5 bg-cream">
                  <p className="text-charcoal/50 text-xs mb-2">{rel.author} · {rel.date}</p>
                  <h4 className="text-navy font-medium leading-tight group-hover:text-gold transition-colors line-clamp-2">
                    {rel.title}
                  </h4>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
