'use client'

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from 'recharts'
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
import { currentUser } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

// --- Mock data (self-contained to this page) ---------------------------------

const kpis = [
  {
    label: 'Total Revenue',
    value: '₹8.2Cr',
    delta: { value: 18, direction: 'up' as const },
    deltaLabel: 'vs last month',
    icon: IndianRupee,
  },
  {
    label: 'Deals Closed',
    value: '23',
    delta: { value: 4, direction: 'up' as const },
    deltaLabel: 'vs last month',
    icon: Handshake,
  },
  {
    label: 'Avg Deal Size',
    value: '₹35.6L',
    delta: { value: 5.2, direction: 'up' as const },
    deltaLabel: 'vs last month',
    icon: Target,
  },
  {
    label: 'Lead Conversion Rate',
    value: '18.4%',
    delta: { value: 2.1, direction: 'up' as const },
    deltaLabel: 'vs last month',
    icon: Users,
  },
  {
    label: 'Site Visits',
    value: '64',
    delta: { value: 3, direction: 'down' as const },
    deltaLabel: 'vs last month',
    icon: MapPinCheck,
  },
]

const revenueTrend = [
  { month: 'Jan', revenue: 4.1 },
  { month: 'Feb', revenue: 4.8 },
  { month: 'Mar', revenue: 5.3 },
  { month: 'Apr', revenue: 5.0 },
  { month: 'May', revenue: 6.2 },
  { month: 'Jun', revenue: 6.9 },
  { month: 'Jul', revenue: 7.4 },
  { month: 'Aug', revenue: 8.2 },
]

const revenueChartConfig: ChartConfig = {
  revenue: { label: 'Revenue', color: 'var(--chart-1)' },
}

const leadFunnel = [
  { stage: 'New', count: 1284, pct: 100 },
  { stage: 'Contacted', count: 940, pct: 73 },
  { stage: 'Qualified', count: 612, pct: 48 },
  { stage: 'Proposal', count: 358, pct: 28 },
  { stage: 'Site Visit', count: 214, pct: 17 },
  { stage: 'Won', count: 118, pct: 9 },
]

const funnelChartConfig: ChartConfig = {
  count: { label: 'Leads', color: 'var(--chart-2)' },
}

const dealsByStage = [
  { stage: 'New', slug: 'new', count: 18 },
  { stage: 'Qualified', slug: 'qualified', count: 24 },
  { stage: 'Proposal', slug: 'proposal', count: 15 },
  { stage: 'Negotiation', slug: 'negotiation', count: 11 },
  { stage: 'Contract', slug: 'contract', count: 7 },
  { stage: 'Booked', slug: 'booked', count: 23 },
]

const stagePalette = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--chart-6)',
]

const dealsByStageConfig: ChartConfig = dealsByStage.reduce((acc, item, i) => {
  acc[item.slug] = { label: item.stage, color: stagePalette[i % stagePalette.length] }
  return acc
}, {} as ChartConfig)

const topPerformers = [
  { rank: 1, name: 'Priya Nair', deals: 9, revenue: '₹1.9Cr', conversion: '24.1%' },
  { rank: 2, name: 'Aditya Rao', deals: 7, revenue: '₹1.6Cr', conversion: '21.8%' },
  { rank: 3, name: 'Karan Shetty', deals: 6, revenue: '₹1.2Cr', conversion: '19.4%' },
  { rank: 4, name: 'Meera Iyer', deals: 5, revenue: '₹0.98Cr', conversion: '17.2%' },
  { rank: 5, name: 'Divya Prakash', deals: 4, revenue: '₹0.71Cr', conversion: '15.6%' },
]

const leadSourcesPerformance = [
  { source: 'Meta Ads', total: 412, converted: 78, conversion: '18.9%', revenue: '₹1.85Cr' },
  { source: 'Google', total: 356, converted: 71, conversion: '19.9%', revenue: '₹1.62Cr' },
  { source: 'Website', total: 248, converted: 52, conversion: '21.0%', revenue: '₹1.34Cr' },
  { source: 'Referral', total: 164, converted: 44, conversion: '26.8%', revenue: '₹1.21Cr' },
  { source: 'Walk-in', total: 96, converted: 21, conversion: '21.9%', revenue: '₹0.68Cr' },
  { source: '99acres', total: 210, converted: 33, conversion: '15.7%', revenue: '₹0.82Cr' },
  { source: 'Instagram', total: 142, converted: 19, conversion: '13.4%', revenue: '₹0.44Cr' },
  { source: 'Property Portal', total: 118, converted: 16, conversion: '13.6%', revenue: '₹0.38Cr' },
]

const dateRanges = ['Last 7 days', 'Last 30 days', 'Last 90 days', 'This year']

