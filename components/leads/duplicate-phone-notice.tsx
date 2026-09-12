'use client'

import Link from 'next/link'
import { AlertTriangle, Loader2 } from 'lucide-react'
import type { DuplicatePhoneMatch } from '@/lib/leads/use-duplicate-phone-check'

export function DuplicatePhoneNotice({ checking, match }: { checking: boolean; match: DuplicatePhoneMatch | null }) {
  if (checking) {
    return (
      <p className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
        <Loader2 className="size-3 animate-spin" />
        Checking existing records…
      </p>
    )
  }
  if (!match) return null
  return (
    <Link
      href={match.type === 'lead' ? `/leads/${match.id}` : `/customers/${match.id}`}
      className="flex items-center gap-1.5 text-[12px] font-medium text-danger hover:underline"
    >
      <AlertTriangle className="size-3 shrink-0" />
      Already a {match.type}: {match.full_name}
      {match.stage ? ` · ${match.stage}` : ''}
    </Link>
  )
}
