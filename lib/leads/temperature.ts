/**
 * "Temperature" used to be a manually-set hot/warm/cold field. It's now
 * derived from the AI score instead — one less thing for sales staff to
 * keep updated by hand, and it moves automatically as the score does.
 */
export type DerivedTemperature = 'hot' | 'warm' | 'cold'

const HOT_THRESHOLD = 80
const WARM_THRESHOLD = 50

export function deriveTemperature(aiScore: number | null): DerivedTemperature | null {
  if (aiScore === null) return null
  if (aiScore >= HOT_THRESHOLD) return 'hot'
  if (aiScore >= WARM_THRESHOLD) return 'warm'
  return 'cold'
}
