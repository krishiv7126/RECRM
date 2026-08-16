// Shape of the automation engine that lives in the database
// (fn_run_automations / fn_condition_matches / fn_execute_action + fn_trg_*_automation
// triggers). These options mirror exactly what those SQL functions understand —
// changing one side means changing the other.

export type Entity = 'leads' | 'deals' | 'customers' | 'site_visits' | 'follow_ups'

export interface FieldDef {
  value: string
  label: string
  type: 'text' | 'number' | 'enum'
  options?: { value: string; label: string }[]
}

export const triggers: { value: string; label: string; entity: Entity; group: string }[] = [
  { value: 'lead_created', label: 'Lead created', entity: 'leads', group: 'Leads' },
  { value: 'lead_updated', label: 'Lead updated', entity: 'leads', group: 'Leads' },
  { value: 'lead_won', label: 'Lead won', entity: 'leads', group: 'Leads' },
  { value: 'lead_lost', label: 'Lead lost', entity: 'leads', group: 'Leads' },
  { value: 'deal_created', label: 'Deal created', entity: 'deals', group: 'Deals' },
  { value: 'deal_updated', label: 'Deal updated', entity: 'deals', group: 'Deals' },
  { value: 'deal_won', label: 'Deal won (booked)', entity: 'deals', group: 'Deals' },
  { value: 'deal_lost', label: 'Deal lost', entity: 'deals', group: 'Deals' },
  { value: 'customer_created', label: 'Customer created', entity: 'customers', group: 'Customers' },
  { value: 'customer_updated', label: 'Customer updated', entity: 'customers', group: 'Customers' },
  { value: 'site_visit_scheduled', label: 'Site visit scheduled', entity: 'site_visits', group: 'Site Visits' },
  { value: 'site_visit_completed', label: 'Site visit completed', entity: 'site_visits', group: 'Site Visits' },
  { value: 'follow_up_completed', label: 'Follow-up completed', entity: 'follow_ups', group: 'Follow-ups' },
]

const leadStages = ['new', 'contacted', 'qualified', 'proposal', 'site_visit', 'won', 'lost', 'archive']
const dealStages = ['new', 'qualified', 'proposal', 'negotiation', 'contract', 'booked', 'lost']

function enumOpts(values: string[]) {
  return values.map((v) => ({ value: v, label: v.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase()) }))
}

export const fieldsByEntity: Record<Entity, FieldDef[]> = {
  leads: [
    { value: 'temperature', label: 'Temperature', type: 'enum', options: enumOpts(['hot', 'warm', 'cold']) },
    { value: 'stage', label: 'Stage', type: 'enum', options: enumOpts(leadStages) },
    { value: 'source', label: 'Source', type: 'text' },
    { value: 'ai_score', label: 'AI score', type: 'number' },
    { value: 'budget_min', label: 'Budget min', type: 'number' },
    { value: 'budget_max', label: 'Budget max', type: 'number' },
    { value: 'requirement', label: 'Requirement', type: 'text' },
    { value: 'full_name', label: 'Full name', type: 'text' },
    { value: 'email', label: 'Email', type: 'text' },
    { value: 'phone', label: 'Phone', type: 'text' },
  ],
  deals: [
    { value: 'stage', label: 'Stage', type: 'enum', options: enumOpts(dealStages) },
    { value: 'value', label: 'Deal value', type: 'number' },
    { value: 'title', label: 'Title', type: 'text' },
    { value: 'code', label: 'Deal code', type: 'text' },
    { value: 'lost_reason', label: 'Lost reason', type: 'text' },
  ],
  customers: [
    { value: 'city', label: 'City', type: 'text' },
    { value: 'full_name', label: 'Full name', type: 'text' },
    { value: 'email', label: 'Email', type: 'text' },
    { value: 'phone', label: 'Phone', type: 'text' },
  ],
  site_visits: [
    { value: 'status', label: 'Status', type: 'enum', options: enumOpts(['scheduled', 'completed', 'cancelled', 'no_show']) },
    { value: 'feedback', label: 'Feedback', type: 'text' },
  ],
  follow_ups: [
    { value: 'type', label: 'Type', type: 'enum', options: enumOpts(['call', 'email', 'whatsapp', 'meeting', 'other']) },
    { value: 'status', label: 'Status', type: 'enum', options: enumOpts(['pending', 'done', 'missed']) },
    { value: 'notes', label: 'Notes', type: 'text' },
  ],
}

// fn_condition_matches supports exactly these operators.
export const operators = [
  { value: 'eq', label: 'is' },
  { value: 'neq', label: 'is not' },
  { value: 'gt', label: '>' },
  { value: 'gte', label: '≥' },
  { value: 'lt', label: '<' },
  { value: 'lte', label: '≤' },
  { value: 'contains', label: 'contains' },
]

export const actionTypes = [
  { value: 'create_task', label: 'Create task' },
  { value: 'create_follow_up', label: 'Schedule follow-up' },
  { value: 'create_notification', label: 'Notify owner' },
  { value: 'assign_owner', label: 'Reassign owner' },
  { value: 'send_whatsapp', label: 'Queue WhatsApp' },
  { value: 'send_email', label: 'Queue email' },
]

export const taskCategories = enumOpts([
  'follow_up', 'call', 'whatsapp', 'email', 'site_visit', 'meeting', 'documentation',
  'payment_collection', 'property_verification', 'internal', 'administration', 'marketing', 'training', 'other',
])

export const taskPriorities = enumOpts(['critical', 'high', 'medium', 'low'])
export const followUpTypes = enumOpts(['call', 'email', 'whatsapp', 'meeting', 'other'])
export const notificationTypes = enumOpts([
  'task_due', 'follow_up_due', 'approval_pending', 'lead_assigned', 'deal_update', 'site_visit_reminder', 'system', 'other',
])

export interface Condition {
  field: string
  operator: string
  value: string
}

export interface Action {
  type: string
  config: Record<string, string | number>
}

export function entityForTrigger(trigger: string): Entity {
  return triggers.find((t) => t.value === trigger)?.entity ?? 'leads'
}

export function triggerLabel(trigger: string) {
  return triggers.find((t) => t.value === trigger)?.label ?? trigger
}

export function describeConditions(conditions: Condition[], entity: Entity) {
  if (!conditions?.length) return 'always'
  return conditions
    .map((c) => {
      const field = fieldsByEntity[entity]?.find((f) => f.value === c.field)
      const op = operators.find((o) => o.value === c.operator)
      return `${field?.label ?? c.field} ${op?.label ?? c.operator} ${c.value}`
    })
    .join(' and ')
}

export function describeActions(actions: Action[]) {
  if (!actions?.length) return 'do nothing'
  return actions.map((a) => actionTypes.find((t) => t.value === a.type)?.label ?? a.type).join(' + ')
}
