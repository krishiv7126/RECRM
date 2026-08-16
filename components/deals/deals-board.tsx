'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LayoutGrid, MoreHorizontal, Plus, Table2, User } from 'lucide-react'
import { PageHeader } from '@/components/dashboard/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DealDialog } from '@/components/deals/deal-dialog'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { Database } from '@/lib/supabase/types'
import type { DealWithRelations } from '@/lib/deals/get-deals-data'

type DealStage = Database['public']['Enums']['deal_stage']

const stageOrder: DealStage[] = ['new', 'qualified', 'proposal', 'negotiation', 'contract', 'booked']

const stageMeta: Record<DealStage, { label: string; dot: string }> = {
  new: { label: 'New', dot: 'bg-muted-foreground' },
  qualified: { label: 'Qualified', dot: 'bg-chart-2' },
  proposal: { label: 'Proposal', dot: 'bg-primary' },
  negotiation: { label: 'Negotiation', dot: 'bg-chart-4' },
  contract: { label: 'Contract', dot: 'bg-chart-5' },
  booked: { label: 'Booked', dot: 'bg-success' },
  lost: { label: 'Lost', dot: 'bg-destructive' },
}

function formatCr(amount: number) {
  return amount >= 10000000 ? `₹${(amount / 10000000).toFixed(1)}Cr` : `₹${Math.round(amount / 100000)}L`
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', { month: 'short', day: '2-digit' })
}

function getInitials(name: string) {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
}

// Seed data — the original mock deals, now inserted as real starter rows the first
// time an org has no deals, so the pipeline isn't empty and stays fully drag/droppable.
const SEED_DEALS: { title: string; value: number; expected_close_date: string; stage: DealStage }[] = [
  { title: '3BHK Skyline Residency, Powai', value: 11500000, expected_close_date: '2026-09-12', stage: 'new' },
  { title: '1BHK Studio, Jubilee Hills', value: 4600000, expected_close_date: '2026-09-20', stage: 'new' },
  { title: 'Villa Devanahalli Greens', value: 16800000, expected_close_date: '2026-09-18', stage: 'qualified' },
  { title: '3BHK Andheri West Heights', value: 17500000, expected_close_date: '2026-09-25', stage: 'qualified' },
  { title: '3BHK Jubilee Hills Enclave', value: 12200000, expected_close_date: '2026-10-02', stage: 'proposal' },
  { title: '2BHK Baner Riverside', value: 6800000, expected_close_date: '2026-09-28', stage: 'proposal' },
  { title: '2BHK DLF Phase 3', value: 7200000, expected_close_date: '2026-09-30', stage: 'proposal' },
  { title: '2BHK Sector 62 Residency', value: 8400000, expected_close_date: '2026-10-05', stage: 'negotiation' },
  { title: '3BHK Whitefield Grand', value: 15200000, expected_close_date: '2026-10-08', stage: 'negotiation' },
  { title: '2BHK Wakad Meadows', value: 5900000, expected_close_date: '2026-10-10', stage: 'contract' },
  { title: 'Luxury Villa ECR', value: 22500000, expected_close_date: '2026-08-30', stage: 'booked' },
  { title: '3BHK Powai Crest', value: 17800000, expected_close_date: '2026-09-05', stage: 'booked' },
]

