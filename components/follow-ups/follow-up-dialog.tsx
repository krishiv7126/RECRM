'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Plus } from 'lucide-react'
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

type FollowUpType = Database['public']['Enums']['follow_up_type']
type FollowUpStatus = Database['public']['Enums']['follow_up_status']
type LinkKind = 'none' | 'lead' | 'customer' | 'deal'

const typeLabels: Record<FollowUpType, string> = {
  call: 'Call',
  whatsapp: 'WhatsApp',
  email: 'Email',
  meeting: 'Meeting',
  other: 'Other',
}

const statusLabels: Record<FollowUpStatus, string> = {
  pending: 'Pending',
  done: 'Done',
  missed: 'Missed',
}

function toDatetimeLocal(iso: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

interface EditableFollowUp {
  id: string
  type: FollowUpType
  status: FollowUpStatus
  due_at: string
  notes: string | null
  lead_id: string | null
  customer_id: string | null
  deal_id: string | null
  owner_id: string
}

export function FollowUpDialog({
  trigger,
  open: openProp,
  onOpenChange: onOpenChangeProp,
  leads,
  customers,
  deals,
  owners,
  followUp,
}: {
  trigger?: React.ReactElement
  open?: boolean
  onOpenChange?: (open: boolean) => void
  leads: { id: string; full_name: string }[]
  customers: { id: string; full_name: string }[]
  deals: { id: string; code: string; title: string }[]
  owners: { id: string; full_name: string }[]
  followUp?: EditableFollowUp
}) {
  const router = useRouter()
  const [openState, setOpenState] = useState(false)
  const open = openProp ?? openState
  const setOpen = onOpenChangeProp ?? setOpenState

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [linkKind, setLinkKind] = useState<LinkKind>('none')
  const [recordId, setRecordId] = useState('')
  const [type, setType] = useState<FollowUpType>('call')
  const [dueAt, setDueAt] = useState('')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState<FollowUpStatus>('pending')
  const [ownerId, setOwnerId] = useState('')

  useEffect(() => {
    if (!open) return
    const kind: LinkKind = followUp?.lead_id
      ? 'lead'
      : followUp?.customer_id
        ? 'customer'
        : followUp?.deal_id
          ? 'deal'
          : 'none'
    setLinkKind(kind)
    setRecordId(followUp?.lead_id ?? followUp?.customer_id ?? followUp?.deal_id ?? '')
    setType(followUp?.type ?? 'call')
    setDueAt(toDatetimeLocal(followUp?.due_at ?? null) || toDatetimeLocal(new Date().toISOString()))
    setNotes(followUp?.notes ?? '')
    setStatus(followUp?.status ?? 'pending')
    setOwnerId(followUp?.owner_id ?? '')
    setError(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, followUp?.id])

  const records = useMemo(() => {
    if (linkKind === 'lead') return leads.map((l) => ({ id: l.id, label: l.full_name }))
    if (linkKind === 'customer') return customers.map((c) => ({ id: c.id, label: c.full_name }))
    if (linkKind === 'deal') return deals.map((d) => ({ id: d.id, label: `${d.code} — ${d.title}` }))
    return []
  }, [linkKind, leads, customers, deals])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!dueAt) {
      setError('Due date is required.')
      return
    }
    setSubmitting(true)
    setError(null)

    const supabase = createClient()
    const dueIso = new Date(dueAt).toISOString()
    const linkFields = {
      lead_id: linkKind === 'lead' ? recordId || null : null,
      customer_id: linkKind === 'customer' ? recordId || null : null,
      deal_id: linkKind === 'deal' ? recordId || null : null,
    }

    if (followUp) {
      const { error: updateErr } = await supabase
        .from('follow_ups')
        .update({
          type,
          due_at: dueIso,
          notes: notes.trim() || null,
          status,
          owner_id: ownerId || followUp.owner_id,
          completed_at: status === 'done' ? new Date().toISOString() : null,
          ...linkFields,
        })
        .eq('id', followUp.id)

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

      const { error: insertErr } = await supabase.from('follow_ups').insert({
        org_id: me.org_id,
        owner_id: ownerId || me.id,
        type,
        due_at: dueIso,
        notes: notes.trim() || null,
        ...linkFields,
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
          <DialogTitle>{followUp ? 'Edit Follow-up' : 'New Follow-up'}</DialogTitle>
          <DialogDescription>
            {followUp ? 'Update this follow-up.' : 'Schedule a follow-up task.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="fu_link_kind" className="text-sm font-medium text-foreground">
                Linked to
              </label>
              <select
                id="fu_link_kind"
                value={linkKind}
                onChange={(e) => {
                  setLinkKind(e.target.value as LinkKind)
                  setRecordId('')
                }}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              >
                <option value="none">None</option>
                <option value="lead">Lead</option>
                <option value="customer">Customer</option>
                <option value="deal">Deal</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="fu_record" className="text-sm font-medium text-foreground">
                Record
              </label>
              <select
                id="fu_record"
                value={recordId}
                onChange={(e) => setRecordId(e.target.value)}
                disabled={linkKind === 'none'}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30"
              >
                <option value="">Select…</option>
                {records.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="fu_type" className="text-sm font-medium text-foreground">
                Type
              </label>
              <select
                id="fu_type"
                value={type}
                onChange={(e) => setType(e.target.value as FollowUpType)}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              >
                {Object.entries(typeLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="fu_due_at" className="text-sm font-medium text-foreground">
                Due <span className="text-destructive">*</span>
              </label>
              <input
                id="fu_due_at"
                type="datetime-local"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
                required
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              />
            </div>
          </div>

          {followUp && (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="fu_status" className="text-sm font-medium text-foreground">
                  Status
                </label>
                <select
                  id="fu_status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as FollowUpStatus)}
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
                <label htmlFor="fu_owner" className="text-sm font-medium text-foreground">
                  Owner
                </label>
                <select
                  id="fu_owner"
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
            <label htmlFor="fu_notes" className="text-sm font-medium text-foreground">
              Notes
            </label>
            <Textarea id="fu_notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What needs to happen…" />
          </div>

          {error && <p className="text-[13px] text-destructive">{error}</p>}

          <div className="mt-1 flex justify-end gap-2">
            <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="animate-spin" /> : <Plus data-icon="inline-start" />}
              {followUp ? 'Save Changes' : 'Create Follow-up'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
