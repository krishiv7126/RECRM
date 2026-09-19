'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Check, Loader2, Mail, Phone as PhoneIcon, Repeat, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon'
import { PageHeader } from '@/components/dashboard/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useConfirm } from '@/components/ui/use-confirm'
import { createClient } from '@/lib/supabase/client'
import { autoScoreLead } from '@/lib/leads/auto-score'
import { deriveTemperature } from '@/lib/leads/temperature'
import { sanitizeDigits } from '@/lib/sanitize-number-input'
import type { LeadWithOwner } from '@/lib/leads/get-leads-data'

const sources = ['Website', 'Referral', 'Meta Ads', 'Google', '99acres', 'Walk-in', 'Other']
const stages = ['new', 'contacted', 'qualified', 'proposal', 'site_visit', 'won', 'lost', 'archive'] as const

export function LeadDetail({ lead }: { lead: LeadWithOwner }) {
  const router = useRouter()
  const [fullName, setFullName] = useState(lead.full_name)
  const [phone, setPhone] = useState(lead.phone ?? '')
  const [email, setEmail] = useState(lead.email ?? '')
  const [source, setSource] = useState(lead.source ?? '')
  const [stage, setStage] = useState(lead.stage)
  const [budgetMin, setBudgetMin] = useState(lead.budget_min?.toString() ?? '')
  const [budgetMax, setBudgetMax] = useState(lead.budget_max?.toString() ?? '')
  const [requirement, setRequirement] = useState(lead.requirement ?? '')
  const [city, setCity] = useState(lead.city ?? '')
  const [reference, setReference] = useState(lead.reference ?? '')
  const [tags, setTags] = useState((lead.tags ?? []).join(', '))
  const [notes, setNotes] = useState(lead.notes ?? '')

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [converting, setConverting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [liveScore, setLiveScore] = useState(lead.ai_score)
  const { confirm, ConfirmDialog } = useConfirm()

  useEffect(() => {
    if (lead.ai_score !== null) return
    autoScoreLead(lead.id, (score) => setLiveScore(score))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead.id])

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    setError(null)
    const supabase = createClient()
    const { error: updateErr } = await supabase
      .from('leads')
      .update({
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        email: email.trim() || null,
        source: source || null,
        stage,
        budget_min: budgetMin ? Number(budgetMin) : null,
        budget_max: budgetMax ? Number(budgetMax) : null,
        requirement: requirement.trim() || null,
        city: city.trim() || null,
        reference: reference.trim() || null,
        tags: tags.trim() ? tags.split(',').map((t) => t.trim()).filter(Boolean) : null,
        notes: notes.trim() || null,
      })
      .eq('id', lead.id)
    setSaving(false)
    if (updateErr) {
      setError(updateErr.message)
      toast.error(updateErr.message)
      return
    }
    setSaved(true)
    toast.success('Lead updated')
    router.refresh()
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleConvert() {
    const ok = await confirm({
      title: 'Convert to customer?',
      description: `Convert ${lead.full_name} to a customer? They'll move out of the leads pipeline.`,
      confirmLabel: 'Convert',
    })
    if (!ok) return
    setConverting(true)
    const supabase = createClient()
    const { error: convertErr } = await supabase.rpc('fn_convert_lead_to_customer', { p_lead_id: lead.id })
    setConverting(false)
    if (convertErr) {
      setError(convertErr.message)
      toast.error(convertErr.message)
      return
    }
    toast.success(`${lead.full_name} converted to customer`)
    router.push('/customers')
  }

  async function handleDelete() {
    const ok = await confirm({
      title: 'Delete lead?',
      description: `Are you sure you want to delete ${lead.full_name}? This action cannot be undone.`,
      confirmLabel: 'Delete',
      destructive: true,
    })
    if (!ok) return
    setDeleting(true)
    const supabase = createClient()
    const { error: deleteErr } = await supabase.from('leads').delete().eq('id', lead.id)
    setDeleting(false)
    if (deleteErr) {
      setError(deleteErr.message)
      toast.error(deleteErr.message)
      return
    }
    toast.success(`${lead.full_name} deleted`)
    router.push('/leads')
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/leads" className="mb-3 flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" />
          All leads
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <PageHeader
            crumbs={[{ label: 'Sales' }, { label: 'Pipeline', href: '/leads' }, { label: lead.full_name }]}
            title={lead.full_name}
          />
          <div className="flex items-center gap-2">
            {lead.owner?.full_name && <Badge variant="outline">Owner: {lead.owner.full_name}</Badge>}
            {liveScore !== null && <Badge className="bg-primary/15 text-primary">AI Score {liveScore}</Badge>}
            {deriveTemperature(liveScore) === 'hot' && <Badge className="bg-destructive/10 text-destructive">🔥 Hot</Badge>}
          </div>
        </div>
      </div>

      <Card className="rounded-2xl border-border shadow-sm">
        <CardContent className="flex flex-col gap-4 p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Full name</label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Phone</label>
              <div className="flex items-center gap-1.5">
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
                <Button
                  variant="outline"
                  size="icon-sm"
                  disabled={!phone}
                  aria-label={`Call ${lead.full_name}`}
                  render={<a href={phone ? `tel:${phone}` : undefined} />}
                  nativeButton={false}
                >
                  <PhoneIcon className="size-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon-sm"
                  disabled={!phone}
                  aria-label={`WhatsApp ${lead.full_name}`}
                  render={<a href={phone ? `https://wa.me/${phone.replace(/\D/g, '')}` : undefined} target="_blank" rel="noreferrer" />}
                  nativeButton={false}
                >
                  <WhatsAppIcon className="size-3.5" />
                </Button>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Email</label>
              <div className="flex items-center gap-1.5">
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                <Button
                  variant="outline"
                  size="icon-sm"
                  disabled={!email}
                  aria-label={`Email ${lead.full_name}`}
                  render={<a href={email ? `mailto:${email}` : undefined} />}
                  nativeButton={false}
                >
                  <Mail className="size-3.5" />
                </Button>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">City</label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Source</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none dark:bg-input/30"
              >
                <option value="">Select…</option>
                {sources.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Stage</label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value as typeof stage)}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm capitalize outline-none dark:bg-input/30"
              >
                {stages.map((s) => (
                  <option key={s} value={s} className="capitalize">
                    {s.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Budget min (₹)</label>
              <Input
                type="text"
                inputMode="numeric"
                value={budgetMin}
                onChange={(e) => setBudgetMin(sanitizeDigits(e.target.value))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Budget max (₹)</label>
              <Input
                type="text"
                inputMode="numeric"
                value={budgetMax}
                onChange={(e) => setBudgetMax(sanitizeDigits(e.target.value))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Reference</label>
              <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. Referred by Rohan Kapoor" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Requirement</label>
            <Textarea value={requirement} onChange={(e) => setRequirement(e.target.value)} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Tags (comma separated)</label>
            <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="NRI, Urgent, Referral" />
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
            <div className="flex items-center gap-2">
              <Button variant="outline" disabled={converting} onClick={handleConvert}>
                {converting ? <Loader2 className="animate-spin" /> : <Repeat data-icon="inline-start" />}
                Convert to Customer
              </Button>
              <Button variant="destructive" disabled={deleting} onClick={handleDelete}>
                {deleting ? <Loader2 className="animate-spin" /> : <Trash2 data-icon="inline-start" />}
                Delete
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <ConfirmDialog />
    </div>
  )
}
