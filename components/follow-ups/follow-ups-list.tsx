'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Calendar,
  Clock,
  Filter,
  Mail,
  MoreHorizontal,
  Phone,
  Plus,
  Search,
} from 'lucide-react'
import { toast } from 'sonner'
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon'
import { PageHeader } from '@/components/dashboard/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { FollowUpDialog } from '@/components/follow-ups/follow-up-dialog'
import { CelebrationBurst } from '@/components/ui/celebration-burst'
import { useConfirm } from '@/components/ui/use-confirm'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { Database } from '@/lib/supabase/types'
import type { FollowUpWithRelations } from '@/lib/follow-ups/get-follow-ups-data'

type FollowUpType = Database['public']['Enums']['follow_up_type']
type FollowUpStatus = Database['public']['Enums']['follow_up_status']

function getInitials(name: string) {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
}

const typeConfig: Record<
  FollowUpType,
  { icon: React.ComponentType<{ className?: string }>; className: string; label: string }
> = {
  call: { icon: Phone, className: 'bg-primary/15 text-primary', label: 'Call' },
  whatsapp: { icon: WhatsAppIcon, className: 'bg-success/15 text-success', label: 'WhatsApp' },
  email: { icon: Mail, className: 'bg-secondary text-secondary-foreground', label: 'Email' },
  meeting: { icon: Calendar, className: 'border border-primary/40 bg-transparent text-primary', label: 'Meeting' },
  other: { icon: Clock, className: 'bg-muted text-muted-foreground', label: 'Other' },
}

const statusStyles: Record<FollowUpStatus, string> = {
  pending: 'bg-muted text-muted-foreground',
  done: 'bg-success/15 text-success',
  missed: 'bg-destructive/10 text-destructive',
}

const statusLabels: Record<FollowUpStatus, string> = {
  pending: 'Pending',
  done: 'Complete',
  missed: 'Missed',
}

function formatDueLabel(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate())
  const diffDays = Math.round((startOfDay(d).getTime() - startOfDay(now).getTime()) / 86400000)
  const time = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })
  if (diffDays === 0) return `Today, ${time}`
  if (diffDays === 1) return `Tomorrow, ${time}`
  if (diffDays === -1) return `Yesterday, ${time}`
  if (diffDays > 1 && diffDays < 7) return `${d.toLocaleDateString('en-IN', { weekday: 'short' })}, ${time}`
  return `${d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}, ${time}`
}

function linkedRecordLabel(fu: FollowUpWithRelations) {
  if (fu.lead?.full_name) return fu.lead.full_name
  if (fu.customer?.full_name) return fu.customer.full_name
  if (fu.deal) return `${fu.deal.code} · ${fu.deal.title}`
  return '—'
}

type FilterTab = 'all' | 'today' | 'pending' | 'overdue' | 'done'

function isToday(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  return (
    d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
  )
}

