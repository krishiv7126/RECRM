'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Loader2, PanelLeft, Plus, Search, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Kbd } from '@/components/ui/kbd'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { CreateLeadDialog } from '@/components/leads/create-lead-dialog'
import { useConfirm } from '@/components/ui/use-confirm'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface SearchResult {
  id: string
  result_type: string
  title: string
  subtitle: string
}

interface NotificationRow {
  id: string
  type: string
  title: string
  body: string | null
  is_read: boolean
  related_type: string | null
  related_id: string | null
  created_at: string
}

const resultTypeRoutes: Record<string, string> = {
  lead: '/leads',
  customer: '/customers',
  property: '/properties',
  deal: '/deals',
}

// Tables with their own /[id] detail page get a deep link; the rest (deals is
// a kanban board, follow_ups/site_visits are list-only) go to their list page.
const relatedTypeRoutes: Record<string, (id: string | null) => string> = {
  leads: (id) => (id ? `/leads/${id}` : '/leads'),
  customers: (id) => (id ? `/customers/${id}` : '/customers'),
  properties: (id) => (id ? `/properties/${id}` : '/properties'),
  deals: () => '/deals',
  follow_ups: () => '/follow-ups',
  site_visits: () => '/site-visits',
  login_approval_queue: () => '/approvals',
}

function formatNotificationTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  const time = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })
  if (sameDay) return time
  return `${d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', timeZone: 'Asia/Kolkata' })}, ${time}`
}

