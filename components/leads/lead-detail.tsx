'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Check, Loader2, Repeat, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/dashboard/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import type { LeadWithOwner } from '@/lib/leads/get-leads-data'

const sources = ['Website', 'Referral', 'Meta Ads', 'Google', '99acres', 'Walk-in', 'Other']
const stages = ['new', 'contacted', 'qualified', 'proposal', 'site_visit', 'won', 'lost', 'archive'] as const
const temperatures = ['hot', 'warm', 'cold'] as const

export function LeadDetail({ lead }: { lead: LeadWithOwner }) {
  const router = useRouter()
  const [fullName, setFullName] = useState(lead.full_name)
  const [phone, setPhone] = useState(lead.phone ?? '')
  const [email, setEmail] = useState(lead.email ?? '')
  const [source, setSource] = useState(lead.source ?? '')
  const [stage, setStage] = useState(lead.stage)
  const [temperature, setTemperature] = useState(lead.temperature)
  const [budgetMin, setBudgetMin] = useState(lead.budget_min?.toString() ?? '')
  const [budgetMax, setBudgetMax] = useState(lead.budget_max?.toString() ?? '')
  const [requirement, setRequirement] = useState(lead.requirement ?? '')

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [converting, setConverting] = useState(false)
  const [deleting, setDeleting] = useState(false)

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
        temperature,
        budget_min: budgetMin ? Number(budgetMin) : null,
        budget_max: budgetMax ? Number(budgetMax) : null,
        requirement: requirement.trim() || null,
      })
      .eq('id', lead.id)
    setSaving(false)
    if (updateErr) {
      setError(updateErr.message)
      return
    }
    setSaved(true)
    router.refresh()
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleConvert() {
    if (!window.confirm(`Convert ${lead.full_name} to a customer?`)) return
    setConverting(true)
    const supabase = createClient()
    const { error: convertErr } = await supabase.rpc('fn_convert_lead_to_customer', { p_lead_id: lead.id })
    setConverting(false)
    if (convertErr) {
      setError(convertErr.message)
      return
    }
    router.push('/customers')
  }

  async function handleDelete() {
    if (!window.confirm(`Delete ${lead.full_name}? This cannot be undone.`)) return
    setDeleting(true)
    const supabase = createClient()
    const { error: deleteErr } = await supabase.from('leads').delete().eq('id', lead.id)
    setDeleting(false)
    if (deleteErr) {
      setError(deleteErr.message)
      return
    }
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
            {lead.ai_score !== null && <Badge className="bg-primary/15 text-primary">AI Score {lead.ai_score}</Badge>}
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
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Email</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
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
              <label className="text-sm font-medium text-foreground">Temperature</label>
              <select
                value={temperature}
                onChange={(e) => setTemperature(e.target.value as typeof temperature)}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm capitalize outline-none dark:bg-input/30"
              >
                {temperatures.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Budget min (₹)</label>
              <Input type="number" value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Budget max (₹)</label>
              <Input type="number" value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Requirement</label>
            <Textarea value={requirement} onChange={(e) => setRequirement(e.target.value)} />
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
    </div>
  )
}
