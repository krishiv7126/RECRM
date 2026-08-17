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

  const { data: me } = await supabase
    .from('platform_users')
    .select('role, full_name, organizations(city)')
    .eq('auth_user_id', user.id)
    .single()
  const role = (me?.role ?? 'user') as UserRole
  const fullName = me?.full_name ?? 'User'
  const city = me?.organizations?.city ?? null

  return (
    <RoleProvider role={role}>
      <DashboardShell role={role} fullName={fullName} city={city}>
        {children}
      </DashboardShell>
    </RoleProvider>
  )
}
