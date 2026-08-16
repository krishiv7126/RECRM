'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Calendar, Clock, Filter, MoreHorizontal, Search } from 'lucide-react'
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
import { SiteVisitDialog } from '@/components/site-visits/site-visit-dialog'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { Database } from '@/lib/supabase/types'
import type { SiteVisitWithRelations } from '@/lib/site-visits/get-site-visits-data'

type VisitStatus = Database['public']['Enums']['site_visit_status']

function getInitials(name: string) {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
}

const statusMeta: Record<VisitStatus, { label: string; badge: string }> = {
  scheduled: { label: 'Scheduled', badge: 'bg-chart-2/15 text-chart-2' },
  completed: { label: 'Completed', badge: 'bg-success/15 text-success' },
  cancelled: { label: 'Cancelled', badge: 'bg-muted text-muted-foreground' },
  no_show: { label: 'No Show', badge: 'bg-destructive/10 text-destructive' },
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function formatDateLabel(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(now.getDate() + 1)
  if (isSameDay(d, now)) return 'Today'
  if (isSameDay(d, tomorrow)) return 'Tomorrow'
  const diffDays = Math.round((d.getTime() - now.getTime()) / 86400000)
  if (diffDays > 1 && diffDays < 7) return d.toLocaleDateString('en-IN', { weekday: 'short' })
  return d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: '2-digit' })
}

function formatTimeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function visitorName(visit: SiteVisitWithRelations) {
  return visit.lead?.full_name ?? visit.customer?.full_name ?? '—'
}

function propertyTitle(visit: SiteVisitWithRelations) {
  return visit.property?.title ?? 'No property linked'
}

type FilterTab = 'all' | VisitStatus

