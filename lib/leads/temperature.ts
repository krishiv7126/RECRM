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

/** Badge colours: hot = red, warm = amber, cold = blue, so they read apart at a glance. */
export const TEMPERATURE_STYLES: Record<DerivedTemperature, string> = {
  hot: 'border-red-300 bg-red-100 text-red-700 dark:border-red-500/40 dark:bg-red-500/15 dark:text-red-300',
  warm: 'border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-300',
  cold: 'border-sky-300 bg-sky-100 text-sky-700 dark:border-sky-500/40 dark:bg-sky-500/15 dark:text-sky-300',
}

/** Score-dial / bar colours matching TEMPERATURE_STYLES. */
export const TEMPERATURE_COLORS: Record<DerivedTemperature, string> = {
  hot: '#dc2626',
  warm: '#d97706',
  cold: '#0284c7',
}
