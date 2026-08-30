import { createClient } from '@/lib/supabase/server'

export async function getInquiriesData() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('leads')
    .select('*, owner:platform_users!leads_owner_id_fkey(full_name)')
    .eq('source', 'Offline Inquiry')
    .order('created_at', { ascending: false })

  return data ?? []
}

export type InquiryRow = Awaited<ReturnType<typeof getInquiriesData>>[number]
