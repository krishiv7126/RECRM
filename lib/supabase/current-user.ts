import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

/**
 * Per-request cached view of who is signed in.
 *
 * Both of these hit the network — `getUser()` verifies the JWT against Supabase
 * Auth, and the profile lookup is a second query — and a single page render
 * asks for them more than once (the dashboard layout needs the role, the page
 * needs the name). React's `cache()` keeps that to one round-trip each per
 * request instead of one per caller.
 */
export const getCurrentAuthUser = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
})

export const getCurrentProfile = cache(async () => {
  const user = await getCurrentAuthUser()
  if (!user) return null

  const supabase = await createClient()
  const { data } = await supabase
    .from('platform_users')
    .select('id, role, full_name, org_id, organizations(city)')
    .eq('auth_user_id', user.id)
    .single()

  return data
})
