import { redirect } from 'next/navigation'
import { DashboardShell } from '@/components/dashboard/shell'
import { RoleProvider } from '@/lib/role-context'
import { getCurrentAuthUser, getCurrentProfile } from '@/lib/supabase/current-user'
import type { UserRole } from '@/lib/types'

export default async function DashboardGroupLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentAuthUser()

  // Defensive only — proxy.ts already guarantees an approved session reaches here.
  if (!user) redirect('/login')

  const me = await getCurrentProfile()
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
