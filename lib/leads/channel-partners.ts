'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CP_SOURCE } from '@/lib/leads/cp-source'

/**
 * Channel partners the org has already brought leads from (distinct
 * `leads.channel_partner` values) -- used to suggest names as the user types.
 */
export function useChannelPartners(enabled: boolean) {
  const [partners, setPartners] = useState<string[]>([])

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    createClient()
      .from('leads')
      .select('channel_partner')
      .eq('source', CP_SOURCE)
      .not('channel_partner', 'is', null)
      .then(({ data }) => {
        if (cancelled) return
        const names = new Map<string, string>()
        for (const row of data ?? []) {
          const name = row.channel_partner?.trim()
          if (name) names.set(name.toLowerCase(), name)
        }
        setPartners(Array.from(names.values()).sort((a, b) => a.localeCompare(b)))
      })
    return () => {
      cancelled = true
    }
  }, [enabled])

  return partners
}
