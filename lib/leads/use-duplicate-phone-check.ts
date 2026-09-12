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
 * number that already exists.
 */
export function useDuplicatePhoneCheck(phone: string) {
  const [checking, setChecking] = useState(false)
  const [match, setMatch] = useState<DuplicatePhoneMatch | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const token = useRef(0)

  useEffect(() => {
    const trimmed = phone.trim()
    if (timer.current) clearTimeout(timer.current)
    token.current += 1
    const current = token.current

    if (trimmed.length < 7) {
      setChecking(false)
      setMatch(null)
      return
    }

    setChecking(true)
    timer.current = setTimeout(async () => {
      const supabase = createClient()
      const [{ data: leadMatch }, { data: customerMatch }] = await Promise.all([
        supabase.from('leads').select('id, full_name, stage').eq('phone', trimmed).limit(1).maybeSingle(),
        supabase.from('customers').select('id, full_name').eq('phone', trimmed).limit(1).maybeSingle(),
      ])
      if (token.current !== current) return
      setChecking(false)
      if (customerMatch) {
        setMatch({ type: 'customer', id: customerMatch.id, full_name: customerMatch.full_name })
      } else if (leadMatch) {
        setMatch({ type: 'lead', id: leadMatch.id, full_name: leadMatch.full_name, stage: leadMatch.stage })
      } else {
        setMatch(null)
      }
    }, 500)

    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [phone])

  return { checking, match }
}
