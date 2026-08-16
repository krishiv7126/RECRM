'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Info, Loader2, Mail, Plus, Search, Send, Users } from 'lucide-react'
import { PageHeader } from '@/components/dashboard/page-header'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { NewConversationDialog } from '@/components/inbox/new-conversation-dialog'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { InboxConversation } from '@/lib/inbox/get-inbox-data'

interface ChatMessage {
  id: string
  conversation_id: string
  content: string | null
  created_at: string
  sender_platform_user_id: string | null
}

function getInitials(name: string) {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
}

function formatTimestamp(iso: string) {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
}

function formatListTimestamp(iso: string | null) {
  if (!iso) return ''
  const date = new Date(iso)
  const now = new Date()
  return date.toDateString() === now.toDateString()
    ? date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
    : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function dayLabel(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) return 'Today'
  const yest = new Date(now)
  yest.setDate(now.getDate() - 1)
  if (d.toDateString() === yest.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function ConversationRow({
  conversation,
  isActive,
  onSelect,
}: {
  conversation: InboxConversation
  isActive: boolean
  onSelect: () => void
}) {
  const first = conversation.participants[0]?.full_name ?? '?'
  const second = conversation.participants[1]?.full_name ?? '?'

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2.5 text-left transition-colors hover:bg-muted/60',
        isActive && 'bg-primary/10',
      )}
    >
      {!conversation.isGroup ? (
        <Avatar className="shrink-0">
          <AvatarFallback>{getInitials(first)}</AvatarFallback>
        </Avatar>
      ) : (
        <div className="relative flex size-8 shrink-0 items-center justify-center">
          <Avatar size="sm" className="absolute left-0 top-0 ring-2 ring-card">
            <AvatarFallback>{getInitials(first)}</AvatarFallback>
          </Avatar>
          <Avatar size="sm" className="absolute bottom-0 right-0 ring-2 ring-card">
            <AvatarFallback>{getInitials(second)}</AvatarFallback>
          </Avatar>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              'truncate text-[13px] font-medium text-foreground',
              conversation.unreadCount > 0 && 'font-semibold',
            )}
          >
            {conversation.title}
          </span>
          <span className="shrink-0 text-[11px] text-muted-foreground">
            {formatListTimestamp(conversation.last_message_at)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-[12px] text-muted-foreground">{conversation.lastMessagePreview}</span>
          {conversation.unreadCount > 0 && (
            <Badge className="h-4.5 min-w-[18px] shrink-0 justify-center rounded-full bg-primary px-1 text-[10px] leading-none">
              {conversation.unreadCount}
            </Badge>
          )}
        </div>
      </div>
    </button>
  )
}

