import { createClient } from '@/lib/supabase/server'

export async function getLeadsData() {
  const supabase = await createClient()
  const [{ data }, { data: followUps }, { data: visits }] = await Promise.all([
    supabase
      .from('leads')
      .select('*, owner:platform_users!leads_owner_id_fkey(full_name)')
      .order('created_at', { ascending: false }),
    supabase.from('follow_ups').select('lead_id').eq('status', 'pending').not('lead_id', 'is', null),
    supabase.from('site_visits').select('lead_id').eq('status', 'scheduled').not('lead_id', 'is', null),
  ])

  // A lead is "pending" while it has an open follow-up or a scheduled visit.
  const pendingIds = new Set([...(followUps ?? []), ...(visits ?? [])].map((r) => r.lead_id as string))
  return (data ?? []).map((l) => ({ ...l, has_pending: pendingIds.has(l.id) }))
}

export async function getLeadById(id: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('leads')
    .select('*, owner:platform_users!leads_owner_id_fkey(full_name)')
    .eq('id', id)
    .single()

  return data
}

export type LeadWithOwner = NonNullable<Awaited<ReturnType<typeof getLeadById>>>
