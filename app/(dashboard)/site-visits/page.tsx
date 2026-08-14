'use client'

import { useMemo, useState } from 'react'
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
import { cn } from '@/lib/utils'

type VisitStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show'

interface SiteVisit {
  id: string
  property_title: string
  address: string
  city: string
  visitor_name: string
  date_label: string
  time_label: string
  owner_full_name: string
  status: VisitStatus
  is_today: boolean
}

const siteVisits: SiteVisit[] = [
  { id: 'sv_101', property_title: 'Skyline Residency 3BHK', address: 'Powai', city: 'Mumbai', visitor_name: 'Nikhil Bhatia', date_label: 'Today', time_label: '11:00 AM', owner_full_name: 'Meera Iyer', status: 'scheduled', is_today: true },
  { id: 'sv_102', property_title: 'Baner Riverside 2BHK', address: 'Baner', city: 'Pune', visitor_name: 'Ananya Deshpande', date_label: 'Today', time_label: '1:30 PM', owner_full_name: 'Karan Shetty', status: 'scheduled', is_today: true },
  { id: 'sv_103', property_title: 'Devanahalli Greens Villa', address: 'Devanahalli', city: 'Bengaluru', visitor_name: 'Rahul Menon', date_label: 'Today', time_label: '4:00 PM', owner_full_name: 'Priya Nair', status: 'scheduled', is_today: true },
  { id: 'sv_104', property_title: 'DLF Phase 3 2BHK', address: 'DLF Phase 3', city: 'Gurgaon', visitor_name: 'Aditi Chauhan', date_label: 'Today', time_label: '5:30 PM', owner_full_name: 'Meera Iyer', status: 'completed', is_today: true },
  { id: 'sv_105', property_title: 'Whitefield Grand 3BHK', address: 'Whitefield', city: 'Bengaluru', visitor_name: 'Kavya Subramaniam', date_label: 'Tomorrow', time_label: '10:00 AM', owner_full_name: 'Priya Nair', status: 'scheduled', is_today: false },
  { id: 'sv_106', property_title: 'Sector 62 Corner Plot', address: 'Sector 62', city: 'Noida', visitor_name: 'Vikram Malhotra', date_label: 'Tomorrow', time_label: '12:00 PM', owner_full_name: 'Rohan Verma', status: 'scheduled', is_today: false },
  { id: 'sv_107', property_title: 'Andheri West Heights 3BHK', address: 'Andheri West', city: 'Mumbai', visitor_name: 'Pooja Agarwal', date_label: 'Fri, Aug 14', time_label: '3:00 PM', owner_full_name: 'Meera Iyer', status: 'scheduled', is_today: false },
  { id: 'sv_108', property_title: 'Jubilee Hills Retail Space', address: 'Jubilee Hills', city: 'Hyderabad', visitor_name: 'Divya Prakash', date_label: 'Mon, Aug 10', time_label: '2:00 PM', owner_full_name: 'Karan Shetty', status: 'completed', is_today: false },
  { id: 'sv_109', property_title: 'Cyber Towers Office Suite', address: 'HITEC City', city: 'Hyderabad', visitor_name: 'Siddharth Rao', date_label: 'Sun, Aug 9', time_label: '11:30 AM', owner_full_name: 'Aditya Rao', status: 'cancelled', is_today: false },
  { id: 'sv_110', property_title: 'Baner Riverside 2BHK', address: 'Baner', city: 'Pune', visitor_name: 'Manish Tiwari', date_label: 'Sat, Aug 8', time_label: '4:30 PM', owner_full_name: 'Karan Shetty', status: 'no_show', is_today: false },
]

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

const statusMeta: Record<VisitStatus, { label: string; badge: string }> = {
  scheduled: { label: 'Scheduled', badge: 'bg-chart-2/15 text-chart-2' },
  completed: { label: 'Completed', badge: 'bg-success/15 text-success' },
  cancelled: { label: 'Cancelled', badge: 'bg-muted text-muted-foreground' },
  no_show: { label: 'No Show', badge: 'bg-destructive/10 text-destructive' },
}

type FilterTab = 'all' | VisitStatus

