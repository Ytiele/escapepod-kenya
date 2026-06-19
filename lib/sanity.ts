import { createClient } from '@sanity/client'

export const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'placeholder',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: true,
  token: process.env.SANITY_API_TOKEN,
})

export async function getSanityPosts() {
  if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID) return []
  try {
    return await sanityClient.fetch(`
      *[_type == "post"] | order(publishedAt desc) {
        "slug": slug.current,
        title,
        excerpt,
        "author": author->name,
        "date": publishedAt,
        category,
        readTime,
        body
      }
    `)
  } catch {
    return []
  }
}
