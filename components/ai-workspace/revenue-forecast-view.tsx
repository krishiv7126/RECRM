'use client'

import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

type Period = 'monthly' | 'quarterly' | 'yearly' | 'total'

interface Deal {
  stage: string
  value: number | null
  closed_at: string | null
  updated_at: string
  expected_close_date: string | null
}

/** Chance an open deal in each stage ends up booked; used to weight the forecast. */
const STAGE_PROBABILITY: Record<string, number> = {
  new: 0.1,
  qualified: 0.25,
  proposal: 0.4,
  negotiation: 0.6,
  contract: 0.85,
}

const STAGE_LABELS: Record<string, string> = {
  new: 'New',
  qualified: 'Qualified',
  proposal: 'Proposal',
  negotiation: 'Negotiation',
  contract: 'Contract',
}

const chartConfig: ChartConfig = {
  booked: { label: 'Booked', color: 'var(--chart-1)' },
  forecast: { label: 'Forecast', color: 'var(--chart-3)' },
}

const stageChartConfig: ChartConfig = {
  pipeline: { label: 'Pipeline value', color: 'var(--chart-5)' },
  weighted: { label: 'Weighted forecast', color: 'var(--chart-1)' },
}

const PERIODS: { key: Period; label: string }[] = [
  { key: 'monthly', label: 'Monthly' },
  { key: 'quarterly', label: 'Quarterly' },
  { key: 'yearly', label: 'Yearly' },
  { key: 'total', label: 'Total' },
]

function toCr(n: number) {
  return Number((n / 10000000).toFixed(2))
}

