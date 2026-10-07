import { createHmac, randomUUID, timingSafeEqual } from 'crypto'
import { after, NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  findOrCreateWhatsAppConversation,
  getAccountByPhoneNumberId,
  getSender,
  type ConnectedAccount,
} from '@/lib/whatsapp/accounts'
import { downloadWhatsAppMedia } from '@/lib/whatsapp/client'

export const maxDuration = 60

type Admin = ReturnType<typeof createAdminClient>

// Meta's verification handshake: it calls this once with hub.mode=subscribe
// and the verify token set on the app's WhatsApp webhook in Meta's dashboard.
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
  const appSecret = process.env.META_APP_SECRET ?? process.env.WHATSAPP_APP_SECRET
  if (!appSecret || !signatureHeader) return false

  const expected = 'sha256=' + createHmac('sha256', appSecret).update(rawBody).digest('hex')
  const a = Buffer.from(expected)
  const b = Buffer.from(signatureHeader)
  return a.length === b.length && timingSafeEqual(a, b)
}

interface MediaRef {
  id: string
  caption?: string
  filename?: string
  mime_type?: string
}

interface WhatsAppMessage {
  from: string
  to?: string
  id: string
  timestamp?: string
  type: string
  text?: { body: string }
  image?: MediaRef
  video?: MediaRef
  audio?: MediaRef
  voice?: MediaRef
  document?: MediaRef
  sticker?: MediaRef
  location?: { latitude: number; longitude: number; name?: string; address?: string }
  contacts?: { name?: { formatted_name?: string }; phones?: { phone?: string }[] }[]
  button?: { text?: string }
  interactive?: { button_reply?: { title?: string }; list_reply?: { title?: string } }
  reaction?: { emoji?: string }
}

interface WhatsAppStatus {
  id: string
  status: 'sent' | 'delivered' | 'read' | 'failed'
}

const MEDIA_TYPES = ['image', 'video', 'audio', 'voice', 'document', 'sticker'] as const

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'video/mp4': 'mp4',
  'audio/ogg': 'ogg',
  'audio/mpeg': 'mp3',
  'audio/mp4': 'm4a',
  'application/pdf': 'pdf',
}

function textContent(msg: WhatsAppMessage): string | null {
  switch (msg.type) {
    case 'text':
      return msg.text?.body ?? ''
    case 'location': {
      const l = msg.location
      if (!l) return '📍 Location'
      const label = [l.name, l.address].filter(Boolean).join(', ')
      return `📍 ${label ? `${label} — ` : ''}https://maps.google.com/?q=${l.latitude},${l.longitude}`
    }
    case 'contacts':
      return (msg.contacts ?? [])
        .map((c) => `👤 ${c.name?.formatted_name ?? 'Contact'}${c.phones?.[0]?.phone ? ` ${c.phones[0].phone}` : ''}`)
        .join('\n')
    case 'button':
      return msg.button?.text ?? ''
    case 'interactive':
      return msg.interactive?.button_reply?.title ?? msg.interactive?.list_reply?.title ?? ''
    case 'reaction':
      return msg.reaction?.emoji ? `Reacted ${msg.reaction.emoji}` : null
    default:
      return (MEDIA_TYPES as readonly string[]).includes(msg.type) ? null : `[Unsupported message type: ${msg.type}]`
  }
}

/** Copies an inbound file into the private documents bucket, next to Inbox attachments. */
async function storeMedia(admin: Admin, account: ConnectedAccount, conversationId: string, msg: WhatsAppMessage) {
  const ref = (msg[msg.type as (typeof MEDIA_TYPES)[number]] ?? null) as MediaRef | null
  if (!ref?.id) return { path: null, caption: null }
  try {
    const sender = await getSender(admin, account)
    const { blob, mimeType } = await downloadWhatsAppMedia(ref.id, sender.accessToken)
    const ext = EXT_BY_MIME[mimeType.split(';')[0]] ?? mimeType.split('/')[1]?.split(';')[0] ?? 'bin'
    const name = (ref.filename ?? `${msg.type}.${ext}`).replace(/[^\w.\-]+/g, '_')
    const path = `${account.org_id}/whatsapp/${conversationId}/${randomUUID()}-${name}`
    const { error } = await admin.storage.from('documents').upload(path, blob, { contentType: mimeType })
    if (error) throw error
    return { path, caption: ref.caption ?? null }
  } catch (err) {
    console.error('WhatsApp media download failed:', err)
    return { path: null, caption: ref.caption ?? `[${msg.type} could not be downloaded]` }
  }
}

