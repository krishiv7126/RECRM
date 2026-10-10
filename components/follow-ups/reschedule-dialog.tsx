'use client'

import { useEffect, useState } from 'react'
import { History, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface ReschedulableFollowUp {
  id: string
  due_at: string
  reschedule_count: number
}

interface HistoryRow {
  id: string
  old_due_at: string
  new_due_at: string
  reason: string | null
  created_at: string
  by: { full_name: string } | null
}

function toDatetimeLocal(d: Date) {
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function atTime(daysFromNow: number, hour: number) {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  d.setHours(hour, 0, 0, 0)
  return d
}

// Quick picks; "later today" is an hour from now rounded up to the next half hour.
function presets() {
  const inAnHour = new Date(Date.now() + 60 * 60 * 1000)
  inAnHour.setMinutes(inAnHour.getMinutes() <= 30 ? 30 : 60, 0, 0)
  return [
    { label: 'In 1 hour', date: inAnHour },
    { label: 'Tomorrow 10 AM', date: atTime(1, 10) },
    { label: 'In 2 days', date: atTime(2, 10) },
    { label: 'Next week', date: atTime(7, 10) },
  ]
}

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  })
}

/** Moves a follow-up to a new time with an optional reason; keeps a history of every move. */
export function RescheduleDialog({
  followUp,
  title,
  onOpenChange,
  onRescheduled,
}: {
  followUp: ReschedulableFollowUp | null
  title: string
  onOpenChange: (open: boolean) => void
  onRescheduled: (id: string, dueAt: string, count: number) => void
}) {
  const [dueAt, setDueAt] = useState('')
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [history, setHistory] = useState<HistoryRow[]>([])

  useEffect(() => {
    if (!followUp) return
    setDueAt(toDatetimeLocal(atTime(1, 10)))
    setReason('')
    setHistory([])
    if (followUp.reschedule_count === 0) return
    let cancelled = false
    createClient()
      .from('follow_up_reschedules')
      .select('id, old_due_at, new_due_at, reason, created_at, by:platform_users!follow_up_reschedules_rescheduled_by_fkey(full_name)')
      .eq('follow_up_id', followUp.id)
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (!cancelled) setHistory((data ?? []) as HistoryRow[])
      })
    return () => {
      cancelled = true
    }
  }, [followUp])

  async function handleSave() {
    if (!followUp || !dueAt) return
    const next = new Date(dueAt)
    if (Number.isNaN(next.getTime())) {
      toast.error('Pick a valid date and time.')
      return
    }
    if (next.getTime() < Date.now() - 60_000) {
      toast.error('Pick a time in the future.')
      return
    }
    setSaving(true)
    const { data, error } = await createClient().rpc('reschedule_follow_up', {
      p_follow_up_id: followUp.id,
      p_due_at: next.toISOString(),
      p_reason: reason.trim() || undefined,
    })
    setSaving(false)
    if (error || !data) {
      toast.error(error?.message ?? 'Could not reschedule.')
      return
    }
    toast.success(`Rescheduled to ${formatWhen(data.due_at)}`)
    onRescheduled(followUp.id, data.due_at, data.reschedule_count)
    onOpenChange(false)
  }

  const selected = dueAt ? new Date(dueAt).getTime() : 0

  return (
    <Dialog open={!!followUp} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reschedule follow-up</DialogTitle>
          <DialogDescription>
            {title}
            {followUp && ` · currently ${formatWhen(followUp.due_at)}`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2">
            {presets().map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => setDueAt(toDatetimeLocal(p.date))}
                className={cn(
                  'rounded-lg border border-border px-3 py-2 text-left text-[13px] transition-colors hover:bg-muted/60',
                  Math.abs(selected - p.date.getTime()) < 60_000 && 'border-primary bg-primary/5',
                )}
              >
                <span className="block font-medium text-foreground">{p.label}</span>
                <span className="block text-[11px] text-muted-foreground">{formatWhen(p.date.toISOString())}</span>
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="reschedule_at" className="text-sm font-medium text-foreground">
              Or pick a date and time
            </label>
            <Input id="reschedule_at" type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="reschedule_reason" className="text-sm font-medium text-foreground">
              Reason <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <Textarea
              id="reschedule_reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Client asked to call after Diwali"
              className="min-h-16"
            />
          </div>

          {history.length > 0 && (
            <div className="flex flex-col gap-1.5 rounded-lg bg-muted/40 px-3 py-2.5">
              <span className="flex items-center gap-1.5 text-[12px] font-medium text-foreground">
                <History className="size-3.5" />
                Rescheduled {followUp?.reschedule_count} time{followUp?.reschedule_count === 1 ? '' : 's'}
              </span>
              {history.map((h) => (
                <p key={h.id} className="text-[12px] text-muted-foreground">
                  {formatWhen(h.old_due_at)} → {formatWhen(h.new_due_at)}
                  {h.by?.full_name && ` · ${h.by.full_name}`}
                  {h.reason && <span className="block text-foreground/80">“{h.reason}”</span>}
                </p>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button disabled={saving || !dueAt} onClick={handleSave}>
              {saving && <Loader2 className="animate-spin" data-icon="inline-start" />}
              Reschedule
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