export default function SiteVisitsPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [query, setQuery] = useState('')

  const counts = useMemo(
    () => ({
      all: siteVisits.length,
      scheduled: siteVisits.filter((v) => v.status === 'scheduled').length,
      completed: siteVisits.filter((v) => v.status === 'completed').length,
      cancelled: siteVisits.filter((v) => v.status === 'cancelled').length,
      no_show: siteVisits.filter((v) => v.status === 'no_show').length,
    }),
    [],
  )

  const todayVisits = useMemo(() => siteVisits.filter((v) => v.is_today), [])
  const upcomingVisits = useMemo(() => siteVisits.filter((v) => !v.is_today), [])

  const filteredUpcoming = useMemo(() => {
    return upcomingVisits.filter((visit) => {
      const matchesTab = activeTab === 'all' || visit.status === activeTab
      const matchesQuery =
        query.trim().length === 0 ||
        visit.property_title.toLowerCase().includes(query.toLowerCase()) ||
        visit.visitor_name.toLowerCase().includes(query.toLowerCase()) ||
        visit.city.toLowerCase().includes(query.toLowerCase())
      return matchesTab && matchesQuery
    })
  }, [activeTab, query, upcomingVisits])

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: counts.all },
    { key: 'scheduled', label: 'Scheduled', count: counts.scheduled },
    { key: 'completed', label: 'Completed', count: counts.completed },
    { key: 'cancelled', label: 'Cancelled', count: counts.cancelled },
    { key: 'no_show', label: 'No Show', count: counts.no_show },
  ]

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          crumbs={[{ label: 'Sales' }, { label: 'Inventory' }, { label: 'Site Visits' }]}
          title="Site Visits"
          description={`${siteVisits.length} scheduled · ${todayVisits.length} today`}
        />
        <div className="flex shrink-0 items-center gap-2">
          <Button size="sm" className="bg-foreground text-background hover:bg-foreground/85">
            <Calendar data-icon="inline-start" />
            Schedule Visit
          </Button>
        </div>
      </div>

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

        <div className="flex items-center gap-2">
          <InputGroup className="w-56">
            <InputGroupAddon>
              <Search className="size-4" />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Search site visits…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </InputGroup>
          <Button variant="outline" size="sm">
            <Filter data-icon="inline-start" />
            Filter
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="font-heading text-sm font-bold text-foreground">Today</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {todayVisits.map((visit) => (
            <div
              key={visit.id}
              className="flex flex-col gap-3 rounded-2xl bg-card p-4 ring-1 ring-border transition-colors hover:bg-accent/40"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="line-clamp-2 font-heading text-[13px] font-bold leading-snug text-foreground text-pretty">
                  {visit.property_title}
                </h3>
                <Badge variant="outline" className={cn('shrink-0 rounded-full text-[11px]', statusMeta[visit.status].badge)}>
                  {statusMeta[visit.status].label}
                </Badge>
              </div>
              <div className="flex items-center gap-1.5 text-[12px] font-medium text-foreground/80">
                <Clock className="size-3.5 shrink-0 text-muted-foreground" />
                {visit.time_label}
              </div>
              <div className="mt-auto flex items-center gap-2 border-t border-border/70 pt-3">
                <Avatar size="sm">
                  <AvatarFallback>{getInitials(visit.visitor_name)}</AvatarFallback>
                </Avatar>
                <span className="truncate text-[12px] text-foreground/80">{visit.visitor_name}</span>
              </div>
            </div>
          ))}
        </div>
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
                          <span className="truncate font-medium text-foreground">{visit.property_title}</span>
                          <span className="truncate text-[12px] text-muted-foreground">
                            {visit.address}, {visit.city}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar size="sm">
                          <AvatarFallback>{getInitials(visit.visitor_name)}</AvatarFallback>
                        </Avatar>
                        <span className="truncate text-foreground/80">{visit.visitor_name}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-foreground/80">
                      {visit.date_label}, {visit.time_label}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar size="sm">
                          <AvatarFallback>{getInitials(visit.owner_full_name)}</AvatarFallback>
                        </Avatar>
                        <span className="truncate text-foreground/80">{visit.owner_full_name}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <Badge variant="outline" className={cn('rounded-full', statusMeta[visit.status].badge)}>
                        {statusMeta[visit.status].label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button variant="outline" size="sm" className="text-[12px]">
                          Reschedule
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button variant="ghost" size="icon-sm" aria-label={`More actions for ${visit.property_title} visit`}>
                                <MoreHorizontal className="size-3.5" />
                              </Button>
                            }
                          />
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View property</DropdownMenuItem>
                            <DropdownMenuItem>Mark completed</DropdownMenuItem>
                            <DropdownMenuItem>Reassign owner</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem variant="destructive">Cancel visit</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
