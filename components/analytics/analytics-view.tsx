'use client'

import { Fragment } from 'react'
import { useRouter } from 'next/navigation'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from 'recharts'
import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  ChevronDown,
  Download,
  Flame,
  Handshake,
  IndianRupee,
  MapPinCheck,
  Target,
  Users,
} from 'lucide-react'
import { PageHeader } from '@/components/dashboard/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { cn } from '@/lib/utils'
import { useRole } from '@/lib/role-context'
import { type RangeKey, rangeLabel, rangeOptions } from '@/lib/analytics/analytics-range'
import type { AnalyticsData } from '@/lib/analytics/get-analytics-data'

function formatCr(amount: number) {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`
  if (amount >= 100000) return `₹${Math.round(amount / 100000)}L`
  return `₹${Math.round(amount).toLocaleString('en-IN')}`
}

function getInitials(name: string) {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
}

function Delta({ value, direction }: { value: number; direction: 'up' | 'down' }) {
  return (
    <span
      className={cn(
        'flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold',
        direction === 'up' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger',
      )}
    >
      {direction === 'up' ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
      {value}%
    </span>
  )
}

const revenueChartConfig: ChartConfig = { revenue: { label: 'Revenue', color: 'var(--chart-1)' } }
const funnelChartConfig: ChartConfig = { count: { label: 'Leads', color: 'var(--chart-2)' } }

const stagePalette = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--chart-6)',
]

function downloadCsv(rows: (string | number)[][], filename: string) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function AnalyticsView({ data, range }: { data: AnalyticsData; range: RangeKey }) {
  const router = useRouter()
  const role = useRole()
  const { kpis, revenueTrend, leadFunnel, dealsByStage, topPerformers, leadSources, staffPerformance } = data

  const dealsByStageConfig: ChartConfig = dealsByStage.reduce((acc, item, i) => {
    acc[item.slug] = { label: item.stage, color: stagePalette[i % stagePalette.length] }
    return acc
  }, {} as ChartConfig)

  const kpiCards = [
    { label: 'Total Revenue', value: formatCr(kpis.revenue.value), delta: kpis.revenue.delta, icon: IndianRupee },
    { label: 'Deals Closed', value: kpis.dealsClosed.value.toString(), delta: kpis.dealsClosed.delta, icon: Handshake },
    { label: 'Avg Deal Size', value: formatCr(kpis.avgDeal.value), delta: kpis.avgDeal.delta, icon: Target },
    {
      label: 'Lead Conversion Rate',
      value: `${kpis.conversion.value.toFixed(1)}%`,
      delta: kpis.conversion.delta,
      icon: Users,
    },
    { label: 'Site Visits', value: kpis.siteVisits.value.toString(), delta: kpis.siteVisits.delta, icon: MapPinCheck },
  ]

  function setRange(key: RangeKey) {
    router.push(`/analytics?range=${key}`)
  }

  function exportOverview() {
    downloadCsv(
      [
        ['Metric', 'Value'],
        ['Range', rangeLabel(range)],
        ['Total Revenue', kpis.revenue.value.toString()],
        ['Deals Closed', kpis.dealsClosed.value.toString()],
        ['Avg Deal Size', Math.round(kpis.avgDeal.value).toString()],
        ['Lead Conversion Rate %', kpis.conversion.value.toFixed(1)],
        ['Site Visits', kpis.siteVisits.value.toString()],
        [],
        ['Lead Source', 'Total Leads', 'Converted', 'Conversion %', 'Revenue'],
        ...leadSources.map((s) => [s.source, s.total, s.converted, s.conversion, s.revenue]),
      ],
      `analytics-${range}-${new Date().toISOString().slice(0, 10)}.csv`,
    )
  }

  function downloadStaffReport() {
    downloadCsv(
      [
        ['Staff', 'Role', 'Reports To', 'Total Leads', 'Hot Leads', 'Lead Conversion %', 'Deals Closed', 'Revenue', 'Site Visits Completed', 'Site Visits Conducted', 'Follow-ups Completed', 'Total Follow-ups'],
        ...staffPerformance.map((s) => [
          s.full_name,
          s.role,
          s.reports_to ?? '',
          s.total_leads,
          s.hot_leads,
          s.lead_conversion_pct,
          s.deals_closed,
          s.revenue_generated,
          s.site_visits_completed,
          s.site_visits_conducted,
          s.follow_ups_completed,
          s.total_follow_ups,
        ]),
      ],
      `staff-performance-${range}-${new Date().toISOString().slice(0, 10)}.csv`,
    )
  }

  const managers = staffPerformance.filter((s) => s.role === 'manager')
  const members = staffPerformance.filter((s) => s.role === 'user')

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          crumbs={[{ label: 'Intelligence' }, { label: 'Analytics' }]}
          title="Analytics"
          description="Track performance across your portfolio"
        />
        <div className="flex shrink-0 items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" size="sm" className="gap-1.5">
                  <CalendarDays data-icon="inline-start" />
                  {rangeLabel(range)}
                  <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              {rangeOptions.map((option) => (
                <DropdownMenuItem key={option.key} onClick={() => setRange(option.key)}>
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm" onClick={exportOverview}>
            <Download data-icon="inline-start" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {kpiCards.map((kpi) => (
          <Card key={kpi.label} className="rounded-2xl border-border shadow-sm">
            <CardContent className="flex flex-col gap-3 p-5">
              <div className="flex items-center justify-between">
                <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10">
                  <kpi.icon className="size-4.5 text-primary" />
                </div>
                <Delta value={kpi.delta.value} direction={kpi.delta.direction} />
              </div>
              <div>
                <p className="font-heading text-2xl font-extrabold text-foreground">{kpi.value}</p>
                <p className="mt-0.5 text-[13px] text-muted-foreground">{kpi.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card className="rounded-2xl border-border shadow-sm">
          <CardHeader>
            <CardTitle className="font-heading text-base font-bold">Revenue Trend</CardTitle>
            <p className="text-[13px] text-muted-foreground">Monthly booked revenue, last 8 months</p>
          </CardHeader>
          <CardContent>
            <ChartContainer config={revenueChartConfig} className="aspect-auto h-72 w-full">
              <AreaChart data={revenueTrend} margin={{ left: 4, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="analyticsRevenueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-revenue)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--color-revenue)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={10} fontSize={12} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  fontSize={12}
                  tickFormatter={(value) => `₹${Number(value).toFixed(1)}Cr`}
                  width={64}
                />
                <ChartTooltip content={<ChartTooltipContent formatter={(value) => [`₹${Number(value).toFixed(2)} Cr`, 'Revenue']} />} />
                <Area
                  dataKey="revenue"
                  type="monotone"
                  stroke="var(--color-revenue)"
                  strokeWidth={2.5}
                  fill="url(#analyticsRevenueFill)"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border shadow-sm">
          <CardHeader>
            <CardTitle className="font-heading text-base font-bold">Lead Funnel</CardTitle>
            <p className="text-[13px] text-muted-foreground">Stage-wise drop-off across the pipeline</p>
          </CardHeader>
          <CardContent>
            <ChartContainer config={funnelChartConfig} className="aspect-auto h-72 w-full">
              <BarChart data={leadFunnel} layout="vertical" margin={{ left: 4, right: 32, top: 4 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="stage" type="category" tickLine={false} axisLine={false} fontSize={12} width={84} />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, _name, item) => [`${value} leads · ${item.payload.pct}%`, 'Count']}
                    />
                  }
                />
                <Bar dataKey="count" fill="var(--color-count)" radius={[0, 6, 6, 0]} barSize={22} />
              </BarChart>
            </ChartContainer>
            <ul className="mt-2 flex flex-col gap-1.5 border-t border-border/70 pt-3">
              {leadFunnel.map((stage) => (
                <li key={stage.stage} className="flex items-center justify-between text-[12px]">
                  <span className="text-muted-foreground">{stage.stage}</span>
                  <span className="font-heading font-semibold text-foreground">
                    {stage.count.toLocaleString('en-IN')}
                    <span className="ml-1.5 font-normal text-muted-foreground">({stage.pct}%)</span>
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card className="rounded-2xl border-border shadow-sm">
          <CardHeader>
            <CardTitle className="font-heading text-base font-bold">Deals by Stage</CardTitle>
            <p className="text-[13px] text-muted-foreground">Live pipeline distribution</p>
          </CardHeader>
          <CardContent className="flex min-w-0 flex-col items-center gap-5 sm:flex-row sm:items-center sm:justify-between">
            {dealsByStage.every((d) => d.count === 0) ? (
              <p className="w-full py-12 text-center text-[13px] text-muted-foreground">No deals in the pipeline yet.</p>
            ) : (
              <>
                <ChartContainer config={dealsByStageConfig} className="aspect-square h-44 w-44 shrink-0">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="stage" />} />
                    <Pie
                      data={dealsByStage}
                      dataKey="count"
                      nameKey="stage"
                      innerRadius={48}
                      outerRadius={72}
                      strokeWidth={3}
                      stroke="var(--card)"
                    >
                      {dealsByStage.map((entry) => (
                        <Cell key={entry.slug} fill={`var(--color-${entry.slug})`} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
                <ul className="flex w-full min-w-0 flex-1 flex-col gap-2.5">
                  {dealsByStage.map((item) => (
                    <li key={item.slug} className="flex items-center justify-between gap-3 text-[13px]">
                      <span className="flex min-w-0 items-center gap-2 text-foreground/80">
                        <span
                          className="size-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: `var(--color-${item.slug})` }}
                        />
                        <span className="truncate">{item.stage}</span>
                      </span>
                      <span className="shrink-0 font-heading font-semibold text-foreground">{item.count}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border shadow-sm">
          <CardHeader>
            <CardTitle className="font-heading text-base font-bold">Top Performers</CardTitle>
            <p className="text-[13px] text-muted-foreground">Leaderboard for the selected period</p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-border/70 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                    <th className="px-5 py-2 font-medium">Rank</th>
                    <th className="px-3 py-2 font-medium">Owner</th>
                    <th className="px-3 py-2 font-medium">Deals</th>
                    <th className="px-3 py-2 font-medium">Revenue</th>
                    <th className="px-5 py-2 text-right font-medium">Conversion</th>
                  </tr>
                </thead>
                <tbody>
                  {topPerformers.map((person) => (
                    <tr key={person.rank} className="border-b border-border/50 transition-colors last:border-0 hover:bg-muted/40">
                      <td className="px-5 py-3 font-heading font-bold text-foreground">#{person.rank}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar size="sm">
                            <AvatarFallback>{getInitials(person.name)}</AvatarFallback>
                          </Avatar>
                          <span className="truncate font-medium text-foreground">{person.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-foreground/80">{person.deals}</td>
                      <td className="px-3 py-3 font-semibold text-foreground">{formatCr(person.revenue)}</td>
                      <td className="px-5 py-3 text-right text-foreground/80">{person.conversion}%</td>
                    </tr>
                  ))}
                  {topPerformers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-12 text-center text-muted-foreground">
                        No activity in this period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-border shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-base font-bold">Lead Sources Performance</CardTitle>
          <p className="text-[13px] text-muted-foreground">Volume and revenue contribution by acquisition channel</p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border/70 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-2 font-medium">Source</th>
                  <th className="px-3 py-2 font-medium">Total Leads</th>
                  <th className="px-3 py-2 font-medium">Converted</th>
                  <th className="px-3 py-2 font-medium">Conversion %</th>
                  <th className="px-5 py-2 text-right font-medium">Revenue Generated</th>
                </tr>
              </thead>
              <tbody>
                {leadSources.map((row) => (
                  <tr key={row.source} className="border-b border-border/50 transition-colors last:border-0 hover:bg-muted/40">
                    <td className="px-5 py-3 font-medium text-foreground">{row.source}</td>
                    <td className="px-3 py-3 text-foreground/80">{row.total}</td>
                    <td className="px-3 py-3 text-foreground/80">{row.converted}</td>
                    <td className="px-3 py-3 text-foreground/80">{row.conversion}%</td>
                    <td className="px-5 py-3 text-right font-semibold text-foreground">{formatCr(row.revenue)}</td>
                  </tr>
                ))}
                {leadSources.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-muted-foreground">
                      No leads in this period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {(role === 'admin' || role === 'super_admin') && (
        <Card className="rounded-2xl border-border shadow-sm">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="font-heading text-base font-bold">Staff Performance</CardTitle>
              <p className="text-[13px] text-muted-foreground">Manager &amp; team breakdown for the selected period</p>
            </div>
            <Button variant="outline" size="sm" className="shrink-0" onClick={downloadStaffReport}>
              <Download data-icon="inline-start" />
              Download CSV
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-[13px]">
                <thead>
                  <tr className="border-b border-border/70 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                    <th className="px-5 py-2 font-medium">Staff</th>
                    <th className="px-3 py-2 font-medium">Reports To</th>
                    <th className="px-3 py-2 font-medium">Total Leads</th>
                    <th className="px-3 py-2 font-medium">Hot Leads</th>
                    <th className="px-3 py-2 font-medium">Lead Conversion</th>
                    <th className="px-3 py-2 font-medium">Deals Closed</th>
                    <th className="px-3 py-2 font-medium">Revenue</th>
                    <th className="px-3 py-2 font-medium">Site Visits</th>
                    <th className="px-5 py-2 font-medium">Follow-ups</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'Managers', rows: managers },
                    { label: 'Team Members', rows: members },
                  ].map((group) =>
                    group.rows.length === 0 ? null : (
                      <Fragment key={group.label}>
                        <tr className="bg-muted/40">
                          <td colSpan={9} className="px-5 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                            {group.label}
                          </td>
                        </tr>
                        {group.rows.map((staff) => (
                          <tr key={staff.id} className="border-b border-border/50 transition-colors last:border-0 hover:bg-muted/40">
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-2.5">
                                <Avatar size="sm">
                                  <AvatarFallback>{getInitials(staff.full_name)}</AvatarFallback>
                                </Avatar>
                                <div className="flex items-center gap-2">
                                  <span className="truncate font-medium text-foreground">{staff.full_name}</span>
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      'rounded-full border-0 px-2 py-0 text-[10px] font-semibold capitalize',
                                      staff.role === 'manager' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
                                    )}
                                  >
                                    {staff.role === 'manager' ? 'Manager' : 'User'}
                                  </Badge>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-3 text-foreground/80">{staff.reports_to ?? '—'}</td>
                            <td className="px-3 py-3 text-foreground/80">{staff.total_leads}</td>
                            <td className="px-3 py-3 text-foreground/80">
                              <span className="inline-flex items-center gap-1">
                                <Flame className="size-3.5 text-danger" />
                                {staff.hot_leads}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-2">
                                <span className="w-10 shrink-0 font-medium text-foreground">
                                  {staff.lead_conversion_pct}%
                                </span>
                                <span className="h-1.5 w-16 shrink-0 overflow-hidden rounded-full bg-muted">
                                  <span
                                    className="block h-full rounded-full bg-primary"
                                    style={{ width: `${Math.min(staff.lead_conversion_pct, 100)}%` }}
                                  />
                                </span>
                              </div>
                            </td>
                            <td className="px-3 py-3 font-medium text-foreground">{staff.deals_closed}</td>
                            <td className="px-3 py-3 font-semibold text-foreground">{formatCr(staff.revenue_generated)}</td>
                            <td className="px-3 py-3 text-foreground/80">
                              {staff.site_visits_completed}/{staff.site_visits_conducted}
                            </td>
                            <td className="px-5 py-3 text-foreground/80">
                              {staff.follow_ups_completed}/{staff.total_follow_ups}
                            </td>
                          </tr>
                        ))}
                      </Fragment>
                    ),
                  )}
                  {staffPerformance.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-5 py-12 text-center text-muted-foreground">
                        No managers or team members yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
