import { createClient } from '@/lib/supabase/server'

export async function getSiteVisitsData() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('site_visits')
    .select(
      '*, lead:leads(full_name), customer:customers(full_name), property:properties(title, address, city), owner:platform_users!site_visits_owner_id_fkey(full_name)',
    )
    .order('scheduled_at', { ascending: true })

  return data ?? []
}

export async function getSiteVisitFormOptions() {
  const supabase = await createClient()
  const [{ data: leads }, { data: customers }, { data: properties }, { data: owners }] = await Promise.all([
    supabase.from('leads').select('id, full_name').order('full_name'),
    supabase.from('customers').select('id, full_name').order('full_name'),
    supabase.from('properties').select('id, title').order('title'),
    supabase.from('platform_users').select('id, full_name').order('full_name'),
  ])

  return {
    leads: leads ?? [],
    customers: customers ?? [],
    properties: properties ?? [],
    owners: owners ?? [],
  }
}

export type SiteVisitWithRelations = Awaited<ReturnType<typeof getSiteVisitsData>>[number]
