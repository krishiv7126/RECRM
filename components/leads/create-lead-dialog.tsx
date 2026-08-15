'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

const sources = ['Website', 'Referral', 'Meta Ads', 'Google', '99acres', 'Walk-in', 'Other']

export function CreateLeadDialog({ trigger }: { trigger: React.ReactElement }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [source, setSource] = useState('')
  const [budgetMin, setBudgetMin] = useState('')
  const [budgetMax, setBudgetMax] = useState('')
  const [requirement, setRequirement] = useState('')

  function resetForm() {
    setFullName('')
    setPhone('')
    setEmail('')
    setSource('')
    setBudgetMin('')
    setBudgetMax('')
    setRequirement('')
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!fullName.trim()) {
      setError('Full name is required.')
      return
    }
    setSubmitting(true)
    setError(null)

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError('Not signed in.')
      setSubmitting(false)
      return
    }

    const { data: me } = await supabase.from('platform_users').select('org_id').eq('auth_user_id', user.id).single()
    if (!me?.org_id) {
      setError('Could not resolve your organization.')
      setSubmitting(false)
      return
    }

    const { error: insertErr } = await supabase.from('leads').insert({
      org_id: me.org_id,
      full_name: fullName.trim(),
      phone: phone.trim() || null,
      email: email.trim() || null,
      source: source || null,
      budget_min: budgetMin ? Number(budgetMin) : null,
      budget_max: budgetMax ? Number(budgetMax) : null,
      requirement: requirement.trim() || null,
    })

    setSubmitting(false)

    if (insertErr) {
      setError(insertErr.message)
      return
    }

    setOpen(false)
    resetForm()
    router.refresh()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) resetForm()
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Lead</DialogTitle>
          <DialogDescription>Add a new lead to your pipeline.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="lead_full_name" className="text-sm font-medium text-foreground">
              Full name <span className="text-destructive">*</span>
            </label>
            <Input id="lead_full_name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="lead_phone" className="text-sm font-medium text-foreground">
                Phone
              </label>
              <Input id="lead_phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="lead_email" className="text-sm font-medium text-foreground">
                Email
              </label>
              <Input id="lead_email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="lead_source" className="text-sm font-medium text-foreground">
              Source
            </label>
            <select
              id="lead_source"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            >
              <option value="">Select…</option>
              {sources.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="lead_budget_min" className="text-sm font-medium text-foreground">
                Budget min (₹)
              </label>
              <Input id="lead_budget_min" type="number" value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="lead_budget_max" className="text-sm font-medium text-foreground">
                Budget max (₹)
              </label>
              <Input id="lead_budget_max" type="number" value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="lead_requirement" className="text-sm font-medium text-foreground">
              Requirement
            </label>
            <Textarea id="lead_requirement" value={requirement} onChange={(e) => setRequirement(e.target.value)} placeholder="e.g. 3BHK in Powai, ready to move" />
          </div>

          {error && <p className="text-[13px] text-destructive">{error}</p>}

          <div className="mt-1 flex justify-end gap-2">
            <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="animate-spin" /> : <Plus data-icon="inline-start" />}
              Create Lead
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
