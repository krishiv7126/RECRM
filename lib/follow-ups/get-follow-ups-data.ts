import { createClient } from '@/lib/supabase/server'

export async function getFollowUpsData() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('follow_ups')
    .select(
      '*, lead:leads(full_name), customer:customers(full_name), deal:deals(code, title), owner:platform_users!follow_ups_owner_id_fkey(full_name)',
    )
    .order('due_at', { ascending: true })

  return data ?? []
}

export async function getFollowUpFormOptions() {
  const supabase = await createClient()
  const [{ data: leads }, { data: customers }, { data: deals }, { data: owners }] = await Promise.all([
    supabase.from('leads').select('id, full_name').order('full_name'),
    supabase.from('customers').select('id, full_name').order('full_name'),
    supabase.from('deals').select('id, code, title').order('code'),
    supabase.from('platform_users').select('id, full_name').order('full_name'),
  ])

  return {
    leads: leads ?? [],
    customers: customers ?? [],
    deals: deals ?? [],
    owners: owners ?? [],
  }
}

export type FollowUpWithRelations = Awaited<ReturnType<typeof getFollowUpsData>>[number]
