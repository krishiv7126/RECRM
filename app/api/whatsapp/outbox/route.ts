import { timingSafeEqual } from 'crypto'
import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  findOrCreateWhatsAppConversation,
  getConnectedAccountForUser,
  getSender,
  recordOutbound,
  type ConnectedAccount,
} from '@/lib/whatsapp/accounts'
import { listApprovedTemplates, normalizeWhatsAppNumber, sendWhatsAppTemplate, type WhatsAppSender, type WhatsAppTemplate } from '@/lib/whatsapp/client'

export const maxDuration = 60

type Admin = ReturnType<typeof createAdminClient>

function authorized(request: NextRequest) {
  const secret = process.env.WHATSAPP_OUTBOX_SECRET
  const header = request.headers.get('authorization') ?? ''
  if (!secret) return false
  const a = Buffer.from(header)
  const b = Buffer.from(`Bearer ${secret}`)
  return a.length === b.length && timingSafeEqual(a, b)
}

function fill(body: string, params: string[]) {
  return params.reduce((t, v, i) => t.replace(new RegExp(`\\{\\{\\s*${i + 1}\\s*\\}\\}`, 'g'), v), body)
}

async function notifyFailure(admin: Admin, row: { org_id: string; sender_id: string | null; recipient_name: string | null; phone: string; lead_id: string | null; customer_id: string | null }, error: string) {
  if (!row.sender_id) return
  await admin.from('notifications').insert({
    org_id: row.org_id,
    recipient_id: row.sender_id,
    type: 'system',
    title: `Automated WhatsApp to ${row.recipient_name ?? row.phone} failed`,
    body: error.slice(0, 200),
    related_type: row.lead_id ? 'leads' : row.customer_id ? 'customers' : null,
    related_id: row.lead_id ?? row.customer_id,
  })
}

/**
 * Sends the WhatsApp templates queued by automation rules (whatsapp_outbox).
 * Called every minute by pg_cron via pg_net with a shared bearer secret.
 * Each message goes out from the sender's own connected number and costs one
 * wallet credit, refunded if Meta rejects it.
 */
export async function POST(request: NextRequest) {
  if (!authorized(request)) return new Response('Unauthorized', { status: 401 })

  const admin = createAdminClient()
  await admin.rpc('whatsapp_outbox_expire')
  const { data: rows, error } = await admin.rpc('whatsapp_outbox_claim', { p_limit: 25 })
  if (error) return Response.json({ error: error.message }, { status: 500 })

  const senders = new Map<string, { account: ConnectedAccount; sender: WhatsAppSender; templates?: WhatsAppTemplate[] } | null>()
  let sent = 0
  let failed = 0

  for (const row of rows ?? []) {
    const fail = async (message: string, refund = false) => {
      failed++
      if (refund) await admin.rpc('wallet_refund_org', { p_org_id: row.org_id, p_messages: 1, p_reference: row.id })
      await admin.from('whatsapp_outbox').update({ status: 'failed', last_error: message }).eq('id', row.id)
      await notifyFailure(admin, row, message)
    }

    if (!row.sender_id) {
      await fail('No one to send from.')
      continue
    }

    if (!senders.has(row.sender_id)) {
      const account = await getConnectedAccountForUser(admin, row.sender_id)
      const sender = account ? await getSender(admin, account).catch(() => null) : null
      senders.set(row.sender_id, account && sender ? { account, sender } : null)
    }
    const from = senders.get(row.sender_id)
    if (!from || from.account.org_id !== row.org_id) {
      await fail('The sender has no connected WhatsApp number. Connect one in Settings → WhatsApp.')
      continue
    }

    const phone = normalizeWhatsAppNumber(row.phone)
    if (phone.length < 10) {
      await fail(`Invalid phone number: ${row.phone}`)
      continue
    }

    const { error: chargeErr } = await admin.rpc('wallet_charge_org', { p_org_id: row.org_id, p_messages: 1, p_reference: row.id })
    if (chargeErr) {
      await fail(chargeErr.message.includes('Not enough') ? 'Not enough WhatsApp credits.' : chargeErr.message)
      continue
    }

    const params = Array.isArray(row.template_params) ? (row.template_params as string[]) : []
    try {
      const { messageId } = await sendWhatsAppTemplate(from.sender, phone, row.template_name, row.template_language, params)

      if (!from.templates) from.templates = await listApprovedTemplates(from.sender).catch(() => [])
      const body = from.templates.find((t) => t.name === row.template_name && t.language === row.template_language)?.body
      const content = body ? fill(body, params) : `[Template: ${row.template_name}]`

      const conversationId = await findOrCreateWhatsAppConversation(admin, from.account, phone, {
        profileName: row.recipient_name,
        leadId: row.lead_id,
        customerId: row.customer_id,
      })
      if (conversationId) {
        await recordOutbound(admin, {
          conversationId,
          orgId: row.org_id,
          senderId: row.sender_id,
          content,
          externalId: messageId,
        })
      }
      await admin
        .from('whatsapp_outbox')
        .update({ status: 'sent', last_error: null, conversation_id: conversationId })
        .eq('id', row.id)
      sent++
    } catch (err) {
      await fail(err instanceof Error ? err.message : 'Send failed.', true)
    }
  }

  return Response.json({ claimed: rows?.length ?? 0, sent, failed })
}