export function SiteVisitsList({
  initialVisits,
  leads,
  customers,
  properties,
  owners,
}: {
  initialVisits: SiteVisitWithRelations[]
  leads: { id: string; full_name: string }[]
  customers: { id: string; full_name: string }[]
  properties: { id: string; title: string }[]
  owners: { id: string; full_name: string }[]
}) {
  const router = useRouter()
  const [visits, setVisits] = useState(initialVisits)
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [query, setQuery] = useState('')
  const [showFilter, setShowFilter] = useState(false)
  const [cityFilter, setCityFilter] = useState('')
  const [editingVisit, setEditingVisit] = useState<SiteVisitWithRelations | null>(null)

  useEffect(() => {
    setVisits(initialVisits)
  }, [initialVisits])

  const now = new Date()
  const todayVisits = useMemo(() => visits.filter((v) => isSameDay(new Date(v.scheduled_at), now)), [visits])
  const upcomingVisits = useMemo(() => visits.filter((v) => !isSameDay(new Date(v.scheduled_at), now)), [visits])

  const cities = useMemo(
    () => Array.from(new Set(visits.map((v) => v.property?.city).filter(Boolean) as string[])),
    [visits],
  )

  const counts = useMemo(
    () => ({
      all: visits.length,
      scheduled: visits.filter((v) => v.status === 'scheduled').length,
      completed: visits.filter((v) => v.status === 'completed').length,
      cancelled: visits.filter((v) => v.status === 'cancelled').length,
      no_show: visits.filter((v) => v.status === 'no_show').length,
    }),
    [visits],
  )

  const filteredUpcoming = useMemo(() => {
    return upcomingVisits.filter((visit) => {
      const matchesTab = activeTab === 'all' || visit.status === activeTab
      const q = query.trim().toLowerCase()
      const matchesQuery =
        q.length === 0 ||
        propertyTitle(visit).toLowerCase().includes(q) ||
        visitorName(visit).toLowerCase().includes(q) ||
        (visit.property?.city ?? '').toLowerCase().includes(q)
      const matchesCity = !cityFilter || visit.property?.city === cityFilter
      return matchesTab && matchesQuery && matchesCity
    })
  }, [upcomingVisits, activeTab, query, cityFilter])

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: counts.all },
    { key: 'scheduled', label: 'Scheduled', count: counts.scheduled },
    { key: 'completed', label: 'Completed', count: counts.completed },
    { key: 'cancelled', label: 'Cancelled', count: counts.cancelled },
    { key: 'no_show', label: 'No Show', count: counts.no_show },
  ]

  async function updateStatus(visit: SiteVisitWithRelations, status: VisitStatus) {
    const prev = visits
    setVisits((p) => p.map((v) => (v.id === visit.id ? { ...v, status } : v)))
    const supabase = createClient()
    const { error } = await supabase.from('site_visits').update({ status }).eq('id', visit.id)
    if (error) {
      setVisits(prev)
      window.alert(error.message)
    }
  }

  async function handleDelete(visit: SiteVisitWithRelations) {
    if (!window.confirm('Delete this site visit? This cannot be undone.')) return
    const supabase = createClient()
    const { error } = await supabase.from('site_visits').delete().eq('id', visit.id)
    if (error) {
      window.alert(error.message)
      return
    }
    setVisits((prev) => prev.filter((v) => v.id !== visit.id))
  }

  function handleViewProperty(visit: SiteVisitWithRelations) {
    router.push('/properties')
  }

  function actionsMenu(visit: SiteVisitWithRelations) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon-sm" aria-label={`More actions for ${propertyTitle(visit)} visit`}>
              <MoreHorizontal className="size-3.5" />
            </Button>
          }
        />
        <DropdownMenuContent align="end">
          <DropdownMenuItem disabled={!visit.property_id} onClick={() => handleViewProperty(visit)}>
            View property
          </DropdownMenuItem>
          <DropdownMenuItem disabled={visit.status === 'completed'} onClick={() => updateStatus(visit, 'completed')}>
            Mark completed
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setEditingVisit(visit)}>Reassign owner</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled={visit.status === 'cancelled'} onClick={() => updateStatus(visit, 'cancelled')}>
            Cancel visit
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={() => handleDelete(visit)}>
            Delete visit
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          crumbs={[{ label: 'Sales' }, { label: 'Inventory' }, { label: 'Site Visits' }]}
          title="Site Visits"
          description={`${visits.length} scheduled · ${todayVisits.length} today`}
        />
        <div className="flex shrink-0 items-center gap-2">
          <SiteVisitDialog
            trigger={
              <Button size="sm" className="bg-foreground text-background hover:bg-foreground/85">
                <Calendar data-icon="inline-start" />
                Schedule Visit
              </Button>
            }
            leads={leads}
            customers={customers}
            properties={properties}
            owners={owners}
          />
        </div>
      </div>

      <SiteVisitDialog
        open={!!editingVisit}
        onOpenChange={(next) => {
          if (!next) setEditingVisit(null)
        }}
        leads={leads}
        customers={customers}
        properties={properties}
        owners={owners}
        visit={editingVisit ?? undefined}
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
            <InputGroupInput placeholder="Search site visits…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </InputGroup>
          <Button variant="outline" size="sm" onClick={() => setShowFilter((v) => !v)}>
            <Filter data-icon="inline-start" />
            Filter
            {cityFilter && (
              <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                1
              </span>
            )}
          </Button>

          {showFilter && (
            <div className="absolute top-full right-0 z-30 mt-1.5 w-56 rounded-xl border border-border bg-card p-4 shadow-lg">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-foreground/80">City</label>
                  <select
                    value={cityFilter}
                    onChange={(e) => setCityFilter(e.target.value)}
                    className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-[13px] outline-none dark:bg-input/30"
                  >
                    <option value="">Any</option>
                    {cities.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-between">
                  <Button variant="ghost" size="sm" onClick={() => setCityFilter('')}>
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

      <div className="flex flex-col gap-3">
        <h2 className="font-heading text-sm font-bold text-foreground">Today</h2>
        {todayVisits.length === 0 ? (
          <div className="rounded-2xl bg-card px-4 py-8 text-center text-[13px] text-muted-foreground ring-1 ring-border">
            No site visits today.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {todayVisits.map((visit) => (
              <div
                key={visit.id}
                className="flex flex-col gap-3 rounded-2xl bg-card p-4 ring-1 ring-border transition-colors hover:bg-accent/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="line-clamp-2 font-heading text-[13px] font-bold leading-snug text-foreground text-pretty">
                    {propertyTitle(visit)}
                  </h3>
                  <Badge variant="outline" className={cn('shrink-0 rounded-full text-[11px]', statusMeta[visit.status].badge)}>
                    {statusMeta[visit.status].label}
                  </Badge>
                </div>
                <div className="flex items-center gap-1.5 text-[12px] font-medium text-foreground/80">
                  <Clock className="size-3.5 shrink-0 text-muted-foreground" />
                  {formatTimeLabel(visit.scheduled_at)}
                </div>
                <div className="mt-auto flex items-center gap-2 border-t border-border/70 pt-3">
                  <Avatar size="sm">
                    <AvatarFallback>{getInitials(visitorName(visit))}</AvatarFallback>
                  </Avatar>
                  <span className="truncate text-[12px] text-foreground/80">{visitorName(visit)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="font-heading text-sm font-bold text-foreground">Upcoming</h2>
        <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-border">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-border text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3">Property</th>
                  <th className="px-4 py-3">Visitor</th>
                  <th className="px-4 py-3">Date &amp; Time</th>
                  <th className="px-4 py-3">Owner</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUpcoming.map((visit) => (
                  <tr key={visit.id} className="border-b border-border/70 transition-colors last:border-b-0 hover:bg-accent/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                          <Building2 className="size-4" />
                        </div>
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate font-medium text-foreground">{propertyTitle(visit)}</span>
                          <span className="truncate text-[12px] text-muted-foreground">
                            {visit.property?.address ?? '—'}
                            {visit.property?.city ? `, ${visit.property.city}` : ''}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar size="sm">
                          <AvatarFallback>{getInitials(visitorName(visit))}</AvatarFallback>
                        </Avatar>
                        <span className="truncate text-foreground/80">{visitorName(visit)}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-foreground/80">
                      {formatDateLabel(visit.scheduled_at)}, {formatTimeLabel(visit.scheduled_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar size="sm">
                          <AvatarFallback>{getInitials(visit.owner?.full_name ?? '?')}</AvatarFallback>
                        </Avatar>
                        <span className="truncate text-foreground/80">{visit.owner?.full_name ?? '—'}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <Badge variant="outline" className={cn('rounded-full', statusMeta[visit.status].badge)}>
                        {statusMeta[visit.status].label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button variant="outline" size="sm" className="text-[12px]" onClick={() => setEditingVisit(visit)}>
                          Reschedule
                        </Button>
                        {actionsMenu(visit)}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUpcoming.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                      No upcoming site visits match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
