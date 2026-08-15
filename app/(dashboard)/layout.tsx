import { redirect } from 'next/navigation'
import { DashboardShell } from '@/components/dashboard/shell'
import { RoleProvider } from '@/lib/role-context'
import { createClient } from '@/lib/supabase/server'
import type { UserRole } from '@/lib/types'

export default async function DashboardGroupLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Defensive only — proxy.ts already guarantees an approved session reaches here.
  if (!user) redirect('/login')

  const { data: me } = await supabase.from('platform_users').select('role').eq('auth_user_id', user.id).single()
  const role = (me?.role ?? 'user') as UserRole

  return (
    <RoleProvider role={role}>
      <DashboardShell role={role}>{children}</DashboardShell>
    </RoleProvider>
  )
}
