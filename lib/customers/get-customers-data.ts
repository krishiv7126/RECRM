import { createClient } from '@/lib/supabase/server'

export async function getCustomersData() {
  const supabase = await createClient()
  const { data: customers } = await supabase
    .from('customers')
    .select('*, owner:platform_users!customers_owner_id_fkey(full_name)')
    .order('created_at', { ascending: false })

  const { data: deals } = await supabase
    .from('deals')
    .select('customer_id, stage, closed_at, updated_at, owner:platform_users!deals_owner_id_fkey(full_name)')
  const openDealCounts = new Map<string, number>()
  for (const d of deals ?? []) {
    if (!d.customer_id || d.stage === 'booked' || d.stage === 'lost') continue
    openDealCounts.set(d.customer_id, (openDealCounts.get(d.customer_id) ?? 0) + 1)
  }
  const bookedBy = bookedByMap(deals ?? [])

  return (customers ?? []).map((c) => ({
    ...c,
    open_deals: openDealCounts.get(c.id) ?? 0,
    booked_by: bookedBy.get(c.id) ?? c.owner?.full_name ?? null,
  }))
}

/**
 * Who booked each member: the owner of their most recently booked deal.
 * Callers fall back to the member's own owner when nothing is booked yet.
 */
function bookedByMap(
  deals: { customer_id: string | null; stage: string; closed_at: string | null; updated_at: string; owner: { full_name: string } | null }[],
) {
  const latest = new Map<string, { at: number; name: string }>()
  for (const d of deals) {
    if (!d.customer_id || d.stage !== 'booked' || !d.owner) continue
    const at = new Date(d.closed_at ?? d.updated_at).getTime()
    const prev = latest.get(d.customer_id)
    if (!prev || at > prev.at) latest.set(d.customer_id, { at, name: d.owner.full_name })
  }
  return new Map(Array.from(latest, ([id, v]) => [id, v.name]))
}

export async function getCustomerBookedBy(customerId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('deals')
    .select('customer_id, stage, closed_at, updated_at, owner:platform_users!deals_owner_id_fkey(full_name)')
    .eq('customer_id', customerId)
    .eq('stage', 'booked')
  return bookedByMap(data ?? []).get(customerId) ?? null
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

export async function getCustomerDeals(customerId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('deals')
    .select('id, code, title, stage, value, expected_close_date')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
  return data ?? []
}

export type CustomerWithOwner = NonNullable<Awaited<ReturnType<typeof getCustomerById>>>
export type CustomerDeal = Awaited<ReturnType<typeof getCustomerDeals>>[number]
