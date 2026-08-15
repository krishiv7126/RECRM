import { createClient } from '@/lib/supabase/server'

export async function getLeadsData() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('leads')
    .select('*, owner:platform_users!leads_owner_id_fkey(full_name)')
    .order('created_at', { ascending: false })

  return data ?? []
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