async function recordMessage(
  admin: Admin,
  account: ConnectedAccount,
  msg: WhatsAppMessage,
  direction: 'inbound' | 'outbound',
  customerNumber: string,
  profileName: string | null,
) {
  const content = textContent(msg)
  if (content === null && !(MEDIA_TYPES as readonly string[]).includes(msg.type)) return

  const conversationId = await findOrCreateWhatsAppConversation(admin, account, customerNumber, {
    profileName,
    createLeadIfUnknown: direction === 'inbound',
  })
  if (!conversationId) return

  // Skip retries before downloading media again.
  const { data: dupe } = await admin.from('messages').select('id').eq('external_message_id', msg.id).maybeSingle()
  if (dupe) return

  const media = content === null ? await storeMedia(admin, account, conversationId, msg) : { path: null, caption: null }
  const createdAt = msg.timestamp ? new Date(Number(msg.timestamp) * 1000).toISOString() : new Date().toISOString()

  // Throttle notifications: only when the customer starts talking again.
  let notify = false
  if (direction === 'inbound') {
    const { data: lastInbound } = await admin
      .from('messages')
      .select('created_at')
      .eq('conversation_id', conversationId)
      .eq('direction', 'inbound')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    notify = !lastInbound || Date.now() - new Date(lastInbound.created_at).getTime() > 30 * 60 * 1000
  }

  // external_message_id has a unique index -- ON CONFLICT DO NOTHING makes
  // this safe against Meta's webhook retries delivering the same event twice.
  await admin.from('messages').upsert(
    {
      conversation_id: conversationId,
      org_id: account.org_id,
      direction,
      channel: 'whatsapp',
      sender_platform_user_id: direction === 'outbound' ? account.platform_user_id : null,
      content: content ?? media.caption,
      media_url: media.path,
      external_message_id: msg.id,
      status: direction === 'inbound' ? 'delivered' : 'sent',
      created_at: createdAt,
    },
    { onConflict: 'external_message_id', ignoreDuplicates: true },
  )

  await admin
    .from('conversations')
    .update({ last_message_at: createdAt, status: 'open' })
    .eq('id', conversationId)

  if (notify) {
    const { data: owner } = await admin
      .from('conversations')
      .select('owner_id, subject, external_identifier')
      .eq('id', conversationId)
      .single()
    if (owner) {
      await admin.from('notifications').insert({
        org_id: account.org_id,
        recipient_id: owner.owner_id,
        type: 'other',
        title: `WhatsApp from ${owner.subject || profileName || `+${owner.external_identifier}`}`,
        body: (content ?? media.caption ?? `Sent a ${msg.type}`).slice(0, 140),
        related_type: 'conversations',
        related_id: conversationId,
      })
    }
  }
}

const STATUS_RANK: Record<string, number> = { queued: 0, sent: 1, delivered: 2, read: 3, failed: 4 }

async function handleStatusUpdates(admin: Admin, statuses: WhatsAppStatus[]) {
  for (const s of statuses) {
    // Webhooks can arrive out of order; never move read back to delivered.
    const { data: row } = await admin.from('messages').select('id, status').eq('external_message_id', s.id).maybeSingle()
    if (!row || (STATUS_RANK[row.status] ?? 0) >= (STATUS_RANK[s.status] ?? 0)) continue
    await admin.from('messages').update({ status: s.status }).eq('id', row.id)
  }
}

interface ChangeValue {
  metadata?: { phone_number_id?: string }
  contacts?: { wa_id: string; profile?: { name?: string } }[]
  messages?: WhatsAppMessage[]
  statuses?: WhatsAppStatus[]
  message_echoes?: WhatsAppMessage[]
}

async function processPayload(body: { entry?: { changes?: { field?: string; value?: ChangeValue }[] }[] }) {
  const admin = createAdminClient()

  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value ?? {}
      const phoneNumberId = value.metadata?.phone_number_id
      if (!phoneNumberId) continue

      // Every connected number belongs to one person in one org.
      const account = await getAccountByPhoneNumberId(admin, phoneNumberId)
      if (!account) continue

      const names = new Map((value.contacts ?? []).map((c) => [c.wa_id, c.profile?.name ?? null]))

      for (const msg of value.messages ?? []) {
        try {
          await recordMessage(admin, account, msg, 'inbound', msg.from, names.get(msg.from) ?? null)
        } catch (err) {
          console.error('WhatsApp inbound message failed:', err)
        }
      }

      // Coexistence: messages the user sent from the WhatsApp Business app on
      // their phone, so the CRM thread shows both sides.
      for (const msg of value.message_echoes ?? []) {
        if (!msg.to) continue
        try {
          await recordMessage(admin, account, msg, 'outbound', msg.to, null)
        } catch (err) {
          console.error('WhatsApp echo failed:', err)
        }
      }

      if (value.statuses?.length) await handleStatusUpdates(admin, value.statuses)
    }
  }
}

// Meta POSTs message/status events for every connected number here. It
// expects a fast 200 or it retries and eventually disables the webhook, so
// the work (including media downloads) runs after the response.
export async function POST(request: NextRequest) {
  const rawBody = await request.text()

  if (!verifySignature(rawBody, request.headers.get('x-hub-signature-256'))) {
    return new Response('Invalid signature', { status: 401 })
  }

  let body
  try {
    body = JSON.parse(rawBody)
  } catch {
    return Response.json({ received: true })
  }

  after(async () => {
    try {
      await processPayload(body)
    } catch (err) {
      console.error('WhatsApp webhook processing failed:', err)
    }
  })

  return Response.json({ received: true })
}
