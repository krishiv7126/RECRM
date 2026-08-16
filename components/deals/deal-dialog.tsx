'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'

type DealStage = Database['public']['Enums']['deal_stage']

const stageLabels: Record<DealStage, string> = {
  new: 'New',
  qualified: 'Qualified',
  proposal: 'Proposal',
  negotiation: 'Negotiation',
  contract: 'Contract',
  booked: 'Booked',
  lost: 'Lost',
}

interface EditableDeal {
  id: string
  title: string
  customer_id: string | null
  property_id: string | null
  value: number | null
  expected_close_date: string | null
  stage: DealStage
}

export function DealDialog({
  trigger,
  open: openProp,
  onOpenChange: onOpenChangeProp,
  customers,
  properties,
  deal,
  defaultStage = 'new',
}: {
  trigger?: React.ReactElement
  open?: boolean
  onOpenChange?: (open: boolean) => void
  customers: { id: string; full_name: string }[]
  properties: { id: string; title: string }[]
  deal?: EditableDeal
  defaultStage?: DealStage
}) {
  const router = useRouter()
  const [openState, setOpenState] = useState(false)
  const open = openProp ?? openState
  const setOpen = onOpenChangeProp ?? setOpenState

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [propertyId, setPropertyId] = useState('')
  const [value, setValue] = useState('')
  const [closeDate, setCloseDate] = useState('')
  const [stage, setStage] = useState<DealStage>(defaultStage)

  useEffect(() => {
    if (!open) return
    setTitle(deal?.title ?? '')
    setCustomerId(deal?.customer_id ?? '')
    setPropertyId(deal?.property_id ?? '')
    setValue(deal?.value?.toString() ?? '')
    setCloseDate(deal?.expected_close_date ?? '')
    setStage(deal?.stage ?? defaultStage)
    setError(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, deal?.id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      setError('Title is required.')
      return
    }
    setSubmitting(true)
    setError(null)

    const supabase = createClient()

    if (deal) {
      const { error: updateErr } = await supabase
        .from('deals')
        .update({
          title: title.trim(),
          customer_id: customerId || null,
          property_id: propertyId || null,
          value: value ? Number(value) : null,
          expected_close_date: closeDate || null,
          stage,
        })
        .eq('id', deal.id)

      setSubmitting(false)
      if (updateErr) {
        setError(updateErr.message)
        return
      }
    } else {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setError('Not signed in.')
        setSubmitting(false)
        return
      }
      const { data: me } = await supabase
        .from('platform_users')
        .select('id, org_id')
        .eq('auth_user_id', user.id)
        .single()
      if (!me?.org_id) {
        setError('Could not resolve your organization.')
        setSubmitting(false)
        return
      }

      const { error: insertErr } = await supabase.from('deals').insert({
        org_id: me.org_id,
        owner_id: me.id,
        title: title.trim(),
        customer_id: customerId || null,
        property_id: propertyId || null,
        value: value ? Number(value) : null,
        expected_close_date: closeDate || null,
        stage,
      })

      setSubmitting(false)
      if (insertErr) {
        setError(insertErr.message)
        return
      }
    }

    setOpen(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger render={trigger} />}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{deal ? 'Edit Deal' : 'New Deal'}</DialogTitle>
          <DialogDescription>{deal ? 'Update this deal.' : 'Add a new deal to your pipeline.'}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="deal_title" className="text-sm font-medium text-foreground">
              Title <span className="text-destructive">*</span>
            </label>
            <Input
              id="deal_title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g. 3BHK Skyline Residency, Powai"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="deal_customer" className="text-sm font-medium text-foreground">
                Customer
              </label>
              <select
                id="deal_customer"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              >
                <option value="">None</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="deal_property" className="text-sm font-medium text-foreground">
                Property
              </label>
              <select
                id="deal_property"
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value)}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              >
                <option value="">None</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="deal_value" className="text-sm font-medium text-foreground">
                Value (₹)
              </label>
              <Input id="deal_value" type="number" value={value} onChange={(e) => setValue(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="deal_close_date" className="text-sm font-medium text-foreground">
                Expected close
              </label>
              <Input
                id="deal_close_date"
                type="date"
                value={closeDate}
                onChange={(e) => setCloseDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="deal_stage" className="text-sm font-medium text-foreground">
              Stage
            </label>
            <select
              id="deal_stage"
              value={stage}
              onChange={(e) => setStage(e.target.value as DealStage)}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            >
              {Object.entries(stageLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="text-[13px] text-destructive">{error}</p>}

          <div className="mt-1 flex justify-end gap-2">
            <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="animate-spin" /> : <Plus data-icon="inline-start" />}
              {deal ? 'Save Changes' : 'Create Deal'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
