import { createClient } from '@/lib/supabase/server'

export interface WhatsAppChat {
  id: string
  owner_id: string
  ownerName: string
  phone: string
  name: string
  lead_id: string | null
  customer_id: string | null
  accountNumber: string | null
  accountConnected: boolean
  last_message_at: string | null
  lastMessagePreview: string
  lastInboundAt: string | null
  /** Inbound messages since our last reply — i.e. waiting on us. */
  awaitingReply: number
}

export async function getWhatsAppChats() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: me } = await supabase
    .from('platform_users')
    .select('id, org_id, full_name, role')
    .eq('auth_user_id', user.id)
    .single()
  if (!me?.org_id) return null

  // RLS scopes all of these: users see their own chats, managers their
  // reports', admins the whole org.
  const [{ data: rows }, { data: accounts }, { data: people }] = await Promise.all([
    supabase
      .from('conversations')
      .select(
        'id, owner_id, external_identifier, subject, lead_id, customer_id, whatsapp_account_id, last_message_at, lead:leads(full_name), customer:customers(full_name)',
      )
      .eq('channel', 'whatsapp')
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .limit(500),
    supabase.from('whatsapp_accounts').select('id, platform_user_id, display_phone_number, status'),
    supabase.from('platform_users').select('id, full_name'),
  ])

  const ids = (rows ?? []).map((r) => r.id)
  const { data: recent } = ids.length
    ? await supabase
        .from('messages')
        .select('conversation_id, direction, content, media_url, created_at')
        .in('conversation_id', ids)
        .order('created_at', { ascending: false })
        .limit(3000)
    : { data: null }

  type RecentMessage = NonNullable<typeof recent>[number]
  const byConversation = new Map<string, RecentMessage[]>()
  for (const m of recent ?? []) {
    const list = byConversation.get(m.conversation_id) ?? []
    list.push(m)
    byConversation.set(m.conversation_id, list)
  }

  const accountById = new Map((accounts ?? []).map((a) => [a.id, a]))
  const nameById = new Map((people ?? []).map((p) => [p.id, p.full_name]))

  const chats: WhatsAppChat[] = (rows ?? []).map((c) => {
    const msgs = byConversation.get(c.id) ?? [] // newest first
    const last = msgs[0]
    const lastInbound = msgs.find((m) => m.direction === 'inbound')
    const firstOutboundIdx = msgs.findIndex((m) => m.direction === 'outbound')
    const awaitingReply = msgs
      .slice(0, firstOutboundIdx === -1 ? msgs.length : firstOutboundIdx)
      .filter((m) => m.direction === 'inbound').length
    const account = c.whatsapp_account_id ? accountById.get(c.whatsapp_account_id) : undefined
    const linkedName =
      (c.customer as { full_name: string } | null)?.full_name ?? (c.lead as { full_name: string } | null)?.full_name ?? null

    return {
      id: c.id,
      owner_id: c.owner_id,
      ownerName: nameById.get(c.owner_id) ?? 'Unknown',
      phone: c.external_identifier ?? '',
      name: linkedName ?? c.subject ?? `+${c.external_identifier}`,
      lead_id: c.lead_id,
      customer_id: c.customer_id,
      accountNumber: account?.display_phone_number ?? null,
      accountConnected: account?.status === 'connected',
      last_message_at: c.last_message_at,
      lastMessagePreview: last ? last.content || (last.media_url ? '📎 Attachment' : '') : 'No messages yet',
      lastInboundAt: lastInbound?.created_at ?? null,
      awaitingReply,
    }
  })

  const myAccount = (accounts ?? []).find((a) => a.platform_user_id === me.id && a.status === 'connected') ?? null

  return { me, chats, myAccount }
}

export type WhatsAppChatsData = NonNullable<Awaited<ReturnType<typeof getWhatsAppChats>>>