export function DealsBoard({
  initialDeals,
  customers,
  properties,
}: {
  initialDeals: DealWithRelations[]
  customers: { id: string; full_name: string }[]
  properties: { id: string; title: string }[]
}) {
  const router = useRouter()
  const [deals, setDeals] = useState(initialDeals)
  const [view, setView] = useState<'board' | 'table'>('board')
  const [dragOverStage, setDragOverStage] = useState<DealStage | null>(null)
  const [editingDeal, setEditingDeal] = useState<DealWithRelations | null>(null)

  useEffect(() => {
    setDeals(initialDeals)
  }, [initialDeals])

  useEffect(() => {
    if (initialDeals.length > 0) return
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

      await supabase.from('deals').insert(
        SEED_DEALS.map((d) => ({
          org_id: orgId,
          owner_id: ownerId,
          title: d.title,
          value: d.value,
          expected_close_date: d.expected_close_date,
          stage: d.stage,
        })),
      )
      if (!cancelled) router.refresh()
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const boardDeals = useMemo(() => deals.filter((d) => d.stage !== 'lost'), [deals])
  const totalValue = useMemo(() => boardDeals.reduce((sum, d) => sum + (d.value ?? 0), 0), [boardDeals])

  async function updateStage(deal: DealWithRelations, stage: DealStage) {
    if (deal.stage === stage) return
    const prevDeals = deals
    setDeals((prev) => prev.map((d) => (d.id === deal.id ? { ...d, stage } : d)))

    const supabase = createClient()
    const { error } = await supabase
      .from('deals')
      .update({
        stage,
        closed_at: stage === 'booked' || stage === 'lost' ? new Date().toISOString() : null,
      })
      .eq('id', deal.id)

    if (error) {
      setDeals(prevDeals)
      window.alert(error.message)
    }
  }

  async function handleDelete(deal: DealWithRelations) {
    if (!window.confirm(`Delete deal "${deal.title}"? This cannot be undone.`)) return
    const supabase = createClient()
    const { error } = await supabase.from('deals').delete().eq('id', deal.id)
    if (error) {
      window.alert(error.message)
      return
    }
    setDeals((prev) => prev.filter((d) => d.id !== deal.id))
  }

  function handleDragStart(e: React.DragEvent, deal: DealWithRelations) {
    e.dataTransfer.setData('text/plain', deal.id)
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDrop(e: React.DragEvent, stage: DealStage) {
    e.preventDefault()
    setDragOverStage(null)
    const dealId = e.dataTransfer.getData('text/plain')
    const deal = deals.find((d) => d.id === dealId)
    if (deal) updateStage(deal, stage)
  }

  function dealActionsMenu(deal: DealWithRelations) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon-sm" aria-label={`More actions for ${deal.code}`}>
              <MoreHorizontal className="size-3.5" />
            </Button>
          }
        />
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditingDeal(deal)}>Edit deal</DropdownMenuItem>
          {deal.stage !== 'lost' && (
            <DropdownMenuItem onClick={() => updateStage(deal, 'lost')}>Mark as lost</DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => handleDelete(deal)}>
            Delete deal
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          crumbs={[{ label: 'Sales' }, { label: 'Pipeline' }, { label: 'Deals' }]}
          title="Deals Pipeline"
          description={
            view === 'board'
              ? `Drag deals across stages · ${formatCr(totalValue)} in play`
              : `${deals.length} deals · ${formatCr(totalValue)} in play`
          }
        />
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setView((v) => (v === 'board' ? 'table' : 'board'))}>
            {view === 'board' ? <Table2 data-icon="inline-start" /> : <LayoutGrid data-icon="inline-start" />}
            {view === 'board' ? 'Table view' : 'Board view'}
          </Button>
          <DealDialog
            trigger={
              <Button size="sm" className="bg-foreground text-background hover:bg-foreground/85">
                <Plus data-icon="inline-start" />
                New Deal
              </Button>
            }
            customers={customers}
            properties={properties}
          />
        </div>
      </div>

      <DealDialog
        open={!!editingDeal}
        onOpenChange={(next) => {
          if (!next) setEditingDeal(null)
        }}
        customers={customers}
        properties={properties}
        deal={editingDeal ?? undefined}
      />

      {view === 'board' ? (
        <div className="-mx-1 flex flex-1 gap-4 overflow-x-auto px-1 pb-2">
          {stageOrder.map((stage) => {
            const stageDeals = boardDeals.filter((deal) => deal.stage === stage)
            const stageValue = stageDeals.reduce((sum, deal) => sum + (deal.value ?? 0), 0)
            const meta = stageMeta[stage]

            return (
              <div
                key={stage}
                className={cn(
                  'flex w-72 shrink-0 flex-col gap-3 rounded-xl transition-colors',
                  dragOverStage === stage && 'bg-primary/5 ring-2 ring-primary/30',
                )}
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragOverStage(stage)
                }}
                onDragLeave={() => setDragOverStage((s) => (s === stage ? null : s))}
                onDrop={(e) => handleDrop(e, stage)}
              >
                <div className="flex items-center justify-between rounded-xl bg-card px-3 py-2.5 ring-1 ring-border">
                  <div className="flex items-center gap-2">
                    <span className={cn('size-2 shrink-0 rounded-full', meta.dot)} />
                    <span className="text-[13px] font-semibold text-foreground">{meta.label}</span>
                    <Badge variant="outline" className="rounded-full bg-muted px-1.5 text-[11px] text-muted-foreground">
                      {stageDeals.length}
                    </Badge>
                  </div>
                  <span className="text-[12px] font-medium text-muted-foreground">{formatCr(stageValue)}</span>
                </div>

                <div className="flex flex-col gap-2.5">
                  {stageDeals.map((deal) => (
                    <div
                      key={deal.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, deal)}
                      className="group flex cursor-grab flex-col gap-3 rounded-xl bg-card p-3.5 ring-1 ring-border transition-all hover:-translate-y-0.5 hover:shadow-md active:cursor-grabbing"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          {deal.code}
                        </span>
                        <div className="opacity-0 transition-opacity group-hover:opacity-100 data-[popup-open]:opacity-100">
                          {dealActionsMenu(deal)}
                        </div>
                      </div>

                      <p className="text-[13px] font-semibold leading-snug text-foreground text-pretty">{deal.title}</p>

                      <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                        <User className="size-3.5 shrink-0" />
                        <span className="truncate">{deal.customer?.full_name ?? '—'}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="font-heading text-[15px] font-bold text-foreground">
                          {formatCr(deal.value ?? 0)}
                        </span>
                        <span className="text-[12px] text-muted-foreground">{formatDate(deal.expected_close_date)}</span>
                      </div>

                      <div className="flex items-center gap-2 border-t border-border/70 pt-2.5">
                        <Avatar size="sm">
                          <AvatarFallback>{getInitials(deal.owner?.full_name ?? '?')}</AvatarFallback>
                        </Avatar>
                        <span className="truncate text-[12px] text-foreground/80">{deal.owner?.full_name ?? '—'}</span>
                      </div>
                    </div>
                  ))}

                  <DealDialog
                    trigger={
                      <button
                        type="button"
                        className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-border py-2.5 text-[12px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                      >
                        <Plus className="size-3.5" />
                        Add deal
                      </button>
                    }
                    customers={customers}
                    properties={properties}
                    defaultStage={stage}
                  />
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-border">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-border text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3">Deal</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Value</th>
                  <th className="px-4 py-3">Stage</th>
                  <th className="px-4 py-3">Close date</th>
                  <th className="px-4 py-3">Owner</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {deals.map((deal) => (
                  <tr key={deal.id} className="border-b border-border/70 transition-colors last:border-b-0 hover:bg-accent/50">
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{deal.title}</span>
                        <span className="text-[12px] text-muted-foreground">{deal.code}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-foreground/80">{deal.customer?.full_name ?? '—'}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-foreground">
                      {formatCr(deal.value ?? 0)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <Badge variant="outline" className="rounded-full">
                        <span className={cn('mr-1.5 inline-block size-1.5 rounded-full', stageMeta[deal.stage].dot)} />
                        {stageMeta[deal.stage].label}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-foreground/80">{formatDate(deal.expected_close_date)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-foreground/80">{deal.owner?.full_name ?? '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">{dealActionsMenu(deal)}</div>
                    </td>
                  </tr>
                ))}
                {deals.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                      No deals yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}
