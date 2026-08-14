'use client'

import { useState } from 'react'
import {
  Info,
  Mail,
  Paperclip,
  Plus,
  Search,
  Send,
  Users,
} from 'lucide-react'
import { PageHeader } from '@/components/dashboard/page-header'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { currentUser } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

// Mirrors: conversations (channel='internal_chat'), conversation_participants, messages
interface ChatMessage {
  id: string
  sender_platform_user_id: string
  sender_name: string
  content: string
  created_at: string
  direction: 'in' | 'out'
}

interface Conversation {
  id: string
  channel: 'internal_chat'
  type: 'dm' | 'group'
  owner_id: string
  status: 'open'
  title: string
  participantNames: string[]
  last_message_at: string
  lastMessagePreview: string
  unreadCount: number
  messages: ChatMessage[]
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

const meeraMessages: ChatMessage[] = [
  {
    id: 'msg_1',
    sender_platform_user_id: 'usr_meera_iyer',
    sender_name: 'Meera Iyer',
    content: 'Hey, do you have the latest brochure for Skyline Residency? Client wants to see the 3BHK layout.',
    created_at: '2026-08-14T09:02:00Z',
    direction: 'in',
  },
  {
    id: 'msg_2',
    sender_platform_user_id: 'usr_aditya_rao',
    sender_name: 'Aditya Rao',
    content: 'Yep, sending it over now. Which client is this for?',
    created_at: '2026-08-14T09:03:00Z',
    direction: 'out',
  },
  {
    id: 'msg_3',
    sender_platform_user_id: 'usr_meera_iyer',
    sender_name: 'Meera Iyer',
    content: 'Rahul Sharma — the hot lead from Meta Ads. He is looking at a 3Cr+ budget, so this could close fast.',
    created_at: '2026-08-14T09:04:00Z',
    direction: 'in',
  },
  {
    id: 'msg_4',
    sender_platform_user_id: 'usr_aditya_rao',
    sender_name: 'Aditya Rao',
    content: 'Nice. I just moved his deal to Negotiation. Can you schedule a site visit for this week?',
    created_at: '2026-08-14T09:06:00Z',
    direction: 'out',
  },
  {
    id: 'msg_5',
    sender_platform_user_id: 'usr_meera_iyer',
    sender_name: 'Meera Iyer',
    content: 'Already on it — booked for Thursday 11 AM at the Powai site. I will send the confirmation after.',
    created_at: '2026-08-14T09:08:00Z',
    direction: 'in',
  },
  {
    id: 'msg_6',
    sender_platform_user_id: 'usr_aditya_rao',
    sender_name: 'Aditya Rao',
    content: 'Perfect, thanks Meera. Let me know if he needs the payment plan doc before then.',
    created_at: '2026-08-14T09:09:00Z',
    direction: 'out',
  },
]

const conversations: Conversation[] = [
  {
    id: 'conv_dm_meera',
    channel: 'internal_chat',
    type: 'dm',
    owner_id: currentUser.id,
    status: 'open',
    title: 'Meera Iyer',
    participantNames: ['Meera Iyer'],
    last_message_at: '2026-08-14T09:09:00Z',
    lastMessagePreview: 'Perfect, thanks Meera. Let me know if he needs...',
    unreadCount: 0,
    messages: meeraMessages,
  },
  {
    id: 'conv_dm_karan',
    channel: 'internal_chat',
    type: 'dm',
    owner_id: currentUser.id,
    status: 'open',
    title: 'Karan Shetty',
    participantNames: ['Karan Shetty'],
    last_message_at: '2026-08-14T08:41:00Z',
    lastMessagePreview: 'Sent the brochure to Ananya, waiting on her reply.',
    unreadCount: 2,
    messages: [
      {
        id: 'msg_k1',
        sender_platform_user_id: 'usr_karan_shetty',
        sender_name: 'Karan Shetty',
        content: 'Sent the brochure to Ananya, waiting on her reply.',
        created_at: '2026-08-14T08:41:00Z',
        direction: 'in',
      },
    ],
  },
  {
    id: 'conv_dm_priya',
    channel: 'internal_chat',
    type: 'dm',
    owner_id: currentUser.id,
    status: 'open',
    title: 'Priya Nair',
    participantNames: ['Priya Nair'],
    last_message_at: '2026-08-13T17:22:00Z',
    lastMessagePreview: 'Can we push the Baner Riverside review to tomorrow?',
    unreadCount: 1,
    messages: [
      {
        id: 'msg_p1',
        sender_platform_user_id: 'usr_priya_nair',
        sender_name: 'Priya Nair',
        content: 'Can we push the Baner Riverside review to tomorrow?',
        created_at: '2026-08-13T17:22:00Z',
        direction: 'in',
      },
    ],
  },
  {
    id: 'conv_group_mumbai',
    channel: 'internal_chat',
    type: 'group',
    owner_id: currentUser.id,
    status: 'open',
    title: 'Mumbai Sales Team',
    participantNames: ['Meera Iyer', 'Karan Shetty', 'Divya Prakash'],
    last_message_at: '2026-08-14T07:55:00Z',
    lastMessagePreview: 'Divya: Site visit count for this week is looking good!',
    unreadCount: 5,
    messages: [
      {
        id: 'msg_g1',
        sender_platform_user_id: 'usr_divya_prakash',
        sender_name: 'Divya Prakash',
        content: 'Site visit count for this week is looking good!',
        created_at: '2026-08-14T07:55:00Z',
        direction: 'in',
      },
    ],
  },
  {
    id: 'conv_group_allhands',
    channel: 'internal_chat',
    type: 'group',
    owner_id: currentUser.id,
    status: 'open',
    title: 'All Hands',
    participantNames: ['Meera Iyer', 'Karan Shetty', 'Priya Nair', 'Divya Prakash', 'Nikhil Bhatia'],
    last_message_at: '2026-08-13T12:10:00Z',
    lastMessagePreview: 'Priya: Monthly targets doc is shared in the drive.',
    unreadCount: 0,
    messages: [
      {
        id: 'msg_a1',
        sender_platform_user_id: 'usr_priya_nair',
        sender_name: 'Priya Nair',
        content: 'Monthly targets doc is shared in the drive.',
        created_at: '2026-08-13T12:10:00Z',
        direction: 'in',
      },
    ],
  },
]

function formatTimestamp(iso: string) {
  const date = new Date(iso)
  return date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
}

function formatListTimestamp(iso: string) {
  const date = new Date(iso)
  const now = new Date('2026-08-14T10:00:00Z')
  const isToday = date.toDateString() === now.toDateString()
  return isToday
    ? date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
    : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function ConversationRow({
  conversation,
  isActive,
  onSelect,
}: {
  conversation: Conversation
  isActive: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2.5 text-left transition-colors hover:bg-muted/60',
        isActive && 'bg-primary/10',
      )}
    >
      {conversation.type === 'dm' ? (
        <Avatar className="shrink-0">
          <AvatarFallback>{getInitials(conversation.title)}</AvatarFallback>
        </Avatar>
      ) : (
        <div className="relative flex size-8 shrink-0 items-center justify-center">
          <Avatar size="sm" className="absolute left-0 top-0 ring-2 ring-card">
            <AvatarFallback>{getInitials(conversation.participantNames[0] ?? '')}</AvatarFallback>
          </Avatar>
          <Avatar size="sm" className="absolute bottom-0 right-0 ring-2 ring-card">
            <AvatarFallback>{getInitials(conversation.participantNames[1] ?? '')}</AvatarFallback>
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

export default function InboxPage() {
  const [selectedId, setSelectedId] = useState<string | null>('conv_dm_meera')
  const [query, setQuery] = useState('')

  const filtered = conversations.filter((c) => c.title.toLowerCase().includes(query.toLowerCase()))
  const directMessages = filtered.filter((c) => c.type === 'dm')
  const groupChats = filtered.filter((c) => c.type === 'group')
  const activeConversation = conversations.find((c) => c.id === selectedId) ?? null

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col gap-6">
      <PageHeader
        crumbs={[{ label: 'System' }, { label: 'Inbox' }]}
        title="Inbox"
        description="Internal team chat — direct messages and group conversations."
      />

      <div className="flex min-h-[640px] flex-1 overflow-hidden rounded-2xl bg-card ring-1 ring-border">
        {/* Left panel */}
        <div className="flex w-80 shrink-0 flex-col border-r border-border">
          <div className="p-3">
            <InputGroup>
              <InputGroupAddon>
                <Search className="size-4" />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Search conversations..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </InputGroup>
          </div>

          <div className="flex-1 overflow-y-auto px-2 pb-2">
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
          </div>

          <div className="flex flex-col gap-2 border-t border-border p-3">
            <Button size="sm" className="justify-start">
              <Plus data-icon="inline-start" />
              New Message
            </Button>
            <Button variant="outline" size="sm" className="justify-start">
              <Users data-icon="inline-start" />
              New Group
            </Button>
          </div>
        </div>

        {/* Right panel */}
        <div className="flex flex-1 flex-col">
          {activeConversation ? (
            <>
              <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
                <div className="flex items-center gap-3">
                  {activeConversation.type === 'dm' ? (
                    <Avatar>
                      <AvatarFallback>{getInitials(activeConversation.title)}</AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="relative flex size-8 shrink-0 items-center justify-center">
                      <Avatar size="sm" className="absolute left-0 top-0 ring-2 ring-card">
                        <AvatarFallback>
                          {getInitials(activeConversation.participantNames[0] ?? '')}
                        </AvatarFallback>
                      </Avatar>
                      <Avatar size="sm" className="absolute bottom-0 right-0 ring-2 ring-card">
                        <AvatarFallback>
                          {getInitials(activeConversation.participantNames[1] ?? '')}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-[13px] font-semibold text-foreground">{activeConversation.title}</span>
                    <span className="text-[12px] text-muted-foreground">Admin · Bengaluru HQ</span>
                  </div>
                </div>
                <Button variant="ghost" size="icon-sm" aria-label="Conversation info">
                  <Info className="size-4" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-4">
                <div className="flex flex-col gap-4">
                  <div className="flex justify-center">
                    <span className="rounded-full bg-muted px-3 py-1 text-[11px] text-muted-foreground">
                      {new Date(activeConversation.messages[0]?.created_at ?? '').toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  </div>

                  {activeConversation.messages.map((message) => {
                    const isOwn = message.direction === 'out'
                    return (
                      <div key={message.id} className={cn('flex items-end gap-2', isOwn && 'flex-row-reverse')}>
                        {!isOwn && (
                          <Avatar size="sm" className="shrink-0">
                            <AvatarFallback>{getInitials(message.sender_name)}</AvatarFallback>
                          </Avatar>
                        )}
                        <div className={cn('flex max-w-[70%] flex-col gap-1', isOwn && 'items-end')}>
                          {!isOwn && (
                            <span className="px-1 text-[11px] font-medium text-muted-foreground">
                              {message.sender_name}
                            </span>
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
                    )
                  })}
                </div>
              </div>

              <div className="border-t border-border p-3">
                <InputGroup className="h-auto min-h-9">
                  <InputGroupAddon>
                    <Button variant="ghost" size="icon-sm" aria-label="Attach file">
                      <Paperclip className="size-4" />
                    </Button>
                  </InputGroupAddon>
                  <InputGroupInput placeholder="Type a message..." />
                  <InputGroupAddon align="inline-end">
                    <Button size="icon-sm" aria-label="Send message" className="rounded-lg">
                      <Send className="size-4" />
                    </Button>
                  </InputGroupAddon>
                </InputGroup>
              </div>
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