export function InboxView({
  me,
  initialConversations,
  teammates,
}: {
  me: { id: string; org_id: string | null; full_name: string }
  initialConversations: InboxConversation[]
  teammates: { id: string; full_name: string; role: string }[]
}) {
  const router = useRouter()
  const [conversations, setConversations] = useState(initialConversations)
  const [selectedId, setSelectedId] = useState<string | null>(initialConversations[0]?.id ?? null)
  const [query, setQuery] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setConversations(initialConversations)
  }, [initialConversations])

  const nameById = useMemo(() => {
    const map = new Map<string, string>([[me.id, me.full_name]])
    for (const t of teammates) map.set(t.id, t.full_name)
    return map
  }, [me, teammates])

  const activeConversation = conversations.find((c) => c.id === selectedId) ?? null

  const markRead = useCallback(
    async (conversationId: string) => {
      const supabase = createClient()
      await supabase
        .from('conversation_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('platform_user_id', me.id)
      setConversations((prev) => prev.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c)))
    },
    [me.id],
  )

  // Load the selected conversation's messages.
  useEffect(() => {
    if (!selectedId) {
      setMessages([])
      return
    }
    let cancelled = false
    setLoadingMessages(true)
    ;(async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('messages')
        .select('id, conversation_id, content, created_at, sender_platform_user_id')
        .eq('conversation_id', selectedId)
        .order('created_at', { ascending: true })
      if (cancelled) return
      setMessages(data ?? [])
      setLoadingMessages(false)
      void markRead(selectedId)
    })()
    return () => {
      cancelled = true
    }
  }, [selectedId, markRead])

  // Realtime: new messages across every conversation this user can see.
  // The `cancelled` guard matters — React's dev double-invoke would otherwise
  // create two subscriptions on the same channel name and throw.
  useEffect(() => {
    let cancelled = false
    const supabase = createClient()
    const channel = supabase.channel(`inbox:${me.id}`)

    channel.on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages' },
      (payload) => {
        if (cancelled) return
        const msg = payload.new as ChatMessage
        setMessages((prev) => {
          if (msg.conversation_id !== selectedId) return prev
          if (prev.some((m) => m.id === msg.id)) return prev
          return [...prev, msg]
        })
        setConversations((prev) =>
          prev.map((c) =>
            c.id === msg.conversation_id
              ? {
                  ...c,
                  last_message_at: msg.created_at,
                  lastMessagePreview: msg.content ?? '',
                  unreadCount:
                    msg.conversation_id === selectedId || msg.sender_platform_user_id === me.id
                      ? c.unreadCount
                      : c.unreadCount + 1,
                }
              : c,
          ),
        )
        if (msg.conversation_id === selectedId && msg.sender_platform_user_id !== me.id) {
          void markRead(selectedId)
        }
      },
    )

    channel.subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [me.id, selectedId, markRead])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const content = draft.trim()
    if (!content || !selectedId || !me.org_id || sending) return

    setSending(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: selectedId,
        org_id: me.org_id,
        direction: 'outbound',
        channel: 'internal_chat',
        sender_platform_user_id: me.id,
        content,
      })
      .select('id, conversation_id, content, created_at, sender_platform_user_id')
      .single()

    if (error) {
      setSending(false)
      window.alert(error.message)
      return
    }

    await supabase
      .from('conversations')
      .update({ last_message_at: data.created_at })
      .eq('id', selectedId)

    setDraft('')
    setSending(false)
    setMessages((prev) => (prev.some((m) => m.id === data.id) ? prev : [...prev, data]))
    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedId ? { ...c, last_message_at: data.created_at, lastMessagePreview: content } : c,
      ),
    )
  }

  const filtered = conversations.filter((c) => c.title.toLowerCase().includes(query.trim().toLowerCase()))
  const directMessages = filtered.filter((c) => !c.isGroup)
  const groupChats = filtered.filter((c) => c.isGroup)

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col gap-6">
      <PageHeader
        crumbs={[{ label: 'System' }, { label: 'Inbox' }]}
        title="Inbox"
        description="Internal team chat — direct messages and group conversations."
      />

      <div className="flex min-h-[640px] flex-1 overflow-hidden rounded-2xl bg-card ring-1 ring-border">
        <div className="flex w-80 shrink-0 flex-col border-r border-border">
          <div className="p-3">
            <InputGroup>
              <InputGroupAddon>
                <Search className="size-4" />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Search conversations..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </InputGroup>
          </div>

          <div className="flex-1 overflow-y-auto px-2 pb-2">
            {conversations.length === 0 && (
              <p className="px-2.5 py-6 text-center text-[12px] text-muted-foreground">
                No conversations yet. Start one below.
              </p>
            )}

            {directMessages.length > 0 && (
              <div className="flex flex-col gap-1">
                <p className="px-2.5 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Direct Messages
                </p>
                {directMessages.map((conversation) => (
                  <ConversationRow
                    key={conversation.id}
                    conversation={conversation}
                    isActive={conversation.id === selectedId}
                    onSelect={() => setSelectedId(conversation.id)}
                  />
                ))}
              </div>
            )}

            {groupChats.length > 0 && (
              <div className="mt-2 flex flex-col gap-1">
                <p className="px-2.5 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Group Chats
                </p>
                {groupChats.map((conversation) => (
                  <ConversationRow
                    key={conversation.id}
                    conversation={conversation}
                    isActive={conversation.id === selectedId}
                    onSelect={() => setSelectedId(conversation.id)}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 border-t border-border p-3">
            <NewConversationDialog
              me={me}
              teammates={teammates}
              mode="dm"
              trigger={
                <Button size="sm" className="justify-start">
                  <Plus data-icon="inline-start" />
                  New Message
                </Button>
              }
            />
            <NewConversationDialog
              me={me}
              teammates={teammates}
              mode="group"
              trigger={
                <Button variant="outline" size="sm" className="justify-start">
                  <Users data-icon="inline-start" />
                  New Group
                </Button>
              }
            />
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          {activeConversation ? (
            <>
              <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
                <div className="flex min-w-0 items-center gap-3">
                  {!activeConversation.isGroup ? (
                    <Avatar>
                      <AvatarFallback>
                        {getInitials(activeConversation.participants[0]?.full_name ?? '?')}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="relative flex size-8 shrink-0 items-center justify-center">
                      <Avatar size="sm" className="absolute left-0 top-0 ring-2 ring-card">
                        <AvatarFallback>
                          {getInitials(activeConversation.participants[0]?.full_name ?? '?')}
                        </AvatarFallback>
                      </Avatar>
                      <Avatar size="sm" className="absolute bottom-0 right-0 ring-2 ring-card">
                        <AvatarFallback>
                          {getInitials(activeConversation.participants[1]?.full_name ?? '?')}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  )}
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-[13px] font-semibold text-foreground">
                      {activeConversation.title}
                    </span>
                    <span className="truncate text-[12px] text-muted-foreground">
                      {activeConversation.isGroup
                        ? `${activeConversation.participants.length + 1} members`
                        : 'Direct message'}
                    </span>
                  </div>
                </div>
                <Button variant="ghost" size="icon-sm" aria-label="Conversation info">
                  <Info className="size-4" />
                </Button>
              </div>

              <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4">
                {loadingMessages ? (
                  <div className="flex h-full items-center justify-center">
                    <Loader2 className="size-5 animate-spin text-muted-foreground" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-[13px] text-muted-foreground">
                      No messages yet — say hello to start the conversation.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {messages.map((message, i) => {
                      const isOwn = message.sender_platform_user_id === me.id
                      const senderName = nameById.get(message.sender_platform_user_id ?? '') ?? 'Unknown'
                      const prev = messages[i - 1]
                      const showDay =
                        !prev || new Date(prev.created_at).toDateString() !== new Date(message.created_at).toDateString()

                      return (
                        <div key={message.id} className="flex flex-col gap-4">
                          {showDay && (
                            <div className="flex justify-center">
                              <span className="rounded-full bg-muted px-3 py-1 text-[11px] text-muted-foreground">
                                {dayLabel(message.created_at)}
                              </span>
                            </div>
                          )}
                          <div className={cn('flex items-end gap-2', isOwn && 'flex-row-reverse')}>
                            {!isOwn && (
                              <Avatar size="sm" className="shrink-0">
                                <AvatarFallback>{getInitials(senderName)}</AvatarFallback>
                              </Avatar>
                            )}
                            <div className={cn('flex max-w-[70%] flex-col gap-1', isOwn && 'items-end')}>
                              {!isOwn && (
                                <span className="px-1 text-[11px] font-medium text-muted-foreground">{senderName}</span>
                              )}
                              <div
                                className={cn(
                                  'rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed',
                                  isOwn
                                    ? 'rounded-br-md bg-primary text-primary-foreground'
                                    : 'rounded-bl-md bg-secondary text-secondary-foreground',
                                )}
                              >
                                {message.content}
                              </div>
                              <span className="px-1 text-[10px] text-muted-foreground">
                                {formatTimestamp(message.created_at)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <form onSubmit={handleSend} className="border-t border-border p-3">
                <InputGroup className="h-auto min-h-9">
                  <InputGroupInput
                    placeholder="Type a message..."
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                  />
                  <InputGroupAddon align="inline-end">
                    <Button
                      type="submit"
                      size="icon-sm"
                      aria-label="Send message"
                      className="rounded-lg"
                      disabled={!draft.trim() || sending}
                    >
                      {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                    </Button>
                  </InputGroupAddon>
                </InputGroup>
              </form>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
              <Mail className="size-8 text-muted-foreground/60" />
              <p className="text-[13px] text-muted-foreground">Select a conversation to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