export function FollowUpsList({
  initialFollowUps,
  leads,
  customers,
  deals,
  owners,
}: {
  initialFollowUps: FollowUpWithRelations[]
  leads: { id: string; full_name: string }[]
  customers: { id: string; full_name: string }[]
  deals: { id: string; code: string; title: string }[]
  owners: { id: string; full_name: string }[]
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialTab = searchParams.get('tab')
  const [followUps, setFollowUps] = useState(initialFollowUps)
  const [activeTab, setActiveTab] = useState<FilterTab>(
    initialTab === 'today' || initialTab === 'pending' || initialTab === 'overdue' || initialTab === 'done'
      ? initialTab
      : 'all',
  )
  const [query, setQuery] = useState('')
  const [showFilter, setShowFilter] = useState(false)
  const [typeFilter, setTypeFilter] = useState('')
  const [ownerFilter, setOwnerFilter] = useState('')
  const [editingFollowUp, setEditingFollowUp] = useState<FollowUpWithRelations | null>(null)
  const [celebratingId, setCelebratingId] = useState<string | null>(null)
  const { confirm, ConfirmDialog } = useConfirm()

  useEffect(() => {
    setFollowUps(initialFollowUps)
  }, [initialFollowUps])

  // New/updated follow-ups should appear without a manual reload. Postgres
  // Changes + RLS is best-effort (see approvals-list.tsx), so a 15s poll
  // backs it up.
  useEffect(() => {
    let cancelled = false
    const supabase = createClient()
    const channel = supabase.channel('follow-ups-live')

    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'follow_ups' }, () => {
      if (cancelled) return
      router.refresh()
    })
    channel.subscribe()

    const poll = setInterval(() => {
      if (!cancelled) router.refresh()
    }, 15000)

    return () => {
      cancelled = true
      clearInterval(poll)
      supabase.removeChannel(channel)
    }
  }, [router])

  useEffect(() => {
    setFollowUps(initialFollowUps)
  }, [initialFollowUps])

  const counts = useMemo(() => {
    const now = Date.now()
    return {
      all: followUps.length,
      today: followUps.filter((f) => f.status !== 'done' && isToday(f.due_at)).length,
      pending: followUps.filter((f) => f.status === 'pending').length,
      overdue: followUps.filter((f) => f.status !== 'done' && new Date(f.due_at).getTime() < now).length,
      // Complete tab is a daily log, not lifetime history — only today's completions count.
      done: followUps.filter((f) => f.status === 'done' && f.completed_at && isToday(f.completed_at)).length,
    }
  }, [followUps])

  const types = useMemo(() => Array.from(new Set(followUps.map((f) => f.type))), [followUps])

  const filteredFollowUps = useMemo(() => {
    const now = Date.now()
    return followUps.filter((f) => {
      const overdue = f.status !== 'done' && new Date(f.due_at).getTime() < now
      const matchesTab =
        activeTab === 'all' ||
        (activeTab === 'today' && f.status !== 'done' && isToday(f.due_at)) ||
        (activeTab === 'pending' && f.status === 'pending') ||
        (activeTab === 'overdue' && overdue) ||
        (activeTab === 'done' && f.status === 'done' && !!f.completed_at && isToday(f.completed_at))

      const q = query.trim().toLowerCase()
      const matchesQuery =
        q.length === 0 ||
        linkedRecordLabel(f).toLowerCase().includes(q) ||
        (f.notes ?? '').toLowerCase().includes(q)

      const matchesType = !typeFilter || f.type === typeFilter
      const matchesOwner = !ownerFilter || f.owner_id === ownerFilter

      return matchesTab && matchesQuery && matchesType && matchesOwner
    })
  }, [followUps, activeTab, query, typeFilter, ownerFilter])

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: counts.all },
    { key: 'today', label: 'Today', count: counts.today },
    { key: 'pending', label: 'Pending', count: counts.pending },
    { key: 'overdue', label: 'Overdue', count: counts.overdue },
    { key: 'done', label: 'Complete', count: counts.done },
  ]

  async function handleMarkDone(followUp: FollowUpWithRelations) {
    const prev = followUps
    setFollowUps((p) => p.map((f) => (f.id === followUp.id ? { ...f, status: 'done' as FollowUpStatus } : f)))
    const supabase = createClient()
    const { error } = await supabase
      .from('follow_ups')
      .update({ status: 'done', completed_at: new Date().toISOString() })
      .eq('id', followUp.id)
    if (error) {
      setFollowUps(prev)
      toast.error(error.message)
      return
    }
    toast.success('Follow-up marked complete')
    setCelebratingId(followUp.id)
    setTimeout(() => setCelebratingId((id) => (id === followUp.id ? null : id)), 900)
  }

  async function handleDelete(followUp: FollowUpWithRelations) {
    const ok = await confirm({
      title: 'Delete follow-up?',
      description: 'Are you sure you want to delete this follow-up? This action cannot be undone.',
      confirmLabel: 'Delete',
      destructive: true,
    })
    if (!ok) return
    const supabase = createClient()
    const { error } = await supabase.from('follow_ups').delete().eq('id', followUp.id)
    if (error) {
      toast.error(error.message)
      return
    }
    setFollowUps((prev) => prev.filter((f) => f.id !== followUp.id))
    toast.success('Follow-up deleted')
  }

  function handleViewRecord(followUp: FollowUpWithRelations) {
    if (followUp.lead_id) router.push(`/leads/${followUp.lead_id}`)
    else if (followUp.customer_id) router.push(`/customers/${followUp.customer_id}`)
    else if (followUp.deal_id) router.push('/deals')
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          crumbs={[{ label: 'Sales' }, { label: 'Pipeline' }, { label: 'Follow-ups' }]}
          title="Follow-ups"
          description={`${counts.pending} pending · ${counts.overdue} overdue`}
        />
        <div className="flex shrink-0 items-center gap-2">
          <FollowUpDialog
            trigger={
              <Button size="sm" className="bg-foreground text-background hover:bg-foreground/85">
                <Plus data-icon="inline-start" />
                New Follow-up
              </Button>
            }
            leads={leads}
            customers={customers}
            deals={deals}
            owners={owners}
          />
        </div>
      </div>

      <FollowUpDialog
        open={!!editingFollowUp}
        onOpenChange={(next) => {
          if (!next) setEditingFollowUp(null)
        }}
        leads={leads}
        customers={customers}
        deals={deals}
        owners={owners}
        followUp={editingFollowUp ?? undefined}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors',
                activeTab === tab.key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-muted-foreground ring-1 ring-border hover:text-foreground',
              )}
            >
              {tab.label}
              <span
                className={cn(
                  'flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-semibold',
                  activeTab === tab.key ? 'bg-primary-foreground/20' : 'bg-muted text-muted-foreground',
                )}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="relative flex items-center gap-2">
          <InputGroup className="w-56">
            <InputGroupAddon>
              <Search className="size-4" />
            </InputGroupAddon>
            <InputGroupInput placeholder="Search follow-ups…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </InputGroup>
          <Button variant="outline" size="sm" onClick={() => setShowFilter((v) => !v)}>
            <Filter data-icon="inline-start" />
            Filter
            {(typeFilter || ownerFilter) && (
              <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                {[typeFilter, ownerFilter].filter(Boolean).length}
              </span>
            )}
          </Button>

          {showFilter && (
            <div className="absolute top-full right-0 z-30 mt-1.5 w-56 rounded-xl border border-border bg-card p-4 shadow-lg">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-foreground/80">Type</label>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-[13px] outline-none dark:bg-input/30"
                  >
                    <option value="">Any</option>
                    {types.map((t) => (
                      <option key={t} value={t}>
                        {typeConfig[t].label}
                      </option>
                    ))}
                  </select>
                </div>
                {owners.length > 1 && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-medium text-foreground/80">Employee</label>
                    <select
                      value={ownerFilter}
                      onChange={(e) => setOwnerFilter(e.target.value)}
                      className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-[13px] outline-none dark:bg-input/30"
                    >
                      <option value="">Everyone</option>
                      {owners.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.full_name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="flex justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setTypeFilter('')
                      setOwnerFilter('')
                    }}
                  >
                    Clear
                  </Button>
                  <Button size="sm" onClick={() => setShowFilter(false)}>
                    Apply
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {filteredFollowUps.map((followUp) => {
          const TypeIcon = typeConfig[followUp.type].icon
          const isOverdue = followUp.status !== 'done' && new Date(followUp.due_at).getTime() < Date.now()
          const hasRecord = !!(followUp.lead_id || followUp.customer_id || followUp.deal_id)
          return (
            <div
              key={followUp.id}
              className="flex items-center gap-4 rounded-2xl bg-card px-4 py-3.5 ring-1 ring-border transition-colors hover:bg-accent/40"
            >
              <div
                className={cn(
                  'flex size-9 shrink-0 items-center justify-center rounded-full',
                  typeConfig[followUp.type].className,
                )}
              >
                <TypeIcon className="size-4" />
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate font-medium text-foreground">{linkedRecordLabel(followUp)}</span>
                <span className="truncate text-[12px] text-muted-foreground">{followUp.notes ?? '—'}</span>
              </div>

              <div
                className={cn(
                  'flex shrink-0 items-center gap-1.5 text-[12px]',
                  isOverdue ? 'font-semibold text-destructive' : 'text-muted-foreground',
                )}
              >
                <Clock className="size-3.5" />
                {formatDueLabel(followUp.due_at)}
              </div>

              <div className="hidden shrink-0 items-center gap-2 sm:flex">
                <Avatar size="sm">
                  <AvatarFallback>{getInitials(followUp.owner?.full_name ?? '?')}</AvatarFallback>
                </Avatar>
                <span className="text-[13px] text-foreground/80">{followUp.owner?.full_name ?? '—'}</span>
              </div>

              <Badge variant="outline" className={cn('shrink-0 rounded-full', statusStyles[followUp.status])}>
                {statusLabels[followUp.status]}
              </Badge>

              <div className="relative flex shrink-0 items-center gap-1">
                <CelebrationBurst show={celebratingId === followUp.id} />
                <Button
                  variant="outline"
                  size="sm"
                  disabled={followUp.status === 'done'}
                  className="text-[12px]"
                  onClick={() => handleMarkDone(followUp)}
                >
                  Mark complete
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button variant="ghost" size="icon-sm" aria-label={`More actions for ${linkedRecordLabel(followUp)}`}>
                        <MoreHorizontal className="size-3.5" />
                      </Button>
                    }
                  />
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem disabled={!hasRecord} onClick={() => handleViewRecord(followUp)}>
                      View record
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setEditingFollowUp(followUp)}>Reschedule</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setEditingFollowUp(followUp)}>Reassign owner</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" onClick={() => handleDelete(followUp)}>
                      Delete follow-up
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )
        })}

        {filteredFollowUps.length === 0 && (
          <div className="rounded-2xl bg-card px-4 py-12 text-center text-muted-foreground ring-1 ring-border">
            No follow-ups match your filters.
          </div>
        )}
      </div>
      <ConfirmDialog />
    </div>
  )
}
