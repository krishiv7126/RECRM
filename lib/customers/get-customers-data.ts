import { createClient } from '@/lib/supabase/server'

export async function getCustomersData() {
  const supabase = await createClient()
  const { data: customers } = await supabase
    .from('customers')
    .select('*, owner:platform_users!customers_owner_id_fkey(full_name)')
    .order('created_at', { ascending: false })

  const { data: deals } = await supabase.from('deals').select('customer_id, stage')
  const openDealCounts = new Map<string, number>()
  for (const d of deals ?? []) {
    if (!d.customer_id || d.stage === 'booked' || d.stage === 'lost') continue
    openDealCounts.set(d.customer_id, (openDealCounts.get(d.customer_id) ?? 0) + 1)
  }

  return (customers ?? []).map((c) => ({ ...c, open_deals: openDealCounts.get(c.id) ?? 0 }))
}

export async function getCustomerById(id: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('customers')
    .select('*, owner:platform_users!customers_owner_id_fkey(full_name)')
    .eq('id', id)
    .single()
  return data
}

export type CustomerWithOwner = NonNullable<Awaited<ReturnType<typeof getCustomerById>>>
