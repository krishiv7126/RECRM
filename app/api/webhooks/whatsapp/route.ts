import { createHmac, timingSafeEqual } from 'crypto'
import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Meta's verification handshake: it calls this once with hub.mode=subscribe
// and a token you chose when setting up the webhook in Meta's dashboard.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN

  if (mode === 'subscribe' && verifyToken && token === verifyToken) {
    return new Response(challenge, { status: 200 })
  }

  return new Response('Forbidden', { status: 403 })
}

function verifySignature(rawBody: string, signatureHeader: string | null): boolean {
  const appSecret = process.env.WHATSAPP_APP_SECRET
  if (!appSecret || !signatureHeader) return false

  const expected = 'sha256=' + createHmac('sha256', appSecret).update(rawBody).digest('hex')
  const a = Buffer.from(expected)
  const b = Buffer.from(signatureHeader)
  return a.length === b.length && timingSafeEqual(a, b)
}

interface WhatsAppMessage {
  from: string
  id: string
  type: string
  text?: { body: string }
}

interface WhatsAppStatus {
  id: string
  status: 'sent' | 'delivered' | 'read' | 'failed'
}

async function upsertConversation(
  admin: ReturnType<typeof createAdminClient>,
  orgId: string,
  phone: string,
) {
  const { data: existing } = await admin
    .from('conversations')
    .select('id')
    .eq('org_id', orgId)
    .eq('channel', 'whatsapp')
    .eq('external_identifier', phone)
    .maybeSingle()
  if (existing) return existing.id

  const [{ data: lead }, { data: customer }] = await Promise.all([
    admin.from('leads').select('id, owner_id').eq('org_id', orgId).eq('phone', phone).maybeSingle(),
    admin.from('customers').select('id, owner_id').eq('org_id', orgId).eq('phone', phone).maybeSingle(),
  ])

  // conversations.owner_id is NOT NULL -- fall back to the matched
  // lead/customer's assigned owner, or the org's admin if there's no match
  // or no owner set (an unassigned inbound message still needs a thread).
  let ownerId = lead?.owner_id ?? customer?.owner_id ?? null
  if (!ownerId) {
    const { data: admin_ } = await admin
      .from('platform_users')
      .select('id')
      .eq('org_id', orgId)
      .in('role', ['admin', 'super_admin'])
      .limit(1)
      .maybeSingle()
    ownerId = admin_?.id ?? null
  }
  if (!ownerId) return null

  const { data: created } = await admin
    .from('conversations')
    .insert({
      org_id: orgId,
      owner_id: ownerId,
      channel: 'whatsapp',
      external_identifier: phone,
      lead_id: lead?.id ?? null,
      customer_id: customer?.id ?? null,
    })
    .select('id')
    .single()

  return created?.id ?? null
}

async function handleInboundMessages(
  admin: ReturnType<typeof createAdminClient>,
  orgId: string,
  messages: WhatsAppMessage[],
) {
  for (const msg of messages) {
    const conversationId = await upsertConversation(admin, orgId, msg.from)
    if (!conversationId) continue

    const content =
      msg.type === 'text' ? (msg.text?.body ?? '') : `[Unsupported message type: ${msg.type}]`

    // external_message_id has a unique index -- ON CONFLICT DO NOTHING makes
    // this safe against Meta's webhook retries delivering the same event twice.
    await admin
      .from('messages')
      .upsert(
        {
          conversation_id: conversationId,
          org_id: orgId,
          direction: 'inbound',
          channel: 'whatsapp',
          content,
          external_message_id: msg.id,
          status: 'delivered',
        },
        { onConflict: 'external_message_id', ignoreDuplicates: true },
      )

    await admin.from('conversations').update({ last_message_at: new Date().toISOString() }).eq('id', conversationId)
  }
}

async function handleStatusUpdates(admin: ReturnType<typeof createAdminClient>, statuses: WhatsAppStatus[]) {
  for (const s of statuses) {
    await admin.from('messages').update({ status: s.status }).eq('external_message_id', s.id)
  }
}

// Meta POSTs message/status events here once the webhook is subscribed. It
// expects a fast 200 regardless of payload contents, or it will retry and
// eventually disable the webhook -- so this always acknowledges even if a
// row inside the payload fails to process.
export async function POST(request: NextRequest) {
  const rawBody = await request.text()

  if (!verifySignature(rawBody, request.headers.get('x-hub-signature-256'))) {
    return new Response('Invalid signature', { status: 401 })
  }

  const orgId = process.env.WHATSAPP_ORG_ID
  if (!orgId) {
    console.error('WhatsApp webhook received but WHATSAPP_ORG_ID is not configured.')
    return Response.json({ received: true })
  }

  const body = JSON.parse(rawBody)
  const admin = createAdminClient()

  try {
    for (const entry of body.entry ?? []) {
      for (const change of entry.changes ?? []) {
        const value = change.value ?? {}
        if (value.messages?.length) await handleInboundMessages(admin, orgId, value.messages)
        if (value.statuses?.length) await handleStatusUpdates(admin, value.statuses)
      }
    }
  } catch (err) {
    console.error('WhatsApp webhook processing failed:', err)
  }

  return Response.json({ received: true })
}
