import type { Database } from '@/lib/supabase/types'

type LeadStage = Database['public']['Enums']['lead_stage']

/** Display names for lead stages. The `won` stage is shown as "Booked". */
export const LEAD_STAGE_LABELS: Record<LeadStage, string> = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  proposal: 'Proposal',
  site_visit: 'Site Visit',
  re_visit: 'Re-visit',
  won: 'Booked',
  lost: 'Closed',
  archive: 'Archived',
}

/** Stages a user can pick. `archive` still exists in the enum but is no longer offered. */
export const SELECTABLE_LEAD_STAGES = ['new', 'contacted', 'qualified', 'proposal', 'site_visit', 're_visit', 'won', 'lost'] as const satisfies readonly LeadStage[]

export const LEAD_CATEGORIES = [
  { value: 'ready_to_move', label: 'Ready to move' },
  { value: 'under_construction', label: 'Under construction' },
] as const

export type LeadCategory = (typeof LEAD_CATEGORIES)[number]['value']

export function leadCategoryLabel(value: string | null | undefined) {
  return LEAD_CATEGORIES.find((c) => c.value === value)?.label ?? null
}
