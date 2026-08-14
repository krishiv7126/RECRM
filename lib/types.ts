// Types mirror the real Supabase Postgres schema column-for-column.
// Do not add fields that aren't real columns, and do not drop any listed columns.

export type UserRole = 'super_admin' | 'admin' | 'manager' | 'user'

export interface Organization {
  id: string
  name: string
  city: string
  is_active: boolean
}

export interface PlatformUser {
  id: string
  org_id: string
  role: UserRole
  parent_id: string | null
  full_name: string
  phone: string
  username: string
  is_active: boolean
  current_device_id: string | null
}

export type LeadStage =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'proposal'
  | 'site_visit'
  | 'won'
  | 'lost'
  | 'archive'

export type LeadTemperature = 'hot' | 'warm' | 'cold'

export interface Lead {
  id: string
  org_id: string
  owner_id: string
  full_name: string
  phone: string
  email: string
  source: string
  stage: LeadStage
  temperature: LeadTemperature
  ai_score: number
  budget_min: number
  budget_max: number
  requirement: string
  interested_property_id: string | null
  converted_customer_id: string | null
}

export type DealStage =
  | 'new'
  | 'qualified'
  | 'proposal'
  | 'negotiation'
  | 'contract'
  | 'booked'
  | 'lost'

export interface Deal {
  id: string
  org_id: string
  owner_id: string
  code: string
  lead_id: string | null
  customer_id: string | null
  property_id: string | null
  title: string
  stage: DealStage
  value: number
  currency: string
  expected_close_date: string
  closed_at: string | null
  lost_reason: string | null
  notes: string | null
}

export type SiteVisitStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show'

export interface SiteVisit {
  id: string
  org_id: string
  owner_id: string
  lead_id: string | null
  customer_id: string | null
  property_id: string
  scheduled_at: string
  status: SiteVisitStatus
  feedback: string | null
}

export interface RevenueTarget {
  org_id: string
  owner_id: string | null
  period_start: string
  period_end: string
  target_value: number
}

export type NotificationType = 'lead' | 'deal' | 'task' | 'follow_up' | 'system'

export interface Notification {
  recipient_id: string
  type: NotificationType
  title: string
  body: string
  is_read: boolean
}