export function DashboardTopbar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchBoxRef = useRef<HTMLDivElement>(null)

  const [notifications, setNotifications] = useState<NotificationRow[]>([])
  const [meId, setMeId] = useState<string | null>(null)
  const unreadCount = notifications.filter((n) => !n.is_read).length
  const { confirm, ConfirmDialog } = useConfirm()

  useEffect(() => {
    const supabase = createClient()
    let cancelled = false
    let channel: ReturnType<typeof supabase.channel> | null = null

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user || cancelled) return

      const { data: me } = await supabase.from('platform_users').select('id').eq('auth_user_id', user.id).single()
      if (!me || cancelled) return
      setMeId(me.id)

      const { data } = await supabase
        .from('notifications')
        .select('id, type, title, body, is_read, related_type, related_id, created_at')
        .eq('recipient_id', me.id)
        .order('created_at', { ascending: false })
        .limit(20)
      if (cancelled) return
      setNotifications(data ?? [])

      channel = supabase
        .channel(`notifications:${me.id}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${me.id}` },
          (payload) => setNotifications((prev) => [payload.new as NotificationRow, ...prev]),
        )
        .subscribe()
    }

    load()
    return () => {
      cancelled = true
      if (channel) supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }
    const timeout = setTimeout(async () => {
      setSearching(true)
      const supabase = createClient()
      const { data } = await supabase.rpc('fn_global_search', { p_query: query.trim(), p_limit: 8 })
      setResults(data ?? [])
      setSearching(false)
    }, 300)
    return () => clearTimeout(timeout)
  }, [query])

  async function markAsRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
    const supabase = createClient()
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
  }

  function handleNotificationClick(notification: NotificationRow) {
    if (!notification.is_read) markAsRead(notification.id)

    if (notification.type === 'approval_pending') {
      router.push('/approvals')
      return
    }
    const buildPath = notification.related_type ? relatedTypeRoutes[notification.related_type] : null
    if (buildPath) router.push(buildPath(notification.related_id))
  }

  async function markAllAsRead() {
    if (!meId || unreadCount === 0) return
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    const supabase = createClient()
    await supabase.from('notifications').update({ is_read: true }).eq('recipient_id', meId).eq('is_read', false)
  }

  async function clearAll() {
    if (!meId || notifications.length === 0) return
    const ok = await confirm({
      title: 'Clear all notifications?',
      description: 'Are you sure you want to clear all notifications? This action cannot be undone.',
      confirmLabel: 'Clear all',
      destructive: true,
    })
    if (!ok) return
    const prev = notifications
    setNotifications([])
    const supabase = createClient()
    const { error } = await supabase.from('notifications').delete().eq('recipient_id', meId)
    if (error) {
      setNotifications(prev)
      toast.error(error.message)
      return
    }
    toast.success('Notifications cleared')
  }

  function goToResult(result: SearchResult) {
    setShowResults(false)
    setQuery('')
    router.push(resultTypeRoutes[result.result_type] ?? '/dashboard')
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background/80 px-5 backdrop-blur-sm">
      <Button variant="ghost" size="icon" onClick={onToggleSidebar} aria-label="Toggle sidebar">
        <PanelLeft />
      </Button>

      <div ref={searchBoxRef} className="relative w-full max-w-sm">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search leads, customers, properties…"
          className="h-9 rounded-full border-border bg-card pl-8 pr-14 text-[13px]"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setShowResults(true)
          }}
          onFocus={() => setShowResults(true)}
        />
        <Kbd className="absolute right-2 top-1/2 -translate-y-1/2">⌘K</Kbd>

        {showResults && query.trim() && (
          <div className="absolute top-full left-0 z-30 mt-1.5 w-full overflow-hidden rounded-xl border border-border bg-card shadow-lg">
            {searching ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              </div>
            ) : results.length === 0 ? (
              <p className="px-3 py-3 text-[13px] text-muted-foreground">No results.</p>
            ) : (
              results.map((r) => (
                <button
                  key={`${r.result_type}-${r.id}`}
                  type="button"
                  onClick={() => goToResult(r)}
                  className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left hover:bg-muted"
                >
                  <span className="text-[13px] font-medium text-foreground">{r.title}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {r.result_type} · {r.subtitle}
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="secondary"
          className="rounded-full bg-secondary text-foreground hover:bg-secondary/80"
          onClick={() => router.push('/ai-workspace/copilot')}
        >
          <Sparkles data-icon="inline-start" className="text-primary" />
          Ask AI
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
                <Bell />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-danger text-[10px] font-semibold text-white">
                    {unreadCount}
                  </span>
                )}
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuGroup>
              <div className="flex items-center justify-between gap-2 px-2 py-1.5">
                <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={unreadCount === 0}
                    onClick={markAllAsRead}
                    className="text-[11px] font-medium text-primary hover:underline disabled:pointer-events-none disabled:text-muted-foreground disabled:no-underline"
                  >
                    Mark all read
                  </button>
                  <span className="text-[11px] text-muted-foreground">·</span>
                  <button
                    type="button"
                    disabled={notifications.length === 0}
                    onClick={clearAll}
                    className="text-[11px] font-medium text-destructive hover:underline disabled:pointer-events-none disabled:text-muted-foreground disabled:no-underline"
                  >
                    Clear all
                  </button>
                </div>
              </div>
              <DropdownMenuSeparator />
              {notifications.length === 0 ? (
                <p className="px-2 py-3 text-[13px] text-muted-foreground">No notifications yet.</p>
              ) : (
                notifications.map((n) => {
                  const clickable = n.type === 'approval_pending' || (n.related_type && relatedTypeRoutes[n.related_type])
                  return (
                    <DropdownMenuItem
                      key={n.id}
                      className={cn('flex flex-col items-start gap-0.5 py-2', !clickable && 'cursor-default')}
                      onClick={() => handleNotificationClick(n)}
                    >
                      <span className="flex w-full items-center gap-2">
                        <span className={cn('size-1.5 shrink-0 rounded-full', n.is_read ? 'bg-transparent' : 'bg-primary')} />
                        <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-foreground">{n.title}</span>
                        <span className="shrink-0 text-[11px] text-muted-foreground">{formatNotificationTime(n.created_at)}</span>
                      </span>
                      {n.body && <span className="pl-3.5 text-[12px] text-muted-foreground">{n.body}</span>}
                    </DropdownMenuItem>
                  )
                })
              )}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <CreateLeadDialog
          trigger={
            <Button className="rounded-full">
              <Plus data-icon="inline-start" />
              New Lead
            </Button>
          }
        />
      </div>
      <ConfirmDialog />
    </header>
  )
}
