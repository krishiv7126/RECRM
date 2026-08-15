import { createClient } from '@/lib/supabase/server'
import { slugifySource } from '@/lib/dashboard-metrics'

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

type Direction = 'up' | 'down'

function pctDelta(current: number, prev: number, asCount = false): { value: number; direction: Direction } {
  if (prev === 0) return { value: current > 0 ? 100 : 0, direction: current >= 0 ? 'up' : 'down' }
  const diff = current - prev
  return {
    value: asCount ? Math.abs(diff) : Number(Math.abs((diff / prev) * 100).toFixed(1)),
    direction: diff >= 0 ? 'up' : 'down',
  }
}

const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export async function getDashboardData() {
  const supabase = await createClient()

  const [{ data: leads }, { data: deals }, { data: siteVisits }, { data: revenueTargets }] = await Promise.all([
    supabase.from('leads').select('id, source, temperature, stage, ai_score, full_name, created_at'),
    supabase.from('deals').select('id, title, stage, value, closed_at, created_at'),
    supabase.from('site_visits').select('id, scheduled_at'),
    supabase.from('revenue_targets').select('period_start, target_value').order('period_start').limit(8),
  ])

  const allLeads = leads ?? []
  const allDeals = deals ?? []
  const allVisits = siteVisits ?? []
  const now = new Date()
  const today = startOfDay(now)
  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 7)
  const twoWeeksAgo = new Date(today)
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const totalLeads = allLeads.length
  const activeDealsList = allDeals.filter((d) => d.stage !== 'booked' && d.stage !== 'lost')
  const activeDeals = activeDealsList.length

  const bookedInMonth = (year: number, month: number) =>
    allDeals
      .filter((d) => d.stage === 'booked' && d.closed_at)
      .filter((d) => {
        const c = new Date(d.closed_at as string)
        return c.getFullYear() === year && c.getMonth() === month
      })
      .reduce((sum, d) => sum + (d.value ?? 0), 0)

  const revenueMtd = bookedInMonth(now.getFullYear(), now.getMonth())
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const revenueLastMonth = bookedInMonth(lastMonth.getFullYear(), lastMonth.getMonth())

  const visitsToday = allVisits.filter((v) => startOfDay(new Date(v.scheduled_at)).getTime() === today.getTime()).length
  const visitsYesterday = allVisits.filter((v) => startOfDay(new Date(v.scheduled_at)).getTime() === yesterday.getTime()).length

  const leadsThisWeek = allLeads.filter((l) => new Date(l.created_at) >= weekAgo).length
  const leadsPrevWeek = allLeads.filter((l) => new Date(l.created_at) >= twoWeeksAgo && new Date(l.created_at) < weekAgo).length

  const dealsThisWeek = allDeals.filter((d) => new Date(d.created_at) >= weekAgo).length
  const dealsPrevWeek = allDeals.filter((d) => new Date(d.created_at) >= twoWeeksAgo && new Date(d.created_at) < weekAgo).length

  const hotLeads = allLeads
    .filter((l) => l.temperature === 'hot' && !['won', 'lost', 'archive'].includes(l.stage))
    .sort((a, b) => (b.ai_score ?? 0) - (a.ai_score ?? 0))

  const activePipelineValue = activeDealsList.reduce((sum, d) => sum + (d.value ?? 0), 0)
  const biggestActiveDeal = [...activeDealsList].sort((a, b) => (b.value ?? 0) - (a.value ?? 0))[0] ?? null

  const sourceCounts = new Map<string, number>()
  for (const l of allLeads) {
    const key = l.source ?? 'Unknown'
    sourceCounts.set(key, (sourceCounts.get(key) ?? 0) + 1)
  }
  const leadSourceBreakdown = Array.from(sourceCounts.entries())
    .map(([source, count]) => ({ source, slug: slugifySource(source), count }))
    .sort((a, b) => b.count - a.count)

  const monthlyRevenueSeries = (revenueTargets ?? []).map((t) => {
    const start = new Date(t.period_start)
    const revenue = bookedInMonth(start.getFullYear(), start.getMonth())
    return {
      month: monthLabels[start.getMonth()],
      revenue: Number((revenue / 10000000).toFixed(2)),
      target: Number(((t.target_value ?? 0) / 10000000).toFixed(2)),
    }
  })

  return {
    totalLeads,
    activeDeals,
    revenueMtd,
    visitsToday,
    kpiDeltas: {
      leads: pctDelta(leadsThisWeek, leadsPrevWeek),
      deals: pctDelta(dealsThisWeek, dealsPrevWeek),
      revenue: pctDelta(revenueMtd, revenueLastMonth),
      visits: pctDelta(visitsToday, visitsYesterday, true),
    },
    topHotLead: hotLeads[0] ?? null,
    hotLeadsCount: hotLeads.length,
    biggestActiveDeal,
    activePipelineValue,
    leadSourceBreakdown,
    monthlyRevenueSeries,
  }
}
