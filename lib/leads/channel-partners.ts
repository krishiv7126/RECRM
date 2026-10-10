'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CP_SOURCE } from '@/lib/leads/cp-source'

export interface ChannelPartner {
  name: string
  phone: string
  firm: string
}

/**
 * Channel partners the org has already brought leads from (distinct
 * `leads.channel_partner` values, with the most recent number and firm seen
 * for each) -- used to suggest names and auto-fill details as the user types.
 */
export function useChannelPartners(enabled: boolean) {
  const [partners, setPartners] = useState<ChannelPartner[]>([])

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    createClient()
      .from('leads')
      .select('channel_partner, cp_phone, cp_firm')
      .eq('source', CP_SOURCE)
      .not('channel_partner', 'is', null)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (cancelled) return
        const byName = new Map<string, ChannelPartner>()
        for (const row of data ?? []) {
          const name = row.channel_partner?.trim()
          if (!name) continue
          const key = name.toLowerCase()
          const existing = byName.get(key)
          // Newest row wins; older rows only fill in what it's missing.
          byName.set(key, {
            name: existing?.name ?? name,
            phone: existing?.phone || row.cp_phone?.trim() || '',
            firm: existing?.firm || row.cp_firm?.trim() || '',
          })
        }
        setPartners(Array.from(byName.values()).sort((a, b) => a.name.localeCompare(b.name)))
      })
    return () => {
      cancelled = true
    }
  }, [enabled])

  return partners
}
