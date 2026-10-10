'use client'

import { useId } from 'react'
import { Input } from '@/components/ui/input'

export interface ReferenceValue {
  name: string
  phone: string
}

/**
 * A reference needs both who referred and their number. Required outright
 * when the source is Referral; otherwise only once either part is filled in.
 */
export function validateReference(ref: ReferenceValue, required: boolean): string | null {
  const hasName = !!ref.name.trim()
  const hasPhone = !!ref.phone.trim()
  if (!required && !hasName && !hasPhone) return null
  if (!hasName) return 'Enter the reference person’s name.'
  if (ref.phone.replace(/\D/g, '').length < 10) return 'Enter the reference person’s phone number.'
  return null
}

export function ReferenceField({
  value,
  onChange,
  required = false,
}: {
  value: ReferenceValue
  onChange: (value: ReferenceValue) => void
  required?: boolean
}) {
  const id = useId()
  const showStar = required || !!value.name.trim() || !!value.phone.trim()

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${id}-name`} className="text-sm font-medium text-foreground">
          Reference name {showStar && <span className="text-destructive">*</span>}
        </label>
        <Input
          id={`${id}-name`}
          value={value.name}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
          placeholder="Who referred them"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${id}-phone`} className="text-sm font-medium text-foreground">
          Reference number {showStar && <span className="text-destructive">*</span>}
        </label>
        <Input
          id={`${id}-phone`}
          type="tel"
          inputMode="tel"
          value={value.phone}
          onChange={(e) => onChange({ ...value, phone: e.target.value })}
          placeholder="e.g. 98765 43210"
        />
      </div>
    </>
  )
}
