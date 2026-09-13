import { createClient } from '@/lib/supabase/server'
import { deriveTemperature } from '@/lib/leads/temperature'

/**
 * Lifetime (not date-windowed) per-staff performance, plus their access
 * setup — the dedicated Staff page wants the full picture, not the
 * range-filtered snapshot Analytics uses for trend comparisons.
 */
export async function getStaffData() {
  const supabase = await createClient()

  const [{ data: users }, { data: leads }, { data: deals }, { data: siteVisits }, { data: followUps }] =
    await Promise.all([
      supabase
        .from('platform_users')
        .select('id, full_name, role, parent_id, is_active, nav_overrides, created_at, manager:parent_id(full_name)')
        .order('full_name'),
      supabase.from('leads').select('id, owner_id, stage, ai_score'),
      supabase.from('deals').select('id, owner_id, stage, value'),
      supabase.from('site_visits').select('id, owner_id, status'),
      supabase.from('follow_ups').select('id, owner_id, status'),
    ])

  const allUsers = users ?? []
  const allLeads = leads ?? []
  const allDeals = deals ?? []
  const allVisits = siteVisits ?? []
  const allFollowUps = followUps ?? []

  const staff = allUsers
    .filter((u) => u.role === 'manager' || u.role === 'user')
    .map((u) => {
      const myLeads = allLeads.filter((l) => l.owner_id === u.id)
      const myDeals = allDeals.filter((d) => d.owner_id === u.id)
      const myBooked = myDeals.filter((d) => d.stage === 'booked')
      const myVisits = allVisits.filter((v) => v.owner_id === u.id)
      const myFollowUps = allFollowUps.filter((f) => f.owner_id === u.id)
      const won = myLeads.filter((l) => l.stage === 'won').length

      return {
        id: u.id,
        full_name: u.full_name,
        role: u.role as 'manager' | 'user',
        is_active: u.is_active,
        reports_to: u.manager?.full_name ?? null,
        joined_at: u.created_at,
        nav_overrides: u.nav_overrides as Record<string, boolean> | null,
        total_leads: myLeads.length,
        hot_leads: myLeads.filter((l) => deriveTemperature(l.ai_score) === 'hot').length,
        lead_conversion_pct: myLeads.length > 0 ? Math.round((won / myLeads.length) * 1000) / 10 : 0,
        active_deals: myDeals.filter((d) => d.stage !== 'booked' && d.stage !== 'lost').length,
        deals_closed: myBooked.length,
        revenue_generated: myBooked.reduce((s, d) => s + (d.value ?? 0), 0),
        site_visits_conducted: myVisits.length,
        site_visits_completed: myVisits.filter((v) => v.status === 'completed').length,
        total_follow_ups: myFollowUps.length,
        follow_ups_completed: myFollowUps.filter((f) => f.status === 'done').length,
      }
    })
    .sort((a, b) => b.revenue_generated - a.revenue_generated)

  return { staff }
}

export type StaffData = Awaited<ReturnType<typeof getStaffData>>
export type StaffMember = StaffData['staff'][number]
