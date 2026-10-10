'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
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
import { autoScoreLead } from '@/lib/leads/auto-score'
import { useDuplicatePhoneCheck } from '@/lib/leads/use-duplicate-phone-check'
import { DuplicatePhoneNotice } from '@/components/leads/duplicate-phone-notice'
import { sanitizeDigits } from '@/lib/sanitize-number-input'
import { CP_SOURCE, LEAD_SOURCES, REFERRAL_SOURCE } from '@/lib/leads/cp-source'
import { ChannelPartnerField, EMPTY_CP, validateChannelPartner, type ChannelPartner } from '@/components/leads/channel-partner-field'
import { ReferenceField, validateReference, type ReferenceValue } from '@/components/leads/reference-field'
import { LEAD_CATEGORIES } from '@/lib/leads/lead-fields'
import { toast } from 'sonner'

export function CreateLeadDialog({ trigger }: { trigger: React.ReactElement }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [source, setSource] = useState('')
  const [budget, setBudget] = useState('')
  const [channelPartner, setChannelPartner] = useState<ChannelPartner>(EMPTY_CP)
  const [reference, setReference] = useState<ReferenceValue>({ name: '', phone: '' })
  const [requirement, setRequirement] = useState('')
  const [category, setCategory] = useState('')
  const [city, setCity] = useState('')
  const [notes, setNotes] = useState('')
  const [scheduleVisit, setScheduleVisit] = useState(false)
  const [visitPropertyId, setVisitPropertyId] = useState('')
  const [visitAt, setVisitAt] = useState('')
  const [properties, setProperties] = useState<{ id: string; title: string }[]>([])

  // Properties are only needed once the user opts into booking a site visit.
  useEffect(() => {
    if (!scheduleVisit || properties.length > 0) return
    createClient()
      .from('properties')
      .select('id, title')
      .order('title')
      .then(({ data }) => setProperties(data ?? []))
  }, [scheduleVisit, properties.length])

  const { checking: checkingPhone, match: duplicateMatch } = useDuplicatePhoneCheck(phone)

  function resetForm() {
    setFullName('')
    setPhone('')
    setEmail('')
    setSource('')
    setBudget('')
    setChannelPartner(EMPTY_CP)
    setReference({ name: '', phone: '' })
    setRequirement('')
    setCategory('')
    setCity('')
    setNotes('')
    setScheduleVisit(false)
    setVisitPropertyId('')
    setVisitAt('')
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!fullName.trim()) {
      setError('Full name is required.')
      return
    }
    const detailsError =
      source === CP_SOURCE
        ? validateChannelPartner(channelPartner)
        : source === REFERRAL_SOURCE
          ? validateReference(reference, true)
          : null
    if (detailsError) {
      setError(detailsError)
      return
    }
    if (scheduleVisit && !visitAt) {
      setError('Pick a date and time for the site visit.')
      return
    }
    if (checkingPhone) {
      setError('Still checking this number against existing records — try again in a moment.')
      return
    }
    if (duplicateMatch) {
      setError(
        `This number already belongs to an existing ${duplicateMatch.type === 'customer' ? 'member' : 'lead'} (${duplicateMatch.full_name}). Open the existing record instead of creating a duplicate.`,
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

    const { data: me } = await supabase.from('platform_users').select('id, org_id').eq('auth_user_id', user.id).single()
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
        source: source || null,
        // One budget figure; stored on both ends so range-based scoring and
        // automation conditions keep working.
        budget_min: budget ? Number(budget) : null,
        budget_max: budget ? Number(budget) : null,
        channel_partner: source === CP_SOURCE ? channelPartner.name.trim() : null,
        cp_phone: source === CP_SOURCE ? channelPartner.phone.trim() : null,
        cp_firm: source === CP_SOURCE ? channelPartner.firm.trim() || null : null,
        reference: source === REFERRAL_SOURCE ? reference.name.trim() : null,
        reference_phone: source === REFERRAL_SOURCE ? reference.phone.trim() : null,
        requirement: requirement.trim() || null,
        category: category || null,
        city: city.trim() || null,
        notes: notes.trim() || null,
        ...(scheduleVisit ? { stage: 'site_visit' as const } : {}),
      })
      .select('id')
      .single()

    if (insertErr) {
      setSubmitting(false)
      setError(insertErr.message)
      toast.error(insertErr.message)
      return
    }

    if (scheduleVisit && inserted?.id) {
      const { error: visitErr } = await supabase.from('site_visits').insert({
        org_id: me.org_id,
        owner_id: me.id,
        lead_id: inserted.id,
        property_id: visitPropertyId || null,
        scheduled_at: new Date(visitAt).toISOString(),
      })
      if (visitErr) toast.error(`Lead created, but the site visit couldn't be scheduled: ${visitErr.message}`)
    }

    setSubmitting(false)
    toast.success(scheduleVisit ? 'Lead created and site visit scheduled' : 'Lead created')
    setOpen(false)
    resetForm()
    router.refresh()

    // Score in the background so the new lead shows up with an AI score
    // without anyone having to click into it and hit "Score".
    if (inserted?.id) {
      autoScoreLead(inserted.id, () => router.refresh())
    }
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
              <DuplicatePhoneNotice checking={checkingPhone} match={duplicateMatch} />
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
              {LEAD_SOURCES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {source === CP_SOURCE && <ChannelPartnerField value={channelPartner} onChange={setChannelPartner} />}
          {source === REFERRAL_SOURCE && (
            <div className="grid grid-cols-2 gap-3">
              <ReferenceField value={reference} onChange={setReference} required />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="lead_budget" className="text-sm font-medium text-foreground">
                Budget (₹)
              </label>
              <Input
                id="lead_budget"
                type="text"
                inputMode="numeric"
                value={budget}
                onChange={(e) => setBudget(sanitizeDigits(e.target.value))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="lead_city" className="text-sm font-medium text-foreground">
                Area
              </label>
              <Input id="lead_city" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="lead_requirement" className="text-sm font-medium text-foreground">
                Segment
              </label>
              <Input id="lead_requirement" value={requirement} onChange={(e) => setRequirement(e.target.value)} placeholder="e.g. 2 BHK, 3 BHK, Villa, Office" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="lead_category" className="text-sm font-medium text-foreground">
                Category
              </label>
              <select
                id="lead_category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              >
                <option value="">Select…</option>
                {LEAD_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>


          <div className="flex flex-col gap-3 rounded-xl border border-border p-3">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <input
                type="checkbox"
                checked={scheduleVisit}
                onChange={(e) => setScheduleVisit(e.target.checked)}
                className="size-4 accent-[var(--primary)]"
              />
              Schedule a site visit
            </label>
            {scheduleVisit && (
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="lead_visit_property" className="text-sm font-medium text-foreground">
                    Property
                  </label>
                  <select
                    id="lead_visit_property"
                    value={visitPropertyId}
                    onChange={(e) => setVisitPropertyId(e.target.value)}
                    className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                  >
                    <option value="">Not decided yet</option>
                    {properties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="lead_visit_at" className="text-sm font-medium text-foreground">
                    Date &amp; time <span className="text-destructive">*</span>
                  </label>
                  <Input id="lead_visit_at" type="datetime-local" value={visitAt} onChange={(e) => setVisitAt(e.target.value)} />
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="lead_notes" className="text-sm font-medium text-foreground">
              Remarks
            </label>
            <Textarea id="lead_notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
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
                    Open existing {duplicateMatch.type === 'customer' ? 'member' : 'lead'}
                  </Link>
                </>
              )}
            </p>
          )}

          <div className="mt-1 flex justify-end gap-2">
            <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
            <Button type="submit" disabled={submitting || checkingPhone || !!duplicateMatch}>
              {submitting ? <Loader2 className="animate-spin" /> : <Plus data-icon="inline-start" />}
              Create Lead
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
