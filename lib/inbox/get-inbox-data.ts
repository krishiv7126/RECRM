import { createClient } from '@/lib/supabase/server'

export interface InboxConversation {
  id: string
  subject: string | null
  owner_id: string
  last_message_at: string | null
  created_at: string
  participants: { id: string; full_name: string }[]
  lastMessagePreview: string
  unreadCount: number
  isGroup: boolean
  title: string
}

export async function getInboxData() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { me: null, conversations: [], teammates: [] }

  const { data: me } = await supabase
    .from('platform_users')
    .select('id, org_id, full_name')
    .eq('auth_user_id', user.id)
    .single()
  if (!me) return { me: null, conversations: [], teammates: [] }

  // Only internal team chat lives on this page; WhatsApp/email conversations
  // belong to the (not yet built) customer messaging surface.
  const { data: rows } = await supabase
    .from('conversations')
    .select('id, subject, owner_id, last_message_at, created_at, conversation_participants(platform_user_id, last_read_at)')
    .eq('channel', 'internal_chat')
    .order('last_message_at', { ascending: false, nullsFirst: false })

  const conversationIds = (rows ?? []).map((c) => c.id)

  const [{ data: teammates }, { data: messages }] = await Promise.all([
    supabase.from('platform_users').select('id, full_name, role').neq('id', me.id).order('full_name'),
    conversationIds.length > 0
      ? supabase
          .from('messages')
          .select('id, conversation_id, content, created_at, sender_platform_user_id')
          .in('conversation_id', conversationIds)
          .order('created_at', { ascending: true })
      : Promise.resolve({ data: [] as never[] }),
  ])

  const allUsers = await supabase.from('platform_users').select('id, full_name')
  const nameById = new Map((allUsers.data ?? []).map((u) => [u.id, u.full_name]))

  const conversations: InboxConversation[] = (rows ?? [])
    .map((c) => {
      const parts = c.conversation_participants ?? []
      const mine = parts.find((p) => p.platform_user_id === me.id)
      const others = parts
        .filter((p) => p.platform_user_id !== me.id)
        .map((p) => ({ id: p.platform_user_id, full_name: nameById.get(p.platform_user_id) ?? 'Unknown' }))

      const convMessages = (messages ?? []).filter((m) => m.conversation_id === c.id)
      const last = convMessages[convMessages.length - 1]
      const lastReadAt = mine?.last_read_at ? new Date(mine.last_read_at).getTime() : 0

      return {
        id: c.id,
        subject: c.subject,
        owner_id: c.owner_id,
        last_message_at: c.last_message_at,
        created_at: c.created_at,
        participants: others,
        lastMessagePreview: last?.content ?? 'No messages yet',
        unreadCount: convMessages.filter(
          (m) => m.sender_platform_user_id !== me.id && new Date(m.created_at).getTime() > lastReadAt,
        ).length,
        isGroup: others.length > 1,
        title: c.subject?.trim() || others.map((o) => o.full_name).join(', ') || 'Empty conversation',
      }
    })
    // conversations_select also matches org-scope rows; only show ones I'm in.
    .filter((c) => (rows ?? []).find((r) => r.id === c.id)?.conversation_participants?.some((p) => p.platform_user_id === me.id))

  return { me, conversations, teammates: teammates ?? [] }
}

export type InboxData = Awaited<ReturnType<typeof getInboxData>>
