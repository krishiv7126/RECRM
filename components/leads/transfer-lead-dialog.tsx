'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
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

const ROLE_LABELS: Record<string, string> = { admin: 'Admin', manager: 'Manager', user: 'User' }

/**
 * Hand a lead to another team member (or back again). Lists the org's active
 * admins, managers and users; RLS scopes the list to the caller's org.
 */
export function TransferLeadDialog({
  open,
  onOpenChange,
  lead,
  onTransferred,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  lead: { id: string; full_name: string; owner_id: string | null } | null
  onTransferred?: (ownerId: string, ownerName: string) => void
}) {
  const router = useRouter()
  const [people, setPeople] = useState<{ id: string; full_name: string; role: string }[]>([])
  const [ownerId, setOwnerId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setOwnerId('')
    setError(null)
    createClient()
      .from('platform_users')
      .select('id, full_name, role')
      .eq('is_active', true)
      .in('role', ['admin', 'manager', 'user'])
      .order('full_name')
      .then(({ data }) => setPeople(data ?? []))
  }, [open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!lead || !ownerId) return
    setSubmitting(true)
    setError(null)
    const { error: updateErr } = await createClient().from('leads').update({ owner_id: ownerId }).eq('id', lead.id)
    setSubmitting(false)
    if (updateErr) {
      setError(updateErr.message)
      return
    }
    const name = people.find((p) => p.id === ownerId)?.full_name ?? 'new owner'
    toast.success(`${lead.full_name} transferred to ${name}`)
    onTransferred?.(ownerId, name)
    onOpenChange(false)
    router.refresh()
  }

  const options = people.filter((p) => p.id !== lead?.owner_id)
  const current = people.find((p) => p.id === lead?.owner_id)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transfer lead</DialogTitle>
          <DialogDescription>
            Move {lead?.full_name ?? 'this lead'} to another team member
            {current ? ` (currently with ${current.full_name})` : ''}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="transfer_owner" className="text-sm font-medium text-foreground">
              Transfer to
            </label>
            <select
              id="transfer_owner"
              value={ownerId}
              onChange={(e) => setOwnerId(e.target.value)}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            >
              <option value="">Select a team member…</option>
              {options.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name} · {ROLE_LABELS[p.role] ?? p.role}
                </option>
              ))}
            </select>
          </div>
          {error && <p className="text-[13px] text-destructive">{error}</p>}
          <div className="mt-1 flex justify-end gap-2">
            <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
            <Button type="submit" disabled={!ownerId || submitting}>
              {submitting && <Loader2 className="animate-spin" />}
              Transfer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
