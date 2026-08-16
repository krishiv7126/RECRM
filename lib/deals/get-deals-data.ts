import { createClient } from '@/lib/supabase/server'

export async function getDealsData() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('deals')
    .select(
      '*, customer:customers(full_name), property:properties(title), owner:platform_users!deals_owner_id_fkey(full_name)',
    )
    .order('created_at', { ascending: false })

  return data ?? []
}

export async function getDealFormOptions() {
  const supabase = await createClient()
  const [{ data: customers }, { data: properties }] = await Promise.all([
    supabase.from('customers').select('id, full_name').order('full_name'),
    supabase.from('properties').select('id, title').order('title'),
  ])

  return { customers: customers ?? [], properties: properties ?? [] }
}

export type DealWithRelations = Awaited<ReturnType<typeof getDealsData>>[number]
