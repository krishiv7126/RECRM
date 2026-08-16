'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
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

type VisitStatus = Database['public']['Enums']['site_visit_status']
type VisitorKind = 'lead' | 'customer'

const statusLabels: Record<VisitStatus, string> = {
  scheduled: 'Scheduled',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No Show',
}

function toDatetimeLocal(iso: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

interface EditableSiteVisit {
  id: string
  property_id: string | null
  lead_id: string | null
  customer_id: string | null
  scheduled_at: string
  status: VisitStatus
  feedback: string | null
  owner_id: string
}

export function SiteVisitDialog({
  trigger,
  open: openProp,
  onOpenChange: onOpenChangeProp,
  leads,
  customers,
  properties,
  owners,
  visit,
}: {
  trigger?: React.ReactElement
  open?: boolean
  onOpenChange?: (open: boolean) => void
  leads: { id: string; full_name: string }[]
  customers: { id: string; full_name: string }[]
  properties: { id: string; title: string }[]
  owners: { id: string; full_name: string }[]
  visit?: EditableSiteVisit
}) {
  const router = useRouter()
  const [openState, setOpenState] = useState(false)
  const open = openProp ?? openState
  const setOpen = onOpenChangeProp ?? setOpenState

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [propertyId, setPropertyId] = useState('')
  const [visitorKind, setVisitorKind] = useState<VisitorKind>('lead')
  const [visitorId, setVisitorId] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [status, setStatus] = useState<VisitStatus>('scheduled')
  const [feedback, setFeedback] = useState('')
  const [ownerId, setOwnerId] = useState('')

  useEffect(() => {
    if (!open) return
    setPropertyId(visit?.property_id ?? '')
    setVisitorKind(visit?.customer_id ? 'customer' : 'lead')
    setVisitorId(visit?.lead_id ?? visit?.customer_id ?? '')
    setScheduledAt(toDatetimeLocal(visit?.scheduled_at ?? null) || toDatetimeLocal(new Date().toISOString()))
    setStatus(visit?.status ?? 'scheduled')
    setFeedback(visit?.feedback ?? '')
    setOwnerId(visit?.owner_id ?? '')
    setError(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, visit?.id])

  const visitorOptions = useMemo(
    () => (visitorKind === 'lead' ? leads : customers),
    [visitorKind, leads, customers],
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!scheduledAt) {
      setError('Date & time is required.')
      return
    }
    setSubmitting(true)
    setError(null)

    const supabase = createClient()
    const scheduledIso = new Date(scheduledAt).toISOString()
    const visitorFields = {
      lead_id: visitorKind === 'lead' ? visitorId || null : null,
      customer_id: visitorKind === 'customer' ? visitorId || null : null,
    }

    if (visit) {
      const { error: updateErr } = await supabase
        .from('site_visits')
        .update({
          property_id: propertyId || null,
          scheduled_at: scheduledIso,
          status,
          feedback: feedback.trim() || null,
          owner_id: ownerId || visit.owner_id,
          ...visitorFields,
        })
        .eq('id', visit.id)

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

      const { error: insertErr } = await supabase.from('site_visits').insert({
        org_id: me.org_id,
        owner_id: ownerId || me.id,
        property_id: propertyId || null,
        scheduled_at: scheduledIso,
        ...visitorFields,
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
          <DialogTitle>{visit ? 'Edit Site Visit' : 'Schedule Visit'}</DialogTitle>
          <DialogDescription>{visit ? 'Update this site visit.' : 'Schedule a new property site visit.'}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="sv_property" className="text-sm font-medium text-foreground">
              Property
            </label>
            <select
              id="sv_property"
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

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="sv_visitor_kind" className="text-sm font-medium text-foreground">
                Visitor type
              </label>
              <select
                id="sv_visitor_kind"
                value={visitorKind}
                onChange={(e) => {
                  setVisitorKind(e.target.value as VisitorKind)
                  setVisitorId('')
                }}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              >
                <option value="lead">Lead</option>
                <option value="customer">Customer</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="sv_visitor" className="text-sm font-medium text-foreground">
                Visitor
              </label>
              <select
                id="sv_visitor"
                value={visitorId}
                onChange={(e) => setVisitorId(e.target.value)}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              >
                <option value="">Select…</option>
                {visitorOptions.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.full_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="sv_scheduled_at" className="text-sm font-medium text-foreground">
              Date &amp; time <span className="text-destructive">*</span>
            </label>
            <input
              id="sv_scheduled_at"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              required
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            />
          </div>

          {visit && (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="sv_status" className="text-sm font-medium text-foreground">
                  Status
                </label>
                <select
                  id="sv_status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as VisitStatus)}
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                >
                  {Object.entries(statusLabels).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="sv_owner" className="text-sm font-medium text-foreground">
                  Owner
                </label>
                <select
                  id="sv_owner"
                  value={ownerId}
                  onChange={(e) => setOwnerId(e.target.value)}
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                >
                  {owners.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.full_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="sv_feedback" className="text-sm font-medium text-foreground">
              Feedback
            </label>
            <Textarea id="sv_feedback" value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Notes from the visit…" />
          </div>

          {error && <p className="text-[13px] text-destructive">{error}</p>}

          <div className="mt-1 flex justify-end gap-2">
            <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="animate-spin" /> : <Calendar data-icon="inline-start" />}
              {visit ? 'Save Changes' : 'Schedule Visit'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