function formatInr(n: number) {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)} L`
  return `₹${Math.round(n).toLocaleString('en-IN')}`
}

// Calendar parts in IST so buckets match what the team sees elsewhere.
function istParts(d: Date) {
  const s = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }) // YYYY-MM-DD
  const [y, m] = s.split('-').map(Number)
  return { year: y, month: m - 1 }
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function bucketKey(period: Exclude<Period, 'total'>, d: Date) {
  const { year, month } = istParts(d)
  if (period === 'monthly') return year * 12 + month
  if (period === 'quarterly') return year * 4 + Math.floor(month / 3)
  return year
}

function bucketLabel(period: Exclude<Period, 'total'>, key: number) {
  if (period === 'monthly') return `${MONTHS[key % 12]} ${String(Math.floor(key / 12)).slice(2)}`
  if (period === 'quarterly') return `Q${(key % 4) + 1} ${String(Math.floor(key / 4)).slice(2)}`
  return String(key)
}

/** Buckets shown: a window of past periods plus the upcoming ones. */
const WINDOW: Record<Exclude<Period, 'total'>, { back: number; ahead: number }> = {
  monthly: { back: 5, ahead: 6 },
  quarterly: { back: 3, ahead: 4 },
  yearly: { back: 2, ahead: 2 },
}

export function RevenueForecastView() {
  const [deals, setDeals] = useState<Deal[] | null>(null)
  const [period, setPeriod] = useState<Period>('monthly')

  useEffect(() => {
    createClient()
      .from('deals')
      .select('stage, value, closed_at, updated_at, expected_close_date')
      .then(({ data }) => setDeals(data ?? []))
  }, [])

  const summary = useMemo(() => {
    const all = deals ?? []
    const booked = all.filter((d) => d.stage === 'booked')
    const open = all.filter((d) => d.stage in STAGE_PROBABILITY)
    const bookedTotal = booked.reduce((s, d) => s + (d.value ?? 0), 0)
    const pipeline = open.reduce((s, d) => s + (d.value ?? 0), 0)
    const weighted = open.reduce((s, d) => s + (d.value ?? 0) * STAGE_PROBABILITY[d.stage], 0)
    const byStage = Object.keys(STAGE_PROBABILITY).map((stage) => {
      const rows = open.filter((d) => d.stage === stage)
      const value = rows.reduce((s, d) => s + (d.value ?? 0), 0)
      return { stage: STAGE_LABELS[stage], pipeline: toCr(value), weighted: toCr(value * STAGE_PROBABILITY[stage]) }
    })
    return { bookedTotal, pipeline, weighted, expected: bookedTotal + weighted, byStage }
  }, [deals])

  const series = useMemo(() => {
    if (period === 'total' || !deals) return []
    const now = bucketKey(period, new Date())
    const { back, ahead } = WINDOW[period]
    const rows = new Map<number, { booked: number; forecast: number }>()
    for (let k = now - back; k <= now + ahead; k++) rows.set(k, { booked: 0, forecast: 0 })

    for (const d of deals) {
      const value = d.value ?? 0
      if (d.stage === 'booked') {
        const row = rows.get(bucketKey(period, new Date(d.closed_at ?? d.updated_at)))
        if (row) row.booked += value
      } else if (d.stage in STAGE_PROBABILITY) {
        // Open deals land in their expected close period; overdue or undated
        // ones are counted in the current period.
        const due = d.expected_close_date ? bucketKey(period, new Date(d.expected_close_date)) : now
        const row = rows.get(Math.max(due, now))
        if (row) row.forecast += value * STAGE_PROBABILITY[d.stage]
      }
    }
    return Array.from(rows, ([k, v]) => ({ label: bucketLabel(period, k), booked: toCr(v.booked), forecast: toCr(v.forecast) }))
  }, [deals, period])

  const cards = [
    { label: 'Total booked', value: summary.bookedTotal, hint: 'All booked deals to date' },
    { label: 'Open pipeline', value: summary.pipeline, hint: 'Value of every open deal' },
    { label: 'Weighted forecast', value: summary.weighted, hint: 'Pipeline × stage probability' },
    { label: 'Expected total', value: summary.expected, hint: 'Booked + weighted forecast' },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-1.5">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => setPeriod(p.key)}
            className={cn(
              'rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors',
              period === p.key
                ? 'bg-primary text-primary-foreground'
                : 'bg-card text-muted-foreground ring-1 ring-border hover:text-foreground',
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label} className="rounded-2xl border-border shadow-sm">
            <CardContent className="flex flex-col gap-1 p-4">
              <span className="text-[12px] text-muted-foreground">{c.label}</span>
              <span className="font-heading text-xl font-bold text-foreground">{deals ? formatInr(c.value) : '—'}</span>
              <span className="text-[11px] text-muted-foreground">{c.hint}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-2xl border-border shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-base font-bold">
            {period === 'total' ? 'Forecast by deal stage' : `${PERIODS.find((p) => p.key === period)?.label} revenue`}
          </CardTitle>
          <p className="text-[13px] text-muted-foreground">
            {period === 'total'
              ? 'Open pipeline value against what it is likely to convert into (₹ Cr)'
              : 'Booked revenue for past periods and weighted pipeline forecast ahead (₹ Cr)'}
          </p>
        </CardHeader>
        <CardContent>
          {!deals ? (
            <p className="py-16 text-center text-[13px] text-muted-foreground">Loading deals…</p>
          ) : period === 'total' ? (
            <ChartContainer config={stageChartConfig} className="aspect-auto h-72 w-full">
              <BarChart data={summary.byStage} margin={{ left: 4, right: 8, top: 8 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="stage" tickLine={false} axisLine={false} tickMargin={10} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12} width={48} />
                <ChartTooltip content={<ChartTooltipContent formatter={(v, name) => [`₹${v} Cr `, stageChartConfig[name as string]?.label]} />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="pipeline" fill="var(--color-pipeline)" radius={[6, 6, 0, 0]} maxBarSize={44} />
                <Bar dataKey="weighted" fill="var(--color-weighted)" radius={[6, 6, 0, 0]} maxBarSize={44} />
              </BarChart>
            </ChartContainer>
          ) : (
            <ChartContainer config={chartConfig} className="aspect-auto h-72 w-full">
              <BarChart data={series} margin={{ left: 4, right: 8, top: 8 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={10} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12} width={48} />
                <ChartTooltip content={<ChartTooltipContent formatter={(v, name) => [`₹${v} Cr `, chartConfig[name as string]?.label]} />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="booked" stackId="r" fill="var(--color-booked)" maxBarSize={44} />
                <Bar dataKey="forecast" stackId="r" fill="var(--color-forecast)" radius={[6, 6, 0, 0]} maxBarSize={44} />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