// Mirrors the v_staff_performance database view.
interface StaffPerformanceRow {
  id: string
  full_name: string
  role: 'manager' | 'user'
  reports_to: string | null
  total_leads: number
  hot_leads: number
  lead_conversion_pct: number
  deals_closed: number
  revenue_generated: number
  site_visits_completed: number
  site_visits_conducted: number
  follow_ups_completed: number
  total_follow_ups: number
}

const staffPerformanceSeed: StaffPerformanceRow[] = [
  {
    id: 'usr_priya_nair',
    full_name: 'Priya Nair',
    role: 'manager',
    reports_to: null,
    total_leads: 186,
    hot_leads: 22,
    lead_conversion_pct: 24.1,
    deals_closed: 9,
    revenue_generated: 19000000,
    site_visits_completed: 14,
    site_visits_conducted: 16,
    follow_ups_completed: 38,
    total_follow_ups: 42,
  },
  {
    id: 'usr_aditya_rao',
    full_name: 'Aditya Rao',
    role: 'manager',
    reports_to: null,
    total_leads: 164,
    hot_leads: 19,
    lead_conversion_pct: 21.8,
    deals_closed: 7,
    revenue_generated: 16000000,
    site_visits_completed: 11,
    site_visits_conducted: 13,
    follow_ups_completed: 29,
    total_follow_ups: 34,
  },
  {
    id: 'usr_karan_shetty',
    full_name: 'Karan Shetty',
    role: 'user',
    reports_to: 'Priya Nair',
    total_leads: 128,
    hot_leads: 15,
    lead_conversion_pct: 19.4,
    deals_closed: 6,
    revenue_generated: 12000000,
    site_visits_completed: 8,
    site_visits_conducted: 10,
    follow_ups_completed: 22,
    total_follow_ups: 27,
  },
  {
    id: 'usr_meera_iyer',
    full_name: 'Meera Iyer',
    role: 'user',
    reports_to: 'Priya Nair',
    total_leads: 104,
    hot_leads: 11,
    lead_conversion_pct: 17.2,
    deals_closed: 5,
    revenue_generated: 9800000,
    site_visits_completed: 9,
    site_visits_conducted: 12,
    follow_ups_completed: 19,
    total_follow_ups: 24,
  },
  {
    id: 'usr_divya_prakash',
    full_name: 'Divya Prakash',
    role: 'user',
    reports_to: 'Aditya Rao',
    total_leads: 92,
    hot_leads: 9,
    lead_conversion_pct: 15.6,
    deals_closed: 4,
    revenue_generated: 7100000,
    site_visits_completed: 6,
    site_visits_conducted: 8,
    follow_ups_completed: 15,
    total_follow_ups: 20,
  },
  {
    id: 'usr_nikhil_bhatia',
    full_name: 'Nikhil Bhatia',
    role: 'user',
    reports_to: 'Aditya Rao',
    total_leads: 78,
    hot_leads: 7,
    lead_conversion_pct: 13.9,
    deals_closed: 3,
    revenue_generated: 5400000,
    site_visits_completed: 5,
    site_visits_conducted: 7,
    follow_ups_completed: 12,
    total_follow_ups: 18,
  },
  {
    id: 'usr_ananya_desai',
    full_name: 'Ananya Desai',
    role: 'user',
    reports_to: 'Priya Nair',
    total_leads: 65,
    hot_leads: 5,
    lead_conversion_pct: 12.3,
    deals_closed: 2,
    revenue_generated: 3900000,
    site_visits_completed: 4,
    site_visits_conducted: 6,
    follow_ups_completed: 9,
    total_follow_ups: 14,
  },
  {
    id: 'usr_rohan_mehta',
    full_name: 'Rohan Mehta',
    role: 'user',
    reports_to: 'Aditya Rao',
    total_leads: 54,
    hot_leads: 4,
    lead_conversion_pct: 10.8,
    deals_closed: 1,
    revenue_generated: 2200000,
    site_visits_completed: 3,
    site_visits_conducted: 5,
    follow_ups_completed: 7,
    total_follow_ups: 11,
  },
]

const staffPerformance: StaffPerformanceRow[] = [...staffPerformanceSeed].sort(
  (a, b) => b.revenue_generated - a.revenue_generated,
)

function formatStaffRevenue(amount: number) {
  return amount >= 10000000 ? `₹${(amount / 10000000).toFixed(1)}Cr` : `₹${Math.round(amount / 100000)}L`
}

