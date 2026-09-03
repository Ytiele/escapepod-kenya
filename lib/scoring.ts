type Vector = Record<string, number>;

const DNA_KEYS = [
  'adventure', 'nature', 'culture', 'history', 'food', 'photography',
  'relaxation', 'romance', 'social', 'wellness', 'luxury',
];

function cosineSimilarity(a: Vector, b: Vector): number {
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (const key of DNA_KEYS) {
    const av = a[key] ?? 0;
    const bv = b[key] ?? 0;
    dot += av * bv;
    magA += av * av;
    magB += bv * bv;
  }
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

/**
 * Blends explicit-preference match against the persona prior.
 * confidence: 0-1, how sure we are about the traveler's explicit preferences.
 * At confidence 0 (brand new traveler), the persona prior carries the score.
 * At confidence 1 (traveler has stated a lot), explicit DNA match dominates.
 */
export function scoreExperiences(
  experiences: any[],
  travelerPreferences: Vector,
  persona: string | undefined,
  confidence: number
) {
  const c = Math.max(0, Math.min(1, confidence));
  return experiences
    .map((exp) => {
      const dnaScore = cosineSimilarity(travelerPreferences, exp.experience_dna ?? {});
      const personaScore = persona ? (exp.persona_fit?.[persona] ?? 0.5) : 0.5;
      const blended = dnaScore * c + personaScore * (1 - c);
      return { ...exp, match_score: Math.round(blended * 100) };
    })
    .sort((a, b) => b.match_score - a.match_score);
}

/**
 * Takes a score-sorted list and picks `count` results that span different
 * destinations first, so Claude isn't handed five near-duplicate options.
 */
export function diversify(scored: any[], count: number) {
  const picked: any[] = [];
  const usedDestinations = new Set<string>();

  for (const exp of scored) {
    if (picked.length >= count) break;
    if (!usedDestinations.has(exp.destination)) {
      picked.push(exp);
      usedDestinations.add(exp.destination);
    }
  }
  for (const exp of scored) {
    if (picked.length >= count) break;
    if (!picked.includes(exp)) picked.push(exp);
  }
  return picked;
}
