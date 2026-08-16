'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Calendar,
  Clock,
  Filter,
  Mail,
  MessageCircle,
  MoreHorizontal,
  Phone,
  Plus,
  Search,
} from 'lucide-react'
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
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { Database } from '@/lib/supabase/types'
import type { FollowUpWithRelations } from '@/lib/follow-ups/get-follow-ups-data'

type FollowUpType = Database['public']['Enums']['follow_up_type']
type FollowUpStatus = Database['public']['Enums']['follow_up_status']

function getInitials(name: string) {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
}

const typeConfig: Record<FollowUpType, { icon: typeof Phone; className: string; label: string }> = {
  call: { icon: Phone, className: 'bg-primary/15 text-primary', label: 'Call' },
  whatsapp: { icon: MessageCircle, className: 'bg-success/15 text-success', label: 'WhatsApp' },
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
  done: 'Done',
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

type FilterTab = 'all' | 'pending' | 'overdue' | 'done'

const SEED_FOLLOW_UPS: {
  type: FollowUpType
  notes: string
  day: number
  hour: number
  minute: number
  status: FollowUpStatus
}[] = [
  { type: 'call', notes: 'Confirm budget flexibility before sending revised proposal.', day: 0, hour: 10, minute: 0, status: 'pending' },
  { type: 'whatsapp', notes: 'Share site visit photos and floor plan PDF.', day: 0, hour: 9, minute: 30, status: 'pending' },
  { type: 'email', notes: 'Send NRI documentation checklist and payment plan options.', day: 0, hour: 14, minute: 0, status: 'pending' },
  { type: 'meeting', notes: 'Site walkthrough for the commercial unit with architect.', day: 0, hour: 16, minute: 30, status: 'pending' },
  { type: 'call', notes: 'Discuss loan pre-approval status before negotiation.', day: -1, hour: 11, minute: 0, status: 'missed' },
  { type: 'whatsapp', notes: 'Follow up on investment shortlist sent last week.', day: 1, hour: 9, minute: 0, status: 'pending' },
  { type: 'email', notes: 'Send referral thank-you note and loyalty program details.', day: -5, hour: 15, minute: 0, status: 'done' },
  { type: 'call', notes: 'Qualify budget range and preferred possession timeline.', day: 0, hour: 12, minute: 0, status: 'pending' },
  { type: 'meeting', notes: 'Contract signing walkthrough at the sales office.', day: 2, hour: 11, minute: 30, status: 'pending' },
  { type: 'whatsapp', notes: 'Send updated proposal with revised pricing.', day: -6, hour: 17, minute: 0, status: 'done' },
]

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
  const [followUps, setFollowUps] = useState(initialFollowUps)
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [query, setQuery] = useState('')
  const [showFilter, setShowFilter] = useState(false)
  const [typeFilter, setTypeFilter] = useState('')
  const [editingFollowUp, setEditingFollowUp] = useState<FollowUpWithRelations | null>(null)

  useEffect(() => {
    setFollowUps(initialFollowUps)
  }, [initialFollowUps])

  useEffect(() => {
    if (initialFollowUps.length > 0) return
    let cancelled = false
    ;(async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user || cancelled) return
      const { data: me } = await supabase
        .from('platform_users')
        .select('id, org_id')
        .eq('auth_user_id', user.id)
        .single()
      if (!me?.org_id || cancelled) return
      const orgId = me.org_id
      const ownerId = me.id

      const categories = [
        { kind: 'lead' as const, records: leads },
        { kind: 'customer' as const, records: customers },
        { kind: 'deal' as const, records: deals },
      ].filter((c) => c.records.length > 0)

      const now = new Date()

      await supabase.from('follow_ups').insert(
        SEED_FOLLOW_UPS.map((f, i) => {
          const dueDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + f.day, f.hour, f.minute)
          let lead_id: string | null = null
          let customer_id: string | null = null
          let deal_id: string | null = null

          if (categories.length > 0) {
            const cat = categories[i % categories.length]
            const rec = cat.records[Math.floor(i / categories.length) % cat.records.length]
            if (cat.kind === 'lead') lead_id = rec.id
            if (cat.kind === 'customer') customer_id = rec.id
            if (cat.kind === 'deal') deal_id = rec.id
          }

          return {
            org_id: orgId,
            owner_id: ownerId,
            type: f.type,
            status: f.status,
            due_at: dueDate.toISOString(),
            notes: f.notes,
            completed_at: f.status === 'done' ? dueDate.toISOString() : null,
            lead_id,
            customer_id,
            deal_id,
          }
        }),
      )
      if (!cancelled) router.refresh()
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const counts = useMemo(() => {
    const now = Date.now()
    return {
      all: followUps.length,
      pending: followUps.filter((f) => f.status === 'pending').length,
      overdue: followUps.filter((f) => f.status !== 'done' && new Date(f.due_at).getTime() < now).length,
      done: followUps.filter((f) => f.status === 'done').length,
    }
  }, [followUps])

  const types = useMemo(() => Array.from(new Set(followUps.map((f) => f.type))), [followUps])

  const filteredFollowUps = useMemo(() => {
    const now = Date.now()
    return followUps.filter((f) => {
      const overdue = f.status !== 'done' && new Date(f.due_at).getTime() < now
      const matchesTab =
        activeTab === 'all' ||
        (activeTab === 'pending' && f.status === 'pending') ||
        (activeTab === 'overdue' && overdue) ||
        (activeTab === 'done' && f.status === 'done')

      const q = query.trim().toLowerCase()
      const matchesQuery =
        q.length === 0 ||
        linkedRecordLabel(f).toLowerCase().includes(q) ||
        (f.notes ?? '').toLowerCase().includes(q)

      const matchesType = !typeFilter || f.type === typeFilter

      return matchesTab && matchesQuery && matchesType
    })
  }, [followUps, activeTab, query, typeFilter])

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: counts.all },
    { key: 'pending', label: 'Pending', count: counts.pending },
    { key: 'overdue', label: 'Overdue', count: counts.overdue },
    { key: 'done', label: 'Done', count: counts.done },
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
      window.alert(error.message)
    }
  }

  async function handleDelete(followUp: FollowUpWithRelations) {
    if (!window.confirm('Delete this follow-up? This cannot be undone.')) return
    const supabase = createClient()
    const { error } = await supabase.from('follow_ups').delete().eq('id', followUp.id)
    if (error) {
      window.alert(error.message)
      return
    }
    setFollowUps((prev) => prev.filter((f) => f.id !== followUp.id))
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
            {typeFilter && (
              <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                1
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
                <div className="flex justify-between">
                  <Button variant="ghost" size="sm" onClick={() => setTypeFilter('')}>
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

              <div className="flex shrink-0 items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={followUp.status === 'done'}
                  className="text-[12px]"
                  onClick={() => handleMarkDone(followUp)}
                >
                  Mark done
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
    </div>
  )
}
