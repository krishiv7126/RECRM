'use client'

import { useState } from 'react'
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

export function CreateCustomerDialog({ trigger }: { trigger: React.ReactElement }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [city, setCity] = useState('')

  function reset() {
    setFullName('')
    setPhone('')
    setEmail('')
    setCity('')
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

    const { data: me } = await supabase.from('platform_users').select('id, org_id').eq('auth_user_id', user.id).single()
    if (!me?.org_id) {
      setError('Could not resolve your organization.')
      setSubmitting(false)
      return
    }

    const { error: insertErr } = await supabase.from('customers').insert({
      org_id: me.org_id,
      owner_id: me.id,
      full_name: fullName.trim(),
      phone: phone.trim() || null,
      email: email.trim() || null,
      city: city.trim() || null,
    })

    setSubmitting(false)
    if (insertErr) {
      setError(insertErr.message)
      return
    }
    setOpen(false)
    reset()
    router.refresh()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) reset()
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Customer</DialogTitle>
          <DialogDescription>Add a new customer to your portfolio.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="cust_full_name" className="text-sm font-medium text-foreground">
              Full name <span className="text-destructive">*</span>
            </label>
            <Input id="cust_full_name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="cust_phone" className="text-sm font-medium text-foreground">
                Phone
              </label>
              <Input id="cust_phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="cust_email" className="text-sm font-medium text-foreground">
                Email
              </label>
              <Input id="cust_email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="cust_city" className="text-sm font-medium text-foreground">
              City
            </label>
            <Input id="cust_city" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          {error && <p className="text-[13px] text-destructive">{error}</p>}
          <div className="mt-1 flex justify-end gap-2">
            <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="animate-spin" /> : <Plus data-icon="inline-start" />}
              Create Customer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
