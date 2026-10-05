'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface DuplicatePhoneMatch {
  type: 'lead' | 'customer'
  id: string
  full_name: string
  stage?: string
}

/**
 * Debounced lookup against leads and customers (RLS-scoped to the caller's
 * org) so a form can warn before creating a duplicate record for a phone
 * number that already exists. Numbers are compared on their last 10 digits,
 * so "+91 98732 55664" and "9873255664" count as the same number.
 * `excludeLeadId` skips the lead being edited.
 */
export function useDuplicatePhoneCheck(phone: string, excludeLeadId?: string) {
  const [checking, setChecking] = useState(false)
  const [match, setMatch] = useState<DuplicatePhoneMatch | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const token = useRef(0)

  useEffect(() => {
    const trimmed = phone.trim()
    if (timer.current) clearTimeout(timer.current)
    token.current += 1
    const current = token.current

    if (trimmed.replace(/\D/g, '').length < 10) {
      setChecking(false)
      setMatch(null)
      return
    }

    setChecking(true)
    timer.current = setTimeout(async () => {
      const { data } = await createClient().rpc('find_phone_duplicate', {
        p_phone: trimmed,
        ...(excludeLeadId ? { p_exclude_lead: excludeLeadId } : {}),
      })
      if (token.current !== current) return
      setChecking(false)
      // Prefer an existing member over a lead with the same number.
      const hit = (data ?? []).find((r) => r.type === 'customer') ?? (data ?? [])[0]
      setMatch(
        hit
          ? { type: hit.type as DuplicatePhoneMatch['type'], id: hit.id, full_name: hit.full_name, stage: hit.stage ?? undefined }
          : null,
      )
    }, 500)

    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [phone, excludeLeadId])

  return { checking, match }
}