// TODO: generate CSV from v_staff_performance view
function downloadStaffReport() {
  console.log('[v0] downloadStaffReport called — CSV export not yet implemented')
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
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

export default function AnalyticsPage() {
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
                  Last 30 days
                  <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              {dateRanges.map((range) => (
                <DropdownMenuItem key={range}>{range}</DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm">
            <Download data-icon="inline-start" />
            Export
          </Button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {kpis.map((kpi) => (
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

      {/* Charts row 1 */}
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
                <ChartTooltip
                  content={<ChartTooltipContent formatter={(value) => [`₹${value} Cr`, 'Revenue']} />}
                />
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
                <YAxis
                  dataKey="stage"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  width={84}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, _name, item) => [
                        `${value} leads · ${item.payload.pct}%`,
                        'Count',
                      ]}
                    />
                  }
                />
                <Bar dataKey="count" fill="var(--color-count)" radius={[0, 6, 6, 0]} barSize={22}>
                </Bar>
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

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card className="rounded-2xl border-border shadow-sm">
          <CardHeader>
            <CardTitle className="font-heading text-base font-bold">Deals by Stage</CardTitle>
            <p className="text-[13px] text-muted-foreground">Active pipeline distribution</p>
          </CardHeader>
          <CardContent className="flex min-w-0 flex-col items-center gap-5 sm:flex-row sm:items-center sm:justify-between">
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
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border shadow-sm">
          <CardHeader>
            <CardTitle className="font-heading text-base font-bold">Top Performers</CardTitle>
            <p className="text-[13px] text-muted-foreground">Leaderboard for the selected period</p>
          </CardHeader>
          <CardContent className="p-0">
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
                    <td className="px-3 py-3 font-semibold text-foreground">{person.revenue}</td>
                    <td className="px-5 py-3 text-right text-foreground/80">{person.conversion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {/* Lead sources performance */}
      <Card className="rounded-2xl border-border shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-base font-bold">Lead Sources Performance</CardTitle>
          <p className="text-[13px] text-muted-foreground">Volume and revenue contribution by acquisition channel</p>
        </CardHeader>
        <CardContent className="p-0">
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
              {leadSourcesPerformance.map((row) => (
                <tr
                  key={row.source}
                  className="border-b border-border/50 transition-colors last:border-0 hover:bg-muted/40"
                >
                  <td className="px-5 py-3 font-medium text-foreground">{row.source}</td>
                  <td className="px-3 py-3 text-foreground/80">{row.total}</td>
                  <td className="px-3 py-3 text-foreground/80">{row.converted}</td>
                  <td className="px-3 py-3 text-foreground/80">{row.conversion}</td>
                  <td className="px-5 py-3 text-right font-semibold text-foreground">{row.revenue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Staff Performance — Admin-only */}
      {/* TODO: hide this section for Manager/User roles */}
      {currentUser.role === 'admin' && (
        <Card className="rounded-2xl border-border shadow-sm">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="font-heading text-base font-bold">Staff Performance</CardTitle>
              <p className="text-[13px] text-muted-foreground">Manager & team breakdown for the selected period</p>
            </div>
            <Button variant="outline" size="sm" className="shrink-0" onClick={downloadStaffReport}>
              <Download data-icon="inline-start" />
              Download CSV
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-[13px]">
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
                {staffPerformance.map((staff, index) => {
                  const isFirstManager = staff.role === 'manager' && index === 0
                  const isFirstUser = staff.role === 'user' && staffPerformance[index - 1]?.role === 'manager'
                  return (
                    <>
                      {isFirstManager && (
                        <tr key={`${staff.id}-group-managers`} className="bg-muted/40">
                          <td colSpan={9} className="px-5 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Managers
                          </td>
                        </tr>
                      )}
                      {isFirstUser && (
                        <tr key={`${staff.id}-group-users`} className="bg-muted/40">
                          <td colSpan={9} className="px-5 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Team Members
                          </td>
                        </tr>
                      )}
                      <tr
                        key={staff.id}
                        className="border-b border-border/50 transition-colors last:border-0 hover:bg-muted/40"
                      >
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
                                  staff.role === 'manager'
                                    ? 'bg-primary/10 text-primary'
                                    : 'bg-muted text-muted-foreground',
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
                                style={{ width: `${Math.min(staff.lead_conversion_pct * 3, 100)}%` }}
                              />
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3 font-medium text-foreground">{staff.deals_closed}</td>
                        <td className="px-3 py-3 font-semibold text-foreground">
                          {formatStaffRevenue(staff.revenue_generated)}
                        </td>
                        <td className="px-3 py-3 text-foreground/80">
                          {staff.site_visits_completed}/{staff.site_visits_conducted}
                        </td>
                        <td className="px-5 py-3 text-foreground/80">
                          {staff.follow_ups_completed}/{staff.total_follow_ups}
                        </td>
                      </tr>
                    </>
                  )
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
