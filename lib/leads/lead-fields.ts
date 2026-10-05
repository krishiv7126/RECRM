import type { Database } from '@/lib/supabase/types'

type LeadStage = Database['public']['Enums']['lead_stage']

/** Display names for lead stages. The `won` stage is shown as "Booked". */
export const LEAD_STAGE_LABELS: Record<LeadStage, string> = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  proposal: 'Proposal',
  site_visit: 'Site Visit',
  won: 'Booked',
  lost: 'Lost',
  archive: 'Archived',
}

export const LEAD_CATEGORIES = [
  { value: 'ready_to_move', label: 'Ready to move' },
  { value: 'under_construction', label: 'Under construction' },
] as const

export type LeadCategory = (typeof LEAD_CATEGORIES)[number]['value']

export function leadCategoryLabel(value: string | null | undefined) {
  return LEAD_CATEGORIES.find((c) => c.value === value)?.label ?? null
}
