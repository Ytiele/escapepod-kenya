export const metadata = {
  title: 'EscapePod Tour Engine',
  description: 'Tell us how you want to feel. We will orchestrate the rest.',
}

export default function EngineLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-navy">{children}</div>
}
