import { createClient } from '@/lib/supabase/server'

export async function getSettingsData() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: me } = await supabase
    .from('platform_users')
    .select('id, full_name, phone, username, role, org_id, notification_preferences')
    .eq('auth_user_id', user.id)
    .single()
  if (!me) return null

  const [{ data: organization }, { data: staff }, { data: managers }, { data: providers }, { data: orgIntegrations }] =
    await Promise.all([
      me.org_id ? supabase.from('organizations').select('id, name, city').eq('id', me.org_id).single() : Promise.resolve({ data: null }),
      // RLS already scopes this to what the caller is allowed to see:
      // admin -> whole org, manager -> self + direct reports, user -> self only.
      supabase
        .from('platform_users')
        .select('id, full_name, role, is_active, parent_id, manager:parent_id(full_name)')
        .order('full_name'),
      me.role === 'admin' || me.role === 'super_admin'
        ? supabase.from('platform_users').select('id, full_name').eq('role', 'manager')
        : Promise.resolve({ data: [] as { id: string; full_name: string }[] }),
      supabase.from('integration_providers').select('id, key, name, category, is_active').order('name'),
      me.org_id
        ? supabase.from('org_integrations').select('id, provider_id, status').eq('org_id', me.org_id)
        : Promise.resolve({ data: [] as { id: string; provider_id: string; status: string }[] }),
    ])

  return {
    me,
    organization: organization ?? null,
    staff: staff ?? [],
    managers: managers ?? [],
    providers: providers ?? [],
    orgIntegrations: orgIntegrations ?? [],
  }
}

export type SettingsData = NonNullable<Awaited<ReturnType<typeof getSettingsData>>>
