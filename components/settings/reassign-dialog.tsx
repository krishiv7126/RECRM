'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'

export function ReassignDialog({
  open,
  onOpenChange,
  member,
  managers,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  member: { id: string; full_name: string; parent_id: string | null } | null
  managers: { id: string; full_name: string }[]
}) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [parentId, setParentId] = useState('')

  useEffect(() => {
    if (!open) return
    setParentId(member?.parent_id ?? '')
    setError(null)
  }, [open, member])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!member || !parentId) {
      setError('Pick a manager.')
      return
    }
    setSubmitting(true)
    setError(null)
    const supabase = createClient()
    const { error: updateErr } = await supabase
      .from('platform_users')
      .update({ parent_id: parentId })
      .eq('id', member.id)

    setSubmitting(false)
    if (updateErr) {
      setError(updateErr.message)
      return
    }
    onOpenChange(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reassign {member?.full_name}</DialogTitle>
          <DialogDescription>Choose the manager this person reports to.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <select
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          >
            <option value="">Select a manager…</option>
            {managers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.full_name}
              </option>
            ))}
          </select>
          {error && <p className="text-[13px] text-destructive">{error}</p>}
          <div className="mt-1 flex justify-end gap-2">
            <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="animate-spin" /> : null}
              Save
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
