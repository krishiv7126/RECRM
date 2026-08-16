import { createClient } from '@/lib/supabase/server'
import type { RangeKey } from '@/lib/analytics/analytics-range'

export type { RangeKey }

/** Current window plus the equal-length window before it, for deltas. */
function resolveRange(key: RangeKey) {
  const now = new Date()
  let from: Date
  if (key === 'ytd') {
    from = new Date(now.getFullYear(), 0, 1)
  } else {
    const days = key === '7d' ? 7 : key === '90d' ? 90 : 30
    from = new Date(now.getTime() - days * 86400000)
  }
  const span = now.getTime() - from.getTime()
  return { from, to: now, prevFrom: new Date(from.getTime() - span), prevTo: from }
}

function within(dateStr: string | null, from: Date, to: Date) {
  if (!dateStr) return false
  const t = new Date(dateStr).getTime()
  return t >= from.getTime() && t <= to.getTime()
}

function pctDelta(current: number, previous: number) {
  if (previous === 0) return { value: current > 0 ? 100 : 0, direction: (current > 0 ? 'up' : 'up') as 'up' | 'down' }
  const change = ((current - previous) / previous) * 100
  return {
    value: Math.abs(Math.round(change * 10) / 10),
    direction: (change >= 0 ? 'up' : 'down') as 'up' | 'down',
  }
}

const leadStageOrder = ['new', 'contacted', 'qualified', 'proposal', 'site_visit', 'won'] as const
const leadStageLabels: Record<string, string> = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  proposal: 'Proposal',
  site_visit: 'Site Visit',
  won: 'Won',
}

const dealStageOrder = ['new', 'qualified', 'proposal', 'negotiation', 'contract', 'booked'] as const
const dealStageLabels: Record<string, string> = {
  new: 'New',
  qualified: 'Qualified',
  proposal: 'Proposal',
  negotiation: 'Negotiation',
  contract: 'Contract',
  booked: 'Booked',
}

/** A deal counts as revenue on the day it was booked. */
function bookedAt(deal: { closed_at: string | null; updated_at: string }) {
  return deal.closed_at ?? deal.updated_at
}

