import { redirect } from 'next/navigation'
import { DashboardShell } from '@/components/dashboard/shell'
import { OnboardingTour } from '@/components/onboarding/onboarding-tour'
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
  const navOverrides = (me?.nav_overrides ?? null) as Record<string, boolean> | null

  // First run only: once the tour is finished or skipped the timestamp is set
  // on platform_users, so it never shows again — on any device.
  const showTour = Boolean(me && !me.onboarding_completed_at)

  return (
    <RoleProvider role={role}>
      <DashboardShell role={role} fullName={fullName} city={city} navOverrides={navOverrides}>
        {children}
      </DashboardShell>
      {showTour && me && <OnboardingTour role={role} platformUserId={me.id} />}
    </RoleProvider>
  )
}
