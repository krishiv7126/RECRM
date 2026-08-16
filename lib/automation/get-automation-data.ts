import { createClient } from '@/lib/supabase/server'

export async function getAutomationData() {
  const supabase = await createClient()

  const [{ data: rules }, { data: logs }, { data: owners }] = await Promise.all([
    supabase
      .from('automation_rules')
      .select('*, creator:platform_users!automation_rules_created_by_fkey(full_name)')
      .order('created_at', { ascending: false }),
    supabase
      .from('automation_logs')
      .select('*, rule:automation_rules(name)')
      .order('triggered_at', { ascending: false })
      .limit(50),
    supabase.from('platform_users').select('id, full_name').order('full_name'),
  ])

  return { rules: rules ?? [], logs: logs ?? [], owners: owners ?? [] }
}

export type AutomationRuleRow = Awaited<ReturnType<typeof getAutomationData>>['rules'][number]
export type AutomationLogRow = Awaited<ReturnType<typeof getAutomationData>>['logs'][number]
