'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { AlertCircle, Check, CheckCheck, Clock, FileText, Loader2, Paperclip, Plus, Search, Send, X } from 'lucide-react'
import { toast } from 'sonner'
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon'
import { PageHeader } from '@/components/dashboard/page-header'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { MAX_ATTACHMENT_BYTES, MessageAttachment, ATTACHMENT_BUCKET } from '@/components/inbox/message-attachment'
import { TemplatePickerDialog } from '@/components/whatsapp/template-picker-dialog'
import { createClient } from '@/lib/supabase/client'
import {
  openWhatsAppChat,
  sendWhatsAppChatMedia,
  sendWhatsAppChatMessage,
  sendWhatsAppChatTemplate,
} from '@/lib/whatsapp/actions'
import { safeCall } from '@/lib/whatsapp/safe-call'
import { cn } from '@/lib/utils'
import type { WhatsAppChat, WhatsAppChatsData } from '@/lib/whatsapp/get-whatsapp-chats'

interface ChatMessage {
  id: string
  conversation_id: string
  direction: 'inbound' | 'outbound'
  content: string | null
  media_url: string | null
  status: string
  created_at: string
  sender_platform_user_id: string | null
}

const MESSAGE_COLUMNS = 'id, conversation_id, direction, content, media_url, status, created_at, sender_platform_user_id'
const WINDOW_MS = 24 * 60 * 60 * 1000

function getInitials(name: string) {
  return name.replace(/^\+/, '').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' })
}

function formatListTime(iso: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toDateString() === new Date().toDateString()
    ? formatTime(iso)
    : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' })
}

function dayLabel(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) return 'Today'
  const y = new Date(now)
  y.setDate(now.getDate() - 1)
  if (d.toDateString() === y.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })
}

function StatusTick({ status }: { status: string }) {
  if (status === 'failed') return <AlertCircle className="size-3 text-destructive" />
  if (status === 'read') return <CheckCheck className="size-3 text-sky-500" />
  if (status === 'delivered') return <CheckCheck className="size-3" />
  if (status === 'sent') return <Check className="size-3" />
  return <Clock className="size-3" />
}

