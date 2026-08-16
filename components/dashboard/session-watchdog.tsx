'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const CHECK_INTERVAL_MS = 20_000

// Mirrors proxy.ts's approval check, but polled client-side so a deleted or
// deactivated user is kicked out while sitting on a page, not just on their
// next navigation.
export function SessionWatchdog() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    let cancelled = false

    async function check() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user || cancelled) return

      const { data: me } = await supabase.from('platform_users').select('id').eq('auth_user_id', user.id).single()

      if (!me) {
        if (cancelled) return
        await supabase.auth.signOut()
        router.replace('/login')
        return
      }

      const { count } = await supabase
        .from('login_sessions')
        .select('id', { count: 'exact', head: true })
        .eq('platform_user_id', me.id)
        .eq('is_active', true)

      if (!cancelled && (count ?? 0) === 0) {
        await supabase.auth.signOut()
        router.replace('/login')
      }
    }

    const interval = setInterval(check, CHECK_INTERVAL_MS)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [router])

  return null
}
