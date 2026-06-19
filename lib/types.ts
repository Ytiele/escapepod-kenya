export interface ItineraryDay {
  day: number
  title: string
  description: string
}

export interface Tour {
  id: string
  title: string
  location: string
  days: number
  price: number
  travelerType: string
  tags: string[]
  description: string
  itinerary: ItineraryDay[]
  image?: string
}

export interface JournalPost {
  slug: string
  title: string
  excerpt: string
  author: string
  date: string
  category: string
  readTime: string
  content: string
  image?: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  tourIds?: string[]
}

export interface RecommendationData {
  tourId: string
  label: 'Best Fit' | 'Alternative Luxury' | 'Stretch'
  journeyName: string
  whyThisFits: string
  accommodation: string
  signatureExperiences: string[]
  travelNotes: string[]
  whatToPack: string[]
  enhancements: string[]
}
