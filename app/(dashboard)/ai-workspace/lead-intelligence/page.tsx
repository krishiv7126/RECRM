'use client'

import { useEffect, useState } from 'react'
import { Loader2, Sparkles, UserSearch } from 'lucide-react'
import { PageHeader } from '@/components/dashboard/page-header'
import { PlaceholderSection } from '@/components/dashboard/placeholder-section'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'

type LeadStage = Database['public']['Enums']['lead_stage']
type LeadTemperature = Database['public']['Enums']['lead_temperature']

interface LeadRow {
  id: string
  full_name: string
  requirement: string | null
  budget_min: number | null
  budget_max: number | null
  stage: LeadStage
  temperature: LeadTemperature
  ai_score: number | null
}

const stageLabels: Record<LeadStage, string> = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  proposal: 'Proposal',
  site_visit: 'Site Visit',
  won: 'Won',
  lost: 'Lost',
  archive: 'Archived',
}

const stageStyles: Record<LeadStage, string> = {
  new: 'bg-muted text-muted-foreground',
  contacted: 'bg-accent text-accent-foreground',
  qualified: 'bg-secondary text-secondary-foreground',
  proposal: 'bg-primary/15 text-primary',
  site_visit: 'border border-primary/40 bg-transparent text-primary',
  won: 'bg-success/15 text-success',
  lost: 'bg-destructive/10 text-destructive',
  archive: 'bg-muted text-muted-foreground',
}

const temperatureStyles: Record<LeadTemperature, string> = {
  hot: 'border-destructive/30 bg-destructive/10 text-destructive',
  warm: 'border-primary/30 bg-primary/10 text-primary',
  cold: 'border-border bg-muted text-muted-foreground',
}

function formatCr(amount: number) {
  return amount >= 10000000 ? `₹${(amount / 10000000).toFixed(1)}Cr` : `₹${Math.round(amount / 100000)}L`
}

function formatBudgetRange(min: number | null, max: number | null) {
  if (!min && !max) return '—'
  if (min && max) return `${formatCr(min)} – ${formatCr(max)}`
  return formatCr(min ?? max ?? 0)
}

export default function LeadIntelligencePage() {
  const [leads, setLeads] = useState<LeadRow[]>([])
  const [loading, setLoading] = useState(true)
  const [scoringId, setScoringId] = useState<string | null>(null)
  const [reasoning, setReasoning] = useState<Record<string, string>>({})
  const [rowError, setRowError] = useState<Record<string, string>>({})

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('leads')
      .select('id, full_name, requirement, budget_min, budget_max, stage, temperature, ai_score')
      .not('stage', 'in', '(won,lost,archive)')
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setLeads(data ?? [])
        setLoading(false)
      })
  }, [])

  async function scoreLead(leadId: string) {
    setScoringId(leadId)
    setRowError((prev) => ({ ...prev, [leadId]: '' }))

    const supabase = createClient()
    const { data, error } = await supabase.functions.invoke('ai-workspace', {
      body: { type: 'lead_score', lead_id: leadId },
    })

    setScoringId(null)

    if (error || data?.error) {
      setRowError((prev) => ({ ...prev, [leadId]: data?.error ?? 'Scoring failed. Try again.' }))
      return
    }

    const output = data.output as string
    const scoreMatch = output.match(/\d{1,3}/)
    const score = scoreMatch ? Math.min(100, Number.parseInt(scoreMatch[0], 10)) : null

    setLeads((prev) => prev.map((lead) => (lead.id === leadId ? { ...lead, ai_score: score ?? lead.ai_score } : lead)))
    setReasoning((prev) => ({ ...prev, [leadId]: output }))
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        crumbs={[
          { label: 'Intelligence' },
          { label: 'AI Workspace', href: '/ai-workspace' },
          { label: 'AI Lead Intelligence' },
        ]}
        title="AI Lead Intelligence"
        description="Auto-score open leads by intent, urgency, and closing probability."
      />

      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-border bg-card">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      ) : leads.length === 0 ? (
        <PlaceholderSection icon={UserSearch} title="No open leads" description="Leads you add will show up here for AI scoring." />
      ) : (
        <div className="flex flex-col gap-3">
          {leads.map((lead) => (
            <div key={lead.id} className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-heading text-[15px] font-bold text-foreground">{lead.full_name}</p>
                    <Badge className={`rounded-full border-0 ${stageStyles[lead.stage]}`}>{stageLabels[lead.stage]}</Badge>
                    <Badge variant="outline" className={`rounded-full ${temperatureStyles[lead.temperature]}`}>
                      {lead.temperature}
                    </Badge>
                  </div>
                  <p className="text-[13px] text-muted-foreground">
                    {lead.requirement ?? 'No requirement noted'} · {formatBudgetRange(lead.budget_min, lead.budget_max)}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-end">
                    <p className="font-heading text-xl font-extrabold text-foreground">
                      {lead.ai_score ?? '—'}
                      {lead.ai_score !== null && <span className="text-xs font-medium text-muted-foreground">/100</span>}
                    </p>
                    <p className="text-[11px] text-muted-foreground">AI score</p>
                  </div>
                  <Button variant="outline" size="sm" disabled={scoringId === lead.id} onClick={() => scoreLead(lead.id)}>
                    {scoringId === lead.id ? <Loader2 className="animate-spin" /> : <Sparkles data-icon="inline-start" />}
                    Score with AI
                  </Button>
                </div>
              </div>

              {rowError[lead.id] && <p className="text-[13px] text-destructive">{rowError[lead.id]}</p>}
              {reasoning[lead.id] && (
                <p className="rounded-lg bg-muted/60 px-3 py-2 text-[13px] leading-relaxed text-foreground/80">
                  {reasoning[lead.id]}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
