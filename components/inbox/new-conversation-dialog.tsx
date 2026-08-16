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
import { cn } from '@/lib/utils'

export function NewConversationDialog({
  trigger,
  me,
  teammates,
  mode,
}: {
  trigger: React.ReactElement
  me: { id: string; org_id: string | null }
  teammates: { id: string; full_name: string; role: string }[]
  mode: 'dm' | 'group'
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [subject, setSubject] = useState('')
  const [selected, setSelected] = useState<string[]>([])

  useEffect(() => {
    if (open) return
    setSubject('')
    setSelected([])
    setError(null)
  }, [open])

  function toggle(id: string) {
    if (mode === 'dm') {
      setSelected([id])
      return
    }
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (selected.length === 0) {
      setError(mode === 'dm' ? 'Pick someone to message.' : 'Pick at least two people for a group.')
      return
    }
    if (mode === 'group' && selected.length < 2) {
      setError('A group needs at least two other people.')
      return
    }
    if (mode === 'group' && !subject.trim()) {
      setError('Give the group a name.')
      return
    }
    if (!me.org_id) {
      setError('Could not resolve your organization.')
      return
    }

    setSubmitting(true)
    setError(null)
    const supabase = createClient()

    const { data: conversation, error: convErr } = await supabase
      .from('conversations')
      .insert({
        org_id: me.org_id,
        owner_id: me.id,
        channel: 'internal_chat',
        subject: mode === 'group' ? subject.trim() : null,
        last_message_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (convErr) {
      setSubmitting(false)
      setError(convErr.message)
      return
    }

    const { error: partErr } = await supabase.from('conversation_participants').insert(
      [me.id, ...selected].map((platform_user_id) => ({
        conversation_id: conversation.id,
        platform_user_id,
      })),
    )

    setSubmitting(false)
    if (partErr) {
      setError(partErr.message)
      return
    }

    setOpen(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === 'dm' ? 'New Message' : 'New Group'}</DialogTitle>
          <DialogDescription>
            {mode === 'dm' ? 'Start a direct message with a teammate.' : 'Create a group chat with your team.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {mode === 'group' && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="conv_subject" className="text-sm font-medium text-foreground">
                Group name <span className="text-destructive">*</span>
              </label>
              <Input
                id="conv_subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Mumbai Sales Team"
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">
              {mode === 'dm' ? 'Teammate' : 'Members'} <span className="text-destructive">*</span>
            </label>
            <div className="flex max-h-56 flex-col gap-1 overflow-y-auto rounded-xl border border-border p-1.5">
              {teammates.length === 0 && (
                <p className="px-2 py-4 text-center text-[12px] text-muted-foreground">
                  No other team members in your organization yet.
                </p>
              )}
              {teammates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggle(t.id)}
                  className={cn(
                    'flex items-center justify-between rounded-lg px-2.5 py-2 text-left text-[13px] transition-colors hover:bg-muted/60',
                    selected.includes(t.id) && 'bg-primary/10',
                  )}
                >
                  <span className="font-medium text-foreground">{t.full_name}</span>
                  <span className="text-[11px] capitalize text-muted-foreground">{t.role}</span>
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-[13px] text-destructive">{error}</p>}

          <div className="mt-1 flex justify-end gap-2">
            <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="animate-spin" /> : <Plus data-icon="inline-start" />}
              {mode === 'dm' ? 'Start Chat' : 'Create Group'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