export async function getAnalyticsData(range: RangeKey = '30d') {
  const supabase = await createClient()
  const { from, to, prevFrom, prevTo } = resolveRange(range)

  const [{ data: users }, { data: leads }, { data: deals }, { data: siteVisits }, { data: followUps }] =
    await Promise.all([
      supabase.from('platform_users').select('id, full_name, role, parent_id, is_active'),
      supabase.from('leads').select('id, owner_id, stage, temperature, source, created_at'),
      supabase.from('deals').select('id, owner_id, stage, value, closed_at, created_at, updated_at, lead_id'),
      supabase.from('site_visits').select('id, owner_id, status, scheduled_at'),
      supabase.from('follow_ups').select('id, owner_id, status, due_at'),
    ])

  const allUsers = users ?? []
  const allLeads = leads ?? []
  const allDeals = deals ?? []
  const allVisits = siteVisits ?? []
  const allFollowUps = followUps ?? []

  const inRange = {
    leads: allLeads.filter((l) => within(l.created_at, from, to)),
    prevLeads: allLeads.filter((l) => within(l.created_at, prevFrom, prevTo)),
    booked: allDeals.filter((d) => d.stage === 'booked' && within(bookedAt(d), from, to)),
    prevBooked: allDeals.filter((d) => d.stage === 'booked' && within(bookedAt(d), prevFrom, prevTo)),
    visits: allVisits.filter((v) => within(v.scheduled_at, from, to)),
    prevVisits: allVisits.filter((v) => within(v.scheduled_at, prevFrom, prevTo)),
    followUps: allFollowUps.filter((f) => within(f.due_at, from, to)),
  }

  const revenue = inRange.booked.reduce((s, d) => s + (d.value ?? 0), 0)
  const prevRevenue = inRange.prevBooked.reduce((s, d) => s + (d.value ?? 0), 0)
  const dealsClosed = inRange.booked.length
  const prevDealsClosed = inRange.prevBooked.length
  const avgDeal = dealsClosed > 0 ? revenue / dealsClosed : 0
  const prevAvgDeal = prevDealsClosed > 0 ? prevRevenue / prevDealsClosed : 0

  const wonLeads = inRange.leads.filter((l) => l.stage === 'won').length
  const conversion = inRange.leads.length > 0 ? (wonLeads / inRange.leads.length) * 100 : 0
  const prevWonLeads = inRange.prevLeads.filter((l) => l.stage === 'won').length
  const prevConversion = inRange.prevLeads.length > 0 ? (prevWonLeads / inRange.prevLeads.length) * 100 : 0

  const kpis = {
    revenue: { value: revenue, delta: pctDelta(revenue, prevRevenue) },
    dealsClosed: { value: dealsClosed, delta: pctDelta(dealsClosed, prevDealsClosed) },
    avgDeal: { value: avgDeal, delta: pctDelta(avgDeal, prevAvgDeal) },
    conversion: { value: conversion, delta: pctDelta(conversion, prevConversion) },
    siteVisits: { value: inRange.visits.length, delta: pctDelta(inRange.visits.length, inRange.prevVisits.length) },
  }

  // Revenue trend — always the trailing 8 months, independent of the range filter.
  const now = new Date()
  const revenueTrend = Array.from({ length: 8 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (7 - i), 1)
    const next = new Date(d.getFullYear(), d.getMonth() + 1, 1)
    const total = allDeals
      .filter((deal) => {
        if (deal.stage !== 'booked') return false
        const t = new Date(bookedAt(deal)).getTime()
        return t >= d.getTime() && t < next.getTime()
      })
      .reduce((s, deal) => s + (deal.value ?? 0), 0)
    return { month: d.toLocaleDateString('en-IN', { month: 'short' }), revenue: total / 10000000 }
  })

  const funnelTop = inRange.leads.length || 1
  const leadFunnel = leadStageOrder.map((stage) => {
    const count = inRange.leads.filter((l) => l.stage === stage).length
    return { stage: leadStageLabels[stage], count, pct: Math.round((count / funnelTop) * 100) }
  })

  // Pipeline distribution is a live snapshot, not a windowed figure.
  const dealsByStage = dealStageOrder.map((stage) => ({
    stage: dealStageLabels[stage],
    slug: stage,
    count: allDeals.filter((d) => d.stage === stage).length,
  }))

  // Per-owner aggregation, date-filtered so it honours the selected range.
  const staffPerformance = allUsers
    .filter((u) => u.is_active && (u.role === 'manager' || u.role === 'user'))
    .map((u) => {
      const myLeads = inRange.leads.filter((l) => l.owner_id === u.id)
      const myBooked = inRange.booked.filter((d) => d.owner_id === u.id)
      const myVisits = inRange.visits.filter((v) => v.owner_id === u.id)
      const myFollowUps = inRange.followUps.filter((f) => f.owner_id === u.id)
      const won = myLeads.filter((l) => l.stage === 'won').length
      return {
        id: u.id,
        full_name: u.full_name,
        role: u.role as 'manager' | 'user',
        reports_to: allUsers.find((m) => m.id === u.parent_id)?.full_name ?? null,
        total_leads: myLeads.length,
        hot_leads: myLeads.filter((l) => l.temperature === 'hot').length,
        lead_conversion_pct: myLeads.length > 0 ? Math.round((won / myLeads.length) * 1000) / 10 : 0,
        deals_closed: myBooked.length,
        revenue_generated: myBooked.reduce((s, d) => s + (d.value ?? 0), 0),
        site_visits_conducted: myVisits.length,
        site_visits_completed: myVisits.filter((v) => v.status === 'completed').length,
        total_follow_ups: myFollowUps.length,
        follow_ups_completed: myFollowUps.filter((f) => f.status === 'done').length,
      }
    })
    .sort((a, b) => b.revenue_generated - a.revenue_generated)

  const topPerformers = staffPerformance
    .filter((s) => s.deals_closed > 0 || s.total_leads > 0)
    .slice(0, 5)
    .map((s, i) => ({
      rank: i + 1,
      name: s.full_name,
      deals: s.deals_closed,
      revenue: s.revenue_generated,
      conversion: s.lead_conversion_pct,
    }))

  const bookedByLead = new Map<string, number>()
  for (const d of inRange.booked) {
    if (!d.lead_id) continue
    bookedByLead.set(d.lead_id, (bookedByLead.get(d.lead_id) ?? 0) + (d.value ?? 0))
  }

  const sourceNames = Array.from(new Set(inRange.leads.map((l) => l.source ?? 'Unknown')))
  const leadSources = sourceNames
    .map((source) => {
      const rows = inRange.leads.filter((l) => (l.source ?? 'Unknown') === source)
      const converted = rows.filter((l) => l.stage === 'won').length
      return {
        source,
        total: rows.length,
        converted,
        conversion: rows.length > 0 ? Math.round((converted / rows.length) * 1000) / 10 : 0,
        revenue: rows.reduce((s, l) => s + (bookedByLead.get(l.id) ?? 0), 0),
      }
    })
    .sort((a, b) => b.total - a.total)

  return { kpis, revenueTrend, leadFunnel, dealsByStage, topPerformers, leadSources, staffPerformance }
}

export type AnalyticsData = Awaited<ReturnType<typeof getAnalyticsData>>
