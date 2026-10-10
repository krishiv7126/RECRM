'use client'

import { useId } from 'react'
import { Input } from '@/components/ui/input'
import { useChannelPartners, type ChannelPartner } from '@/lib/leads/channel-partners'

export type { ChannelPartner }

export const EMPTY_CP: ChannelPartner = { name: '', phone: '', firm: '' }

/** Returns an error message when a CP lead is missing its required details. */
export function validateChannelPartner(cp: ChannelPartner): string | null {
  if (!cp.name.trim()) return 'Enter the channel partner (CP) name.'
  if (cp.phone.replace(/\D/g, '').length < 10) return 'Enter the channel partner’s phone number.'
  return null
}

/**
 * CP details shown when a lead's source is CP: name and number are required,
 * firm is optional. Picking a known partner fills in their number and firm.
 */
export function ChannelPartnerField({ value, onChange }: { value: ChannelPartner; onChange: (value: ChannelPartner) => void }) {
  const listId = useId()
  const partners = useChannelPartners(true)

  function changeName(name: string) {
    const known = partners.find((p) => p.name.toLowerCase() === name.trim().toLowerCase())
    onChange(
      known
        ? { name, phone: value.phone || known.phone, firm: value.firm || known.firm }
        : { ...value, name },
    )
  }

  return (
    <div className="col-span-full grid grid-cols-1 gap-3 rounded-xl border border-border bg-muted/30 p-3 sm:grid-cols-3">
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${listId}-name`} className="text-sm font-medium text-foreground">
          CP name <span className="text-destructive">*</span>
        </label>
        <Input
          id={`${listId}-name`}
          list={listId}
          value={value.name}
          onChange={(e) => changeName(e.target.value)}
          placeholder="Channel partner name"
          autoComplete="off"
        />
        <datalist id={listId}>
          {partners.map((p) => (
            <option key={p.name} value={p.name}>
              {[p.firm, p.phone].filter(Boolean).join(' · ')}
            </option>
          ))}
        </datalist>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${listId}-phone`} className="text-sm font-medium text-foreground">
          CP number <span className="text-destructive">*</span>
        </label>
        <Input
          id={`${listId}-phone`}
          type="tel"
          inputMode="tel"
          value={value.phone}
          onChange={(e) => onChange({ ...value, phone: e.target.value })}
          placeholder="e.g. 98765 43210"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${listId}-firm`} className="text-sm font-medium text-foreground">
          Firm name
        </label>
        <Input
          id={`${listId}-firm`}
          value={value.firm}
          onChange={(e) => onChange({ ...value, firm: e.target.value })}
          placeholder="e.g. Sai Realty"
        />
      </div>
    </div>
  )
}
