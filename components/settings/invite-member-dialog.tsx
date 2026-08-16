'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Copy, Loader2, Plus } from 'lucide-react'
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

interface CreatedAccount {
  full_name: string
  username: string
  password: string
  role: string
}

export function InviteMemberDialog({
  trigger,
  callerRole,
  managers,
}: {
  trigger: React.ReactElement
  callerRole: string
  managers: { id: string; full_name: string }[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState<CreatedAccount | null>(null)
  const [copied, setCopied] = useState(false)

  const isAdmin = callerRole === 'admin' || callerRole === 'super_admin'

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState<'manager' | 'user'>(isAdmin ? 'manager' : 'user')
  const [parentId, setParentId] = useState('')

  useEffect(() => {
    if (open) return
    setFullName('')
    setPhone('')
    setRole(isAdmin ? 'manager' : 'user')
    setParentId('')
    setError(null)
    setCreated(null)
    setCopied(false)
  }, [open, isAdmin])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!fullName.trim()) {
      setError('Full name is required.')
      return
    }
    if (isAdmin && role === 'user' && !parentId) {
      setError('Pick which manager this user reports to.')
      return
    }

    setSubmitting(true)
    setError(null)
    const supabase = createClient()

    const { data, error: fnError } = await supabase.functions.invoke('invite-team-member', {
      body: {
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        role: isAdmin ? role : undefined,
        parent_id: isAdmin && role === 'user' ? parentId : undefined,
      },
    })

    setSubmitting(false)

    if (fnError || data?.error) {
      setError(data?.error ?? fnError?.message ?? 'Failed to invite team member.')
      return
    }

    setCreated(data)
  }

  function handleClose(next: boolean) {
    setOpen(next)
    if (!next && created) router.refresh()
  }

  async function copyCredentials() {
    if (!created) return
    await navigator.clipboard.writeText(`Username: ${created.username}\nPassword: ${created.password}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        {created ? (
          <>
            <DialogHeader>
              <DialogTitle>Account created</DialogTitle>
              <DialogDescription>
                Share these credentials with {created.full_name} — this password is shown only once.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3">
              <div className="rounded-xl border border-border bg-muted/40 p-4">
                <div className="flex flex-col gap-2 text-[13px]">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Username</span>
                    <span className="font-mono font-medium text-foreground">{created.username}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Password</span>
                    <span className="font-mono font-medium text-foreground">{created.password}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Role</span>
                    <span className="font-medium capitalize text-foreground">{created.role}</span>
                  </div>
                </div>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={copyCredentials}>
                {copied ? <Check data-icon="inline-start" /> : <Copy data-icon="inline-start" />}
                {copied ? 'Copied' : 'Copy credentials'}
              </Button>
              <div className="mt-1 flex justify-end">
                <Button type="button" onClick={() => handleClose(false)}>
                  Done
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
              <DialogDescription>
                {isAdmin
                  ? 'Create a manager or user account for your organization.'
                  : 'Create a user account that reports to you.'}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="invite_name" className="text-sm font-medium text-foreground">
                  Full name <span className="text-destructive">*</span>
                </label>
                <Input id="invite_name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="invite_phone" className="text-sm font-medium text-foreground">
                  Phone
                </label>
                <Input id="invite_phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>

              {isAdmin && (
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="invite_role" className="text-sm font-medium text-foreground">
                    Role
                  </label>
                  <select
                    id="invite_role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as 'manager' | 'user')}
                    className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                  >
                    <option value="manager">Manager</option>
                    <option value="user">User</option>
                  </select>
                </div>
              )}

              {isAdmin && role === 'user' && (
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="invite_manager" className="text-sm font-medium text-foreground">
                    Reports to <span className="text-destructive">*</span>
                  </label>
                  <select
                    id="invite_manager"
                    value={parentId}
                    onChange={(e) => setParentId(e.target.value)}
                    className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                  >
                    <option value="">Select a manager…</option>
                    {managers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.full_name}
                      </option>
                    ))}
                  </select>
                  {managers.length === 0 && (
                    <p className="text-[11px] text-muted-foreground">
                      No managers yet — invite a manager first.
                    </p>
                  )}
                </div>
              )}

              {error && <p className="text-[13px] text-destructive">{error}</p>}

              <div className="mt-1 flex justify-end gap-2">
                <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
                <Button type="submit" disabled={submitting}>
                  {submitting ? <Loader2 className="animate-spin" /> : <Plus data-icon="inline-start" />}
                  Create Account
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
