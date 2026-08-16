import { createClient } from '@/lib/supabase/server'

export async function getApprovalsData() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: me } = await supabase.from('platform_users').select('id, role, org_id').eq('auth_user_id', user.id).single()
  if (!me) return null

  if (me.role !== 'admin' && me.role !== 'super_admin') {
    return { role: me.role, pending: [], decided: [] }
  }

  // RLS (login_queue_select) already scopes this to requests from platform_users
  // in the admin's own org — no explicit org_id filter needed here.
  const [{ data: pending }, { data: decided }] = await Promise.all([
    supabase
      .from('login_approval_queue')
      .select('id, device_id, status, requested_at, decided_at, platform_user:platform_users!login_approval_queue_platform_user_id_fkey(id, full_name, username, role)')
      .eq('status', 'pending')
      .order('requested_at', { ascending: true }),
    supabase
      .from('login_approval_queue')
      .select('id, device_id, status, requested_at, decided_at, platform_user:platform_users!login_approval_queue_platform_user_id_fkey(id, full_name, username, role)')
      .neq('status', 'pending')
      .order('decided_at', { ascending: false })
      .limit(20),
  ])

  return { role: me.role, pending: pending ?? [], decided: decided ?? [] }
}

export type ApprovalsData = NonNullable<Awaited<ReturnType<typeof getApprovalsData>>>
export type ApprovalRow = ApprovalsData['pending'][number]
