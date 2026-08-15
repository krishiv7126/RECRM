'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Check, Loader2, Sparkles, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/dashboard/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import type { CustomerWithOwner } from '@/lib/customers/get-customers-data'

export function CustomerDetail({ customer }: { customer: CustomerWithOwner }) {
  const router = useRouter()
  const [fullName, setFullName] = useState(customer.full_name)
  const [phone, setPhone] = useState(customer.phone ?? '')
  const [email, setEmail] = useState(customer.email ?? '')
  const [city, setCity] = useState(customer.city ?? '')
  const [address, setAddress] = useState(customer.address ?? '')
  const [tags, setTags] = useState((customer.tags ?? []).join(', '))
  const [notes, setNotes] = useState(customer.notes ?? '')

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    setError(null)
    const supabase = createClient()
    const { error: updateErr } = await supabase
      .from('customers')
      .update({
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        email: email.trim() || null,
        city: city.trim() || null,
        address: address.trim() || null,
        tags: tags.trim() ? tags.split(',').map((t) => t.trim()).filter(Boolean) : null,
        notes: notes.trim() || null,
      })
      .eq('id', customer.id)
    setSaving(false)
    if (updateErr) {
      setError(updateErr.message)
      return
    }
    setSaved(true)
    router.refresh()
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleDelete() {
    if (!window.confirm(`Delete ${customer.full_name}? This cannot be undone.`)) return
    setDeleting(true)
    const supabase = createClient()
    const { error: deleteErr } = await supabase.from('customers').delete().eq('id', customer.id)
    setDeleting(false)
    if (deleteErr) {
      setError(deleteErr.message)
      return
    }
    router.push('/customers')
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/customers" className="mb-3 flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" />
          All customers
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <PageHeader
            crumbs={[{ label: 'Sales' }, { label: 'Customers', href: '/customers' }, { label: customer.full_name }]}
            title={customer.full_name}
          />
          {customer.owner?.full_name && <Badge variant="outline">Owner: {customer.owner.full_name}</Badge>}
        </div>
      </div>

      {customer.ai_summary ? (
        <div className="flex items-start gap-2 rounded-2xl border border-primary/20 bg-primary/5 p-4">
          <Sparkles className="size-4 shrink-0 text-primary" />
          <p className="text-[13px] text-foreground/90">{customer.ai_summary}</p>
        </div>
      ) : (
        <Link
          href="/ai-workspace/customer-summary"
          className="flex items-center gap-2 rounded-2xl border border-dashed border-border p-4 text-[13px] text-primary hover:bg-muted/40"
        >
          <Sparkles className="size-4 shrink-0" />
          No AI summary yet — generate one in AI Workspace
        </Link>
      )}

      <Card className="rounded-2xl border-border shadow-sm">
        <CardContent className="flex flex-col gap-4 p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Full name</label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Phone</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Email</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">City</label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-sm font-medium text-foreground">Address</label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-sm font-medium text-foreground">Tags (comma separated)</label>
              <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Investor, Repeat Buyer" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Notes</label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          {error && <p className="text-[13px] text-destructive">{error}</p>}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button disabled={saving} onClick={handleSave}>
              {saving ? <Loader2 className="animate-spin" /> : saved ? <Check data-icon="inline-start" /> : null}
              {saved ? 'Saved' : 'Save changes'}
            </Button>
            <Button variant="destructive" disabled={deleting} onClick={handleDelete}>
              {deleting ? <Loader2 className="animate-spin" /> : <Trash2 data-icon="inline-start" />}
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
