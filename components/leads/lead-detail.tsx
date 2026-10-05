'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowLeftRight, Check, Loader2, Mail, Phone as PhoneIcon, Repeat, Trash2 } from 'lucide-react'
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
import { deriveTemperature, TEMPERATURE_STYLES } from '@/lib/leads/temperature'
import { sanitizeDigits } from '@/lib/sanitize-number-input'
import type { LeadWithOwner } from '@/lib/leads/get-leads-data'
import { CP_SOURCE, LEAD_SOURCES } from '@/lib/leads/cp-source'
import { ChannelPartnerField } from '@/components/leads/channel-partner-field'
import { DuplicatePhoneNotice } from '@/components/leads/duplicate-phone-notice'
import { useDuplicatePhoneCheck } from '@/lib/leads/use-duplicate-phone-check'
import { TransferLeadDialog } from '@/components/leads/transfer-lead-dialog'
import { useRole } from '@/lib/role-context'
import { LEAD_CATEGORIES, LEAD_STAGE_LABELS, SELECTABLE_LEAD_STAGES } from '@/lib/leads/lead-fields'

const stages = SELECTABLE_LEAD_STAGES

export function LeadDetail({ lead }: { lead: LeadWithOwner }) {
  const router = useRouter()
  const [fullName, setFullName] = useState(lead.full_name)
  const [phone, setPhone] = useState(lead.phone ?? '')
  const [email, setEmail] = useState(lead.email ?? '')
  const [source, setSource] = useState(lead.source ?? '')
  const [stage, setStage] = useState(lead.stage)
  const [budget, setBudget] = useState((lead.budget_max ?? lead.budget_min)?.toString() ?? '')
  const [requirement, setRequirement] = useState(lead.requirement ?? '')
  const [category, setCategory] = useState(lead.category ?? '')
  const [city, setCity] = useState(lead.city ?? '')
  const [reference, setReference] = useState(lead.reference ?? '')
  const [channelPartner, setChannelPartner] = useState(lead.channel_partner ?? '')
  const [notes, setNotes] = useState(lead.notes ?? '')

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [converting, setConverting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [liveScore, setLiveScore] = useState(lead.ai_score)
  const { confirm, ConfirmDialog } = useConfirm()
  const role = useRole()
  const canTransfer = role === 'admin' || role === 'super_admin' || role === 'manager'
  const [transferOpen, setTransferOpen] = useState(false)
  // Only re-check when the number is actually being changed.
  const phoneChanged = phone.trim() !== (lead.phone ?? '')
  const { checking: checkingPhone, match: duplicateMatch } = useDuplicatePhoneCheck(phoneChanged ? phone : '', lead.id)

  useEffect(() => {
    if (lead.ai_score !== null) return
    autoScoreLead(lead.id, (score) => setLiveScore(score))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead.id])

  // Keep a legacy source (e.g. "Broker") selectable even though it's no longer in the list.
  const sourceOptions = source && !LEAD_SOURCES.includes(source) ? [...LEAD_SOURCES, source] : LEAD_SOURCES

  async function handleSave() {
    if (source === CP_SOURCE && !channelPartner.trim()) {
      setError('Pick which channel partner (CP) this lead came from.')
      return
    }
    if (duplicateMatch) {
      setError(`This number already belongs to ${duplicateMatch.full_name}. Use a different number or open the existing record.`)
      return
    }
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
        budget_min: budget ? Number(budget) : null,
        budget_max: budget ? Number(budget) : null,
        requirement: requirement.trim() || null,
        category: category || null,
        city: city.trim() || null,
        reference: reference.trim() || null,
        channel_partner: source === CP_SOURCE ? channelPartner.trim() : null,
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
      title: 'Convert to member?',
      description: `Convert ${lead.full_name} to a member? They'll move out of the leads pipeline.`,
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
    toast.success(`${lead.full_name} converted to member`)
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
            {canTransfer && (
              <Button variant="outline" size="sm" onClick={() => setTransferOpen(true)}>
                <ArrowLeftRight data-icon="inline-start" />
                Transfer
              </Button>
            )}
            {liveScore !== null && <Badge className="bg-primary/15 text-primary">AI Score {liveScore}</Badge>}
            {deriveTemperature(liveScore) && (
              <Badge variant="outline" className={`capitalize ${TEMPERATURE_STYLES[deriveTemperature(liveScore)!]}`}>
                {deriveTemperature(liveScore) === 'hot' ? '🔥 ' : ''}
                {deriveTemperature(liveScore)}
              </Badge>
            )}
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
              <DuplicatePhoneNotice checking={checkingPhone} match={duplicateMatch} />
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
              <label className="text-sm font-medium text-foreground">Area</label>
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
                {sourceOptions.map((s) => (
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
                  <option key={s} value={s}>
                    {LEAD_STAGE_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Budget (₹)</label>
              <Input
                type="text"
                inputMode="numeric"
                value={budget}
                onChange={(e) => setBudget(sanitizeDigits(e.target.value))}
              />
            </div>
            {source === CP_SOURCE && <ChannelPartnerField value={channelPartner} onChange={setChannelPartner} />}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Reference</label>
              <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. Referred by Rohan Kapoor" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Segment</label>
              <Input value={requirement} onChange={(e) => setRequirement(e.target.value)} placeholder="e.g. 2 BHK, 3 BHK, Villa, Office" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="lead_category" className="text-sm font-medium text-foreground">Category</label>
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


          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Remarks</label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          {error && <p className="text-[13px] text-destructive">{error}</p>}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button disabled={saving || checkingPhone || !!duplicateMatch} onClick={handleSave}>
              {saving ? <Loader2 className="animate-spin" /> : saved ? <Check data-icon="inline-start" /> : null}
              {saved ? 'Saved' : 'Save changes'}
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="outline" disabled={converting} onClick={handleConvert}>
                {converting ? <Loader2 className="animate-spin" /> : <Repeat data-icon="inline-start" />}
                Convert to Member
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
      <TransferLeadDialog open={transferOpen} onOpenChange={setTransferOpen} lead={lead} />
    </div>
  )
}
