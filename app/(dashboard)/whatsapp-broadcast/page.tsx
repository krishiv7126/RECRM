import { redirect } from 'next/navigation'
import { WhatsappBroadcastView } from '@/components/whatsapp/whatsapp-broadcast-view'
import { getWhatsappAudienceData, getWhatsappCampaigns } from '@/lib/whatsapp/get-whatsapp-data'
import { getCurrentProfile } from '@/lib/supabase/current-user'

export default async function WhatsappBroadcastPage() {
  const profile = await getCurrentProfile()
  const role = profile?.role

  // Mass messaging is a manager/admin action, same access level as Automation.
  if (role !== 'admin' && role !== 'super_admin' && role !== 'manager') {
    redirect('/dashboard')
  }

  const [audience, campaigns] = await Promise.all([getWhatsappAudienceData(), getWhatsappCampaigns()])

  return <WhatsappBroadcastView leads={audience.leads} customers={audience.customers} initialCampaigns={campaigns} />
}
