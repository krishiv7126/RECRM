import { deals, leads, notifications, revenueTargets, siteVisits } from './mock-data'

export function formatInr(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatCr(value: number) {
  return `₹${(value / 10000000).toFixed(2)} Cr`
}

const now = new Date()

export const totalLeads = leads.length

export const activeDeals = deals.filter((d) => d.stage !== 'booked' && d.stage !== 'lost').length

export const revenueMtd = deals
  .filter((d) => {
    if (d.stage !== 'booked' || !d.closed_at) return false
    const closed = new Date(d.closed_at)
    return closed.getMonth() === now.getMonth() && closed.getFullYear() === now.getFullYear()
  })
  .reduce((sum, d) => sum + d.value, 0)

export const visitsToday = siteVisits.filter((v) => {
  const scheduled = new Date(v.scheduled_at)
  return (
    scheduled.getDate() === now.getDate() &&
    scheduled.getMonth() === now.getMonth() &&
    scheduled.getFullYear() === now.getFullYear()
  )
}).length

// Week-over-week deltas — mocked comparison baselines for the "vs last week" indicators.
export const kpiDeltas = {
  leads: { value: 8.4, direction: 'up' as const },
  deals: { value: 3.1, direction: 'up' as const },
  revenue: { value: 12.6, direction: 'up' as const },
  visits: { value: 2, direction: 'down' as const },
}

const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug']

export const monthlyRevenueSeries = revenueTargets.map((target, i) => {
  const start = new Date(target.period_start)
  const revenue = deals
    .filter((d) => {
      if (d.stage !== 'booked' || !d.closed_at) return false
      const closed = new Date(d.closed_at)
      return closed.getMonth() === start.getMonth() && closed.getFullYear() === start.getFullYear()
    })
    .reduce((sum, d) => sum + d.value, 0)

  return {
    month: monthLabels[i],
    revenue: Number((revenue / 10000000).toFixed(2)),
    target: Number((target.target_value / 10000000).toFixed(2)),
  }
})

export function slugifySource(source: string) {
  return source.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export const leadSourceBreakdown = Object.entries(
  leads.reduce<Record<string, number>>((acc, lead) => {
    acc[lead.source] = (acc[lead.source] ?? 0) + 1
    return acc
  }, {}),
)
  .map(([source, count]) => ({
    source,
    slug: slugifySource(source),
    count,
    fill: `var(--color-${slugifySource(source)})`,
  }))
  .sort((a, b) => b.count - a.count)

export const hotLeads = leads
  .filter((l) => l.temperature === 'hot' && !['won', 'lost', 'archive'].includes(l.stage))
  .sort((a, b) => b.ai_score - a.ai_score)

export const topHotLead = hotLeads[0]

export const biggestActiveDeal = deals
  .filter((d) => d.stage !== 'booked' && d.stage !== 'lost')
  .sort((a, b) => b.value - a.value)[0]

export const unreadNotificationCount = notifications.filter((n) => !n.is_read).length
