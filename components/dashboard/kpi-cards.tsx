import type { LucideIcon } from 'lucide-react'
import { ArrowDown, ArrowUp, CalendarClock, Handshake, IndianRupee, Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  activeDeals,
  formatCr,
  kpiDeltas,
  revenueMtd,
  totalLeads,
  visitsToday,
} from '@/lib/dashboard-metrics'

interface Kpi {
  label: string
  value: string
  icon: LucideIcon
  delta: { value: number; direction: 'up' | 'down' }
  deltaLabel: string
}

const kpis: Kpi[] = [
  {
    label: 'Total Leads',
    value: totalLeads.toString(),
    icon: Users,
    delta: kpiDeltas.leads,
    deltaLabel: 'vs last week',
  },
  {
    label: 'Active Deals',
    value: activeDeals.toString(),
    icon: Handshake,
    delta: kpiDeltas.deals,
    deltaLabel: 'vs last week',
  },
  {
    label: 'Revenue MTD',
    value: formatCr(revenueMtd),
    icon: IndianRupee,
    delta: kpiDeltas.revenue,
    deltaLabel: 'vs last week',
  },
  {
    label: 'Visits Today',
    value: visitsToday.toString(),
    icon: CalendarClock,
    delta: kpiDeltas.visits,
    deltaLabel: 'vs last week',
  },
]

export function KpiCards() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi) => (
        <Card key={kpi.label} className="rounded-2xl border-border shadow-sm">
          <CardContent className="flex flex-col gap-3 p-5">
            <div className="flex items-center justify-between">
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10">
                <kpi.icon className="size-4.5 text-primary" />
              </div>
              <span
                className={cn(
                  'flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold',
                  kpi.delta.direction === 'up'
                    ? 'bg-success/10 text-success'
                    : 'bg-danger/10 text-danger',
                )}
              >
                {kpi.delta.direction === 'up' ? (
                  <ArrowUp className="size-3" />
                ) : (
                  <ArrowDown className="size-3" />
                )}
                {kpi.delta.value}
                {kpi.label === 'Visits Today' ? '' : '%'}
              </span>
            </div>
            <div>
              <p className="font-heading text-2xl font-extrabold text-foreground">{kpi.value}</p>
              <p className="mt-0.5 text-[13px] text-muted-foreground">{kpi.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
