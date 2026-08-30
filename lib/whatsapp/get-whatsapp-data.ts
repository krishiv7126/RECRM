import { createClient } from '@/lib/supabase/server'

export async function getWhatsappAudienceData() {
  const supabase = await createClient()
  const [{ data: leads }, { data: customers }] = await Promise.all([
    supabase.from('leads').select('id, full_name, phone, city, tags, source').order('created_at', { ascending: false }),
    supabase.from('customers').select('id, full_name, phone, city, tags').order('created_at', { ascending: false }),
  ])

  return { leads: leads ?? [], customers: customers ?? [] }
}

export async function getWhatsappCampaigns() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('whatsapp_campaigns')
    .select('*, created_by_user:platform_users!whatsapp_campaigns_created_by_fkey(full_name)')
    .order('created_at', { ascending: false })

  return data ?? []
}

export type WhatsappCampaign = Awaited<ReturnType<typeof getWhatsappCampaigns>>[number]
