'use client'

import { useId } from 'react'
import { Input } from '@/components/ui/input'
import { useChannelPartners } from '@/lib/leads/channel-partners'

/** "Which CP?" input shown when a lead's source is CP, with existing partners suggested. */
export function ChannelPartnerField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const listId = useId()
  const partners = useChannelPartners(true)

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={`${listId}-input`} className="text-sm font-medium text-foreground">
        Which CP? <span className="text-destructive">*</span>
      </label>
      <Input
        id={`${listId}-input`}
        list={listId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Channel partner name"
        autoComplete="off"
      />
      <datalist id={listId}>
        {partners.map((p) => (
          <option key={p} value={p} />
        ))}
      </datalist>
    </div>
  )
}
