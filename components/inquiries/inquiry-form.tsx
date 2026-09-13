'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Check, ClipboardPlus, Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/dashboard/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { DuplicatePhoneNotice } from '@/components/leads/duplicate-phone-notice'
import { createClient } from '@/lib/supabase/client'
import { autoScoreLead } from '@/lib/leads/auto-score'
import { useDuplicatePhoneCheck } from '@/lib/leads/use-duplicate-phone-check'

const INQUIRY_SOURCE = 'Offline Inquiry'

export function InquiryForm() {
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [city, setCity] = useState('')
  const [budgetMin, setBudgetMin] = useState('')
  const [budgetMax, setBudgetMax] = useState('')
  const [reference, setReference] = useState('')
  const [requirement, setRequirement] = useState('')
  const [notes, setNotes] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [justLogged, setJustLogged] = useState<string | null>(null)

  const { checking: checkingPhone, match: duplicateMatch } = useDuplicatePhoneCheck(phone)

  function resetForm() {
    setFullName('')
    setPhone('')
    setEmail('')
    setCity('')
    setBudgetMin('')
    setBudgetMax('')
    setReference('')
    setRequirement('')
    setNotes('')
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!fullName.trim()) {
      setError('Full name is required.')
      return
    }
    if (checkingPhone) {
      setError('Still checking this number against existing records — try again in a moment.')
      return
    }
    if (duplicateMatch) {
      setError(
        `This number already belongs to an existing ${duplicateMatch.type} (${duplicateMatch.full_name}). Open the existing record instead of creating a duplicate.`,
      )
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

    const { data: inserted, error: insertErr } = await supabase
      .from('leads')
      .insert({
        org_id: me.org_id,
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        email: email.trim() || null,
        city: city.trim() || null,
        budget_min: budgetMin ? Number(budgetMin) : null,
        budget_max: budgetMax ? Number(budgetMax) : null,
        reference: reference.trim() || null,
        requirement: requirement.trim() || null,
        notes: notes.trim() || null,
        source: INQUIRY_SOURCE,
      })
      .select('id')
      .single()

    setSubmitting(false)

    if (insertErr) {
      setError(insertErr.message)
      return
    }

    setJustLogged(fullName.trim())
    resetForm()
    if (inserted?.id) autoScoreLead(inserted.id)
    setTimeout(() => setJustLogged(null), 4000)
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <div>
        <Link href="/inquiries" className="mb-3 flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" />
          All inquiries
        </Link>
        <PageHeader
          crumbs={[{ label: 'Sales' }, { label: 'Front Desk' }, { label: 'New Inquiry' }]}
          title="New Inquiry"
          description="Log a walk-in, call, or offline inquiry — it's added to the pipeline as a lead."
        />
      </div>

      {justLogged && (
        <div className="flex items-center gap-2 rounded-2xl border border-success/30 bg-success/10 px-4 py-3 text-[13px] text-success">
          <Check className="size-4 shrink-0" />
          Logged inquiry for {justLogged}.
        </div>
      )}

      <Card className="rounded-2xl border-border shadow-sm">
        <CardContent className="p-5">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="inq_full_name" className="text-sm font-medium text-foreground">
                Full name <span className="text-destructive">*</span>
              </label>
              <Input id="inq_full_name" value={fullName} onChange={(e) => setFullName(e.target.value)} required autoFocus />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="inq_phone" className="text-sm font-medium text-foreground">
                  Phone
                </label>
                <Input id="inq_phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                <DuplicatePhoneNotice checking={checkingPhone} match={duplicateMatch} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="inq_email" className="text-sm font-medium text-foreground">
                  Email
                </label>
                <Input id="inq_email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="inq_city" className="text-sm font-medium text-foreground">
                City
              </label>
              <Input id="inq_city" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="inq_budget_min" className="text-sm font-medium text-foreground">
                  Budget min (₹)
                </label>
                <Input id="inq_budget_min" type="number" value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="inq_budget_max" className="text-sm font-medium text-foreground">
                  Budget max (₹)
                </label>
                <Input id="inq_budget_max" type="number" value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="inq_reference" className="text-sm font-medium text-foreground">
                Reference
              </label>
              <Input
                id="inq_reference"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g. Referred by Rohan Kapoor"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="inq_requirement" className="text-sm font-medium text-foreground">
                What are they asking about?
              </label>
              <Textarea
                id="inq_requirement"
                value={requirement}
                onChange={(e) => setRequirement(e.target.value)}
                placeholder="e.g. 2BHK budget 60L in Andheri, wants a site visit this weekend"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="inq_notes" className="text-sm font-medium text-foreground">
                Notes
              </label>
              <Textarea id="inq_notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything else worth flagging for sales" />
            </div>

            {error && (
              <p className="text-[13px] text-destructive">
                {error}
                {duplicateMatch && (
                  <>
                    {' '}
                    <Link
                      href={duplicateMatch.type === 'lead' ? `/leads/${duplicateMatch.id}` : `/customers/${duplicateMatch.id}`}
                      className="font-medium underline"
                    >
                      Open existing {duplicateMatch.type}
                    </Link>
                  </>
                )}
              </p>
            )}

            <Button type="submit" disabled={submitting || checkingPhone || !!duplicateMatch} className="w-fit">
              {submitting ? <Loader2 className="animate-spin" /> : <ClipboardPlus data-icon="inline-start" />}
              Log Inquiry
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
