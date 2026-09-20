'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { sendWhatsAppTemplate, sendWhatsAppText } from '@/lib/whatsapp/client'

interface CampaignRecipient {
  id: string
  name: string
  phone: string | null
}

function personalize(message: string, name: string) {
  return message.replace(/\{\{\s*name\s*\}\}/gi, name)
}

export async function sendCampaign(campaignId: string): Promise<{ ok: boolean; message: string }> {
  const supabase = await createClient()

  const { data: campaign, error: fetchErr } = await supabase
    .from('whatsapp_campaigns')
    .select('*')
    .eq('id', campaignId)
    .single()
  if (fetchErr || !campaign) return { ok: false, message: 'Campaign not found.' }
  if (campaign.status === 'sent') return { ok: false, message: 'This campaign was already sent.' }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, message: 'Not signed in.' }
  const { data: me } = await supabase.from('platform_users').select('id, org_id').eq('auth_user_id', user.id).single()
  if (!me) return { ok: false, message: 'Could not resolve your account.' }

  const recipients = ((campaign.recipients as unknown as CampaignRecipient[]) ?? []).filter((r) => r.phone)
  if (recipients.length === 0) return { ok: false, message: 'No recipients with a phone number.' }

  let sent = 0
  let failed = 0
  let lastError: string | null = null

  for (const r of recipients) {
    const phone = (r.phone ?? '').replace(/\D/g, '')
    if (!phone) {
      failed++
      continue
    }

    try {
      const text = personalize(campaign.message, r.name)
      const result = campaign.template_name
        ? await sendWhatsAppTemplate(phone, campaign.template_name)
        : await sendWhatsAppText(phone, text)
      sent++

      // Log it as a conversation/message so it shows up in Inbox like any
      // other channel, same as a real inbound/outbound WhatsApp thread would.
      const { data: existingConvo } = await supabase
        .from('conversations')
        .select('id')
        .eq('org_id', campaign.org_id)
        .eq('channel', 'whatsapp')
        .eq('external_identifier', phone)
        .maybeSingle()

      const conversationId =
        existingConvo?.id ??
        (
          await supabase
            .from('conversations')
            .insert({
              org_id: campaign.org_id,
              owner_id: me.id,
              channel: 'whatsapp',
              external_identifier: phone,
              lead_id: campaign.audience_type === 'leads' ? r.id : null,
              customer_id: campaign.audience_type === 'customers' ? r.id : null,
              subject: campaign.title,
            })
            .select('id')
            .single()
        ).data?.id

      if (conversationId) {
        await supabase.from('messages').insert({
          conversation_id: conversationId,
          org_id: campaign.org_id,
          direction: 'outbound',
          channel: 'whatsapp',
          sender_platform_user_id: me.id,
          content: text,
          external_message_id: result.messageId ?? null,
          status: 'sent',
        })
        await supabase
          .from('conversations')
          .update({ last_message_at: new Date().toISOString() })
          .eq('id', conversationId)
      }
    } catch (err) {
      failed++
      lastError = err instanceof Error ? err.message : 'Send failed.'
    }
  }

  const status = failed === 0 ? 'sent' : sent === 0 ? 'failed' : 'partial'
  await supabase
    .from('whatsapp_campaigns')
    .update({
      status,
      sent_count: sent,
      failed_count: failed,
      last_error: lastError,
      sent_at: new Date().toISOString(),
    })
    .eq('id', campaignId)

  revalidatePath('/whatsapp-broadcast')

  if (sent === 0) return { ok: false, message: lastError ?? 'All sends failed.' }
  if (failed > 0) return { ok: true, message: `Sent to ${sent}, ${failed} failed. Last error: ${lastError}` }
  return { ok: true, message: `Sent to all ${sent} recipients.` }
}
