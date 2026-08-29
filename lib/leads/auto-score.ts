import { createClient } from '@/lib/supabase/client'

// Module-scoped so the create-lead dialog and the leads table's background
// catch-up scan (both mount independently) never fire the paid Gemini call
// twice for the same lead in one session.
const scored = new Set<string>()

/**
 * Fires the same 'lead_score' AI Workspace call the Lead Intelligence page's
 * "Score" button uses, but in the background — the edge function itself
 * persists ai_score to the leads row. Callers don't need to await this to
 * keep the UI responsive; pass onScored to reflect the result without a
 * full page reload.
 */
export async function autoScoreLead(leadId: string, onScored?: (score: number) => void) {
  if (scored.has(leadId)) return
  scored.add(leadId)
  try {
    const supabase = createClient()
    const { data, error } = await supabase.functions.invoke('ai-workspace', {
      body: { type: 'lead_score', lead_id: leadId },
    })
    if (error || data?.error || !data?.output) return

    const scoreMatch = (data.output as string).match(/\d{1,3}/)
    const score = scoreMatch ? Math.min(100, Number.parseInt(scoreMatch[0], 10)) : null
    if (score !== null) onScored?.(score)
  } catch {
    // Best-effort — an unscored lead just falls back to "—" in the UI.
  }
}
