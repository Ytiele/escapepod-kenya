// Quick end-to-end smoke test for /api/curate.
// Requires: dev server running (npm run dev) and SUPABASE_URL /
// SUPABASE_SERVICE_ROLE_KEY set in .env.local, with the tables from
// scripts/curate-schema.sql created in that project.
//
// Run: node scripts/test-curate.mjs

const BASE_URL = process.env.CURATE_BASE_URL || 'http://localhost:3000'

async function send(messages, travelerId) {
  const res = await fetch(`${BASE_URL}/api/curate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, travelerId }),
  })
  const body = await res.json().catch(() => ({}))
  console.log(`\n--- HTTP ${res.status} ---`)
  console.log(JSON.stringify(body, null, 2))
  return body
}

async function main() {
  console.log('Turn 1: opening message')
  const first = await send([
    { role: 'user', content: 'I want a 5 day romantic coastal trip, mid-range budget.' },
  ])

  if (!first.travelerId) {
    console.log('\nNo travelerId returned — stopping (check the error above, likely Supabase config).')
    return
  }

  console.log('\nTurn 2: follow-up in the same session')
  await send(
    [
      { role: 'user', content: 'I want a 5 day romantic coastal trip, mid-range budget.' },
      { role: 'assistant', content: first.text },
      { role: 'user', content: 'Show me some options.' },
    ],
    first.travelerId
  )
}

main().catch((err) => {
  console.error('Test script failed:', err)
  process.exit(1)
})