function NewChatDialog({ open, onOpenChange, onOpened }: { open: boolean; onOpenChange: (o: boolean) => void; onOpened: (id: string) => void }) {
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    const res = await safeCall(() => openWhatsAppChat({ phone, name: name.trim() || null }))
    setBusy(false)
    if (!res.ok) {
      toast.error(res.message)
      return
    }
    setPhone('')
    setName('')
    onOpenChange(false)
    onOpened(res.conversationId)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>New WhatsApp chat</DialogTitle>
          <DialogDescription>Linked to the matching lead or member automatically.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <Input autoFocus placeholder="Phone, e.g. 98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Input placeholder="Name (optional)" value={name} onChange={(e) => setName(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy || phone.replace(/\D/g, '').length < 10}>
              {busy && <Loader2 className="animate-spin" data-icon="inline-start" />}
              Open chat
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function WhatsAppChatsView({ data }: { data: WhatsAppChatsData }) {
  const { me, myAccount } = data
  const router = useRouter()
  const searchParams = useSearchParams()
  const canSeeTeam = me.role === 'admin' || me.role === 'super_admin' || me.role === 'manager'

  const [chats, setChats] = useState<WhatsAppChat[]>(data.chats)
  const [selectedId, setSelectedId] = useState<string | null>(searchParams.get('c') ?? data.chats[0]?.id ?? null)
  const [query, setQuery] = useState('')
  const [scope, setScope] = useState<'all' | 'mine' | 'waiting'>('all')
  const [ownerFilter, setOwnerFilter] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [draft, setDraft] = useState('')
  const [attachment, setAttachment] = useState<File | null>(null)
  const [sending, setSending] = useState(false)
  const [templateOpen, setTemplateOpen] = useState(false)
  const [newChatOpen, setNewChatOpen] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => setChats(data.chats), [data.chats])

  useEffect(() => {
    const c = searchParams.get('c')
    if (c) setSelectedId(c)
  }, [searchParams])

  // Keeps the 24h-window state honest while the page stays open.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(t)
  }, [])

  const active = chats.find((c) => c.id === selectedId) ?? null

  // A chat opened from a lead page may not be in the server list yet.
  useEffect(() => {
    if (selectedId && !chats.some((c) => c.id === selectedId)) router.refresh()
  }, [selectedId, chats, router])

  useEffect(() => {
    if (!selectedId) {
      setMessages([])
      return
    }
    let cancelled = false
    setLoadingMessages(true)
    createClient()
      .from('messages')
      .select(MESSAGE_COLUMNS)
      .eq('conversation_id', selectedId)
      .order('created_at', { ascending: true })
      .limit(1000)
      .then(({ data: rows }) => {
        if (cancelled) return
        setMessages((rows ?? []) as ChatMessage[])
        setLoadingMessages(false)
      })
    return () => {
      cancelled = true
    }
  }, [selectedId])

  // Realtime: new messages, delivery/read ticks and brand-new chats. The
  // `cancelled` guard avoids a double subscribe under React's dev re-run.
  useEffect(() => {
    let cancelled = false
    const supabase = createClient()
    const channel = supabase.channel(`whatsapp:${me.id}`)

    channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: 'channel=eq.whatsapp' }, (payload) => {
      if (cancelled) return
      const msg = payload.new as ChatMessage
      setMessages((prev) =>
        msg.conversation_id !== selectedId || prev.some((m) => m.id === msg.id)
          ? prev
          : [...prev, msg].sort((a, b) => a.created_at.localeCompare(b.created_at)),
      )
      setChats((prev) => {
        if (!prev.some((c) => c.id === msg.conversation_id)) {
          router.refresh()
          return prev
        }
        return prev
          .map((c) =>
            c.id === msg.conversation_id
              ? {
                  ...c,
                  last_message_at: msg.created_at,
                  lastMessagePreview: msg.content || (msg.media_url ? '📎 Attachment' : ''),
                  lastInboundAt: msg.direction === 'inbound' ? msg.created_at : c.lastInboundAt,
                  awaitingReply: msg.direction === 'inbound' ? c.awaitingReply + 1 : 0,
                }
              : c,
          )
          .sort((a, b) => (b.last_message_at ?? '').localeCompare(a.last_message_at ?? ''))
      })
    })
    channel.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: 'channel=eq.whatsapp' }, (payload) => {
      if (cancelled) return
      const msg = payload.new as ChatMessage
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, status: msg.status } : m)))
    })
    channel.subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [me.id, selectedId, router])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages])

  const lastInboundAt = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) if (messages[i].direction === 'inbound') return messages[i].created_at
    return null
  }, [messages])
  const windowOpen = !!lastInboundAt && now - new Date(lastInboundAt).getTime() < WINDOW_MS
  const windowLeftH = lastInboundAt ? Math.max(0, Math.ceil((WINDOW_MS - (now - new Date(lastInboundAt).getTime())) / 3_600_000)) : 0

  const owners = useMemo(() => {
    const map = new Map<string, string>()
    for (const c of chats) map.set(c.owner_id, c.ownerName)
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]))
  }, [chats])

  const q = query.trim().toLowerCase()
  const filtered = chats.filter((c) => {
    if (scope === 'mine' && c.owner_id !== me.id) return false
    if (scope === 'waiting' && c.awaitingReply === 0) return false
    if (ownerFilter && c.owner_id !== ownerFilter) return false
    if (!q) return true
    return c.name.toLowerCase().includes(q) || c.phone.includes(q.replace(/\D/g, '') || '\u0000')
  })

  function select(id: string) {
    setSelectedId(id)
    setDraft('')
    setAttachment(null)
    router.replace(`/whatsapp?c=${id}`, { scroll: false })
  }

  function appendOwn(message: ChatMessage | null | undefined) {
    if (!message) return
    setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]))
    setChats((prev) =>
      prev.map((c) =>
        c.id === message.conversation_id
          ? { ...c, last_message_at: message.created_at, lastMessagePreview: message.content || '📎 Attachment', awaitingReply: 0 }
          : c,
      ),
    )
  }

  function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (file.size > MAX_ATTACHMENT_BYTES) {
      toast.error('Attachments can be up to 10 MB.')
      return
    }
    setAttachment(file)
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!active || sending || !windowOpen) return
    const text = draft.trim()
    if (!text && !attachment) return

    setSending(true)
    try {
      if (attachment) {
        const safeName = attachment.name.replace(/[^\w.\-]+/g, '_')
        const path = `${me.org_id}/whatsapp/${active.id}/${crypto.randomUUID()}-${safeName}`
        const { error } = await createClient()
          .storage.from(ATTACHMENT_BUCKET)
          .upload(path, attachment, { contentType: attachment.type || undefined })
        if (error) throw new Error(`Upload failed: ${error.message}`)
        const res = await sendWhatsAppChatMedia(active.id, path, text)
        if (!res.ok) throw new Error(res.message)
        appendOwn(res.message as ChatMessage)
      } else {
        const res = await sendWhatsAppChatMessage(active.id, text)
        if (!res.ok) throw new Error(res.message)
        appendOwn(res.message as ChatMessage)
      }
      setDraft('')
      setAttachment(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Send failed.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col gap-6">
      <PageHeader
        crumbs={[{ label: 'System' }, { label: 'WhatsApp' }]}
        title="WhatsApp"
        description={
          myAccount
            ? `Chats on your number ${myAccount.display_phone_number ?? ''}${canSeeTeam ? ' and your team’s numbers' : ''}.`
            : 'Chat with leads and members on WhatsApp from the CRM.'
        }
      />

      {!myAccount && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-emerald-500/10 px-4 py-3 ring-1 ring-emerald-500/20">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-500 text-white">
              <WhatsAppIcon className="size-4" />
            </span>
            <div>
              <p className="text-[13px] font-semibold text-foreground">Connect your WhatsApp number</p>
              <p className="text-[12px] text-muted-foreground">Takes a minute — scan a QR from the WhatsApp Business app.</p>
            </div>
          </div>
          <Button size="sm" className="bg-emerald-600 text-white hover:bg-emerald-600/90" render={<Link href="/settings?tab=whatsapp" />} nativeButton={false}>
            Connect WhatsApp
          </Button>
        </div>
      )}

      <div className="flex min-h-[640px] flex-1 overflow-hidden rounded-2xl bg-card ring-1 ring-border">
        <div className={cn('flex w-full shrink-0 flex-col border-r border-border md:w-80', active && 'hidden md:flex')}>
          <div className="flex flex-col gap-2 p-3">
            <InputGroup>
              <InputGroupAddon>
                <Search className="size-4" />
              </InputGroupAddon>
              <InputGroupInput placeholder="Search name or number…" value={query} onChange={(e) => setQuery(e.target.value)} />
            </InputGroup>
            <div className="flex items-center gap-1">
              {(['all', 'waiting', ...(canSeeTeam ? (['mine'] as const) : [])] as const).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setScope(key)}
                  className={cn(
                    'rounded-full px-2.5 py-1 text-[12px] font-medium transition-colors',
                    scope === key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted',
                  )}
                >
                  {key === 'all' ? 'All' : key === 'waiting' ? 'Needs reply' : 'Mine'}
                </button>
              ))}
              {canSeeTeam && owners.length > 1 && (
                <select
                  value={ownerFilter}
                  onChange={(e) => setOwnerFilter(e.target.value)}
                  className="ml-auto h-7 max-w-[120px] rounded-md border border-border bg-background px-1.5 text-[12px]"
                  aria-label="Filter by team member"
                >
                  <option value="">Everyone</option>
                  {owners.map(([id, name]) => (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-2 pb-2">
            {filtered.length === 0 && (
              <p className="px-2.5 py-6 text-center text-[12px] text-muted-foreground">
                {chats.length === 0 ? 'No WhatsApp chats yet.' : 'No chats match.'}
              </p>
            )}
            {filtered.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => select(c.id)}
                className={cn(
                  'flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2.5 text-left transition-colors hover:bg-muted/60',
                  c.id === selectedId && 'bg-primary/10',
                )}
              >
                <Avatar className="shrink-0">
                  <AvatarFallback className="bg-emerald-500/15 text-emerald-700">{getInitials(c.name)}</AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn('truncate text-[13px] font-medium text-foreground', c.awaitingReply > 0 && 'font-semibold')}>
                      {c.name}
                    </span>
                    <span className="shrink-0 text-[11px] text-muted-foreground">{formatListTime(c.last_message_at)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-[12px] text-muted-foreground">{c.lastMessagePreview}</span>
                    {c.awaitingReply > 0 && (
                      <Badge className="h-4.5 min-w-[18px] shrink-0 justify-center rounded-full bg-emerald-600 px-1 text-[10px] leading-none text-white">
                        {c.awaitingReply}
                      </Badge>
                    )}
                  </div>
                  {canSeeTeam && c.owner_id !== me.id && (
                    <span className="truncate text-[11px] text-muted-foreground/80">via {c.ownerName}</span>
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="border-t border-border p-3">
            <Button size="sm" className="w-full justify-start" disabled={!myAccount} onClick={() => setNewChatOpen(true)}>
              <Plus data-icon="inline-start" />
              New chat
            </Button>
          </div>
        </div>

        <div className={cn('min-w-0 flex-1 flex-col', active ? 'flex' : 'hidden md:flex')}>
          {active ? (
            <>
              <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 md:px-5">
                <div className="flex min-w-0 items-center gap-3">
                  <Button variant="ghost" size="icon-sm" className="md:hidden" aria-label="Back to chats" onClick={() => setSelectedId(null)}>
                    <X className="size-4" />
                  </Button>
                  <Avatar>
                    <AvatarFallback className="bg-emerald-500/15 text-emerald-700">{getInitials(active.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-[13px] font-semibold text-foreground">{active.name}</span>
                    <span className="truncate text-[12px] text-muted-foreground">
                      +{active.phone}
                      {active.accountNumber && ` · on ${active.accountNumber}`}
                      {active.owner_id !== me.id && ` (${active.ownerName})`}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {active.lead_id && (
                    <Button variant="outline" size="sm" render={<Link href={`/leads/${active.lead_id}`} />} nativeButton={false}>
                      Lead
                    </Button>
                  )}
                  {active.customer_id && (
                    <Button variant="outline" size="sm" render={<Link href={`/customers/${active.customer_id}`} />} nativeButton={false}>
                      Member
                    </Button>
                  )}
                </div>
              </div>

              <div ref={scrollRef} className="flex-1 overflow-y-auto bg-muted/20 px-4 py-4 md:px-5">
                {loadingMessages ? (
                  <div className="flex h-full items-center justify-center">
                    <Loader2 className="size-5 animate-spin text-muted-foreground" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex h-full items-center justify-center">
                    <p className="max-w-xs text-center text-[13px] text-muted-foreground">
                      No messages yet. Start with an approved template — WhatsApp doesn’t allow free text to someone who
                      hasn’t messaged you in the last 24 hours.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {messages.map((m, i) => {
                      const own = m.direction === 'outbound'
                      const prev = messages[i - 1]
                      const showDay = !prev || new Date(prev.created_at).toDateString() !== new Date(m.created_at).toDateString()
                      return (
                        <div key={m.id} className="flex flex-col gap-2">
                          {showDay && (
                            <div className="my-2 flex justify-center">
                              <span className="rounded-full bg-background px-3 py-1 text-[11px] text-muted-foreground shadow-sm">
                                {dayLabel(m.created_at)}
                              </span>
                            </div>
                          )}
                          <div className={cn('flex', own && 'justify-end')}>
                            <div
                              className={cn(
                                'max-w-[78%] rounded-2xl px-3 py-1.5 text-[13px] leading-relaxed shadow-sm',
                                own ? 'rounded-br-md bg-emerald-100 text-emerald-950 dark:bg-emerald-900/60 dark:text-emerald-50' : 'rounded-bl-md bg-background text-foreground',
                              )}
                            >
                              {m.media_url && (
                                <div className={cn(m.content && 'mb-1')}>
                                  <MessageAttachment path={m.media_url} isOwn={false} />
                                </div>
                              )}
                              {m.content && <span className="whitespace-pre-wrap break-words">{m.content}</span>}
                              <span className="ml-2 inline-flex translate-y-0.5 items-center gap-1 text-[10px] text-muted-foreground">
                                {formatTime(m.created_at)}
                                {own && <StatusTick status={m.status} />}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {!active.accountConnected ? (
                <div className="border-t border-border p-3 text-center text-[12px] text-muted-foreground">
                  This chat’s WhatsApp number is disconnected — {active.owner_id === me.id ? 'reconnect it' : 'ask them to reconnect'} in Settings → WhatsApp.
                </div>
              ) : windowOpen ? (
                <form onSubmit={handleSend} className="flex flex-col gap-2 border-t border-border p-3">
                  {attachment && (
                    <div className="flex items-center gap-2 self-start rounded-lg bg-muted px-2.5 py-1.5 text-[12px]">
                      <Paperclip className="size-3.5 shrink-0" />
                      <span className="max-w-[240px] truncate">{attachment.name}</span>
                      <button type="button" aria-label="Remove attachment" onClick={() => setAttachment(null)}>
                        <X className="size-3.5" />
                      </button>
                    </div>
                  )}
                  <input ref={fileInputRef} type="file" className="hidden" onChange={pickFile} />
                  <InputGroup className="h-auto min-h-9">
                    <InputGroupAddon align="inline-start">
                      <Button type="button" size="icon-sm" variant="ghost" aria-label="Attach a file" className="rounded-lg" onClick={() => fileInputRef.current?.click()}>
                        <Paperclip className="size-4" />
                      </Button>
                      <Button type="button" size="icon-sm" variant="ghost" aria-label="Send a template" className="rounded-lg" onClick={() => setTemplateOpen(true)}>
                        <FileText className="size-4" />
                      </Button>
                    </InputGroupAddon>
                    <InputGroupInput
                      placeholder={attachment ? 'Add a caption…' : 'Type a message…'}
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                    />
                    <InputGroupAddon align="inline-end">
                      <Button type="submit" size="icon-sm" aria-label="Send" className="rounded-lg bg-emerald-600 text-white hover:bg-emerald-600/90" disabled={(!draft.trim() && !attachment) || sending}>
                        {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                      </Button>
                    </InputGroupAddon>
                  </InputGroup>
                  <p className="px-1 text-[11px] text-muted-foreground">
                    Free replies allowed for {windowLeftH}h more — after that, use a template.
                  </p>
                </form>
              ) : (
                <div className="flex flex-col items-center gap-2 border-t border-border p-4 text-center">
                  <p className="text-[12px] text-muted-foreground">
                    {lastInboundAt
                      ? 'It’s been over 24 hours since their last message. Send an approved template to reopen the chat.'
                      : 'They haven’t messaged you yet. Start the conversation with an approved template.'}
                  </p>
                  <Button size="sm" className="bg-emerald-600 text-white hover:bg-emerald-600/90" onClick={() => setTemplateOpen(true)}>
                    <FileText data-icon="inline-start" />
                    Send template (1 credit)
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
              <WhatsAppIcon className="size-8 text-muted-foreground/60" />
              <p className="text-[13px] text-muted-foreground">Select a chat</p>
            </div>
          )}
        </div>
      </div>

      {active && (
        <TemplatePickerDialog
          open={templateOpen}
          onOpenChange={setTemplateOpen}
          conversationId={active.id}
          paramHint={active.name}
          onSubmit={async (template) => {
            const res = await safeCall(() => sendWhatsAppChatTemplate(active.id, template))
            if (!res.ok) {
              toast.error(res.message)
              return false
            }
            appendOwn(res.message as ChatMessage)
            toast.success('Template sent.')
            return true
          }}
        />
      )}
      <NewChatDialog open={newChatOpen} onOpenChange={setNewChatOpen} onOpened={select} />
    </div>
  )
}
