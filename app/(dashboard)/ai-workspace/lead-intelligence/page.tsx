'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Sparkles, UserSearch } from 'lucide-react'
import { PageHeader } from '@/components/dashboard/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AIOrb, AuroraField, StreamingText, type Phase } from '@/components/ai/ai-motion'
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

/** Score dial: a ring that fills to the score, with the number counting up. */
function ScoreDial({ score, scoring }: { score: number | null; scoring: boolean }) {
  const reduce = useReducedMotion()
  const [shown, setShown] = useState(score ?? 0)

  useEffect(() => {
    if (score === null) return
    if (reduce) {
      setShown(score)
      return
    }
    // Count up from whatever is currently displayed to the new score.
    const from = shown
    const start = performance.now()
    const duration = 900
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setShown(Math.round(from + (score - from) * eased))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score, reduce])

  const pct = score === null ? 0 : shown / 100
  const r = 22
  const circumference = 2 * Math.PI * r

  return (
    <div className="relative flex size-14 shrink-0 items-center justify-center">
      <svg viewBox="0 0 56 56" className="absolute inset-0 -rotate-90">
        <circle cx="28" cy="28" r={r} fill="none" stroke="var(--border)" strokeWidth="4" />
        <motion.circle
          cx="28"
          cy="28"
          r={r}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset: circumference * (1 - pct) }}
          transition={{ duration: reduce ? 0 : 0.9, ease: 'easeOut' }}
        />
      </svg>

      {/* Pulsing halo while the model is scoring this row. */}
      {scoring && !reduce && (
        <motion.span
          className="absolute inset-0 rounded-full bg-primary/25 blur-md"
          animate={{ scale: [0.9, 1.15, 0.9], opacity: [0.4, 0.75, 0.4] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          aria-hidden="true"
        />
      )}

      <div className="relative flex flex-col items-center leading-none">
        {score === null ? (
          <span className="font-heading text-base font-extrabold text-muted-foreground">—</span>
        ) : (
          <span className="font-heading text-base font-extrabold text-foreground">{shown}</span>
        )}
      </div>
    </div>
  )
}

export default function LeadIntelligencePage() {
  const [leads, setLeads] = useState<LeadRow[]>([])
  const [loading, setLoading] = useState(true)
  const [scoringId, setScoringId] = useState<string | null>(null)
  const [reasoning, setReasoning] = useState<Record<string, string>>({})
  const [streamingId, setStreamingId] = useState<string | null>(null)
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
    setStreamingId(leadId)
  }

  // Drives the header orb + ambient intensity, same states as the Copilot.
  const phase: Phase = scoringId ? 'thinking' : streamingId ? 'responding' : 'idle'

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

      <div className="relative overflow-hidden rounded-2xl border border-border bg-card">
        <AuroraField active={phase !== 'idle'} />

        <div className="relative flex flex-col gap-4 p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <AIOrb size={36} phase={phase} ripples={phase === 'responding'} />
            <div className="flex flex-col leading-tight">
              <p className="font-heading text-sm font-bold text-foreground">
                {scoringId ? 'Scoring lead…' : `${leads.length} open lead${leads.length === 1 ? '' : 's'}`}
              </p>
              <p className="text-[12px] text-muted-foreground">
                {scoringId ? 'Weighing intent, urgency, and budget fit.' : 'Run AI scoring on any lead below.'}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-[240px] flex-col items-center justify-center gap-3">
              <AIOrb size={44} phase="thinking" />
              <p className="text-[13px] text-muted-foreground">Loading your open leads…</p>
            </div>
          ) : leads.length === 0 ? (
            <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 text-center">
              <UserSearch className="size-7 text-muted-foreground/60" />
              <p className="font-heading text-sm font-bold text-foreground">No open leads</p>
              <p className="max-w-xs text-[13px] text-muted-foreground">
                Leads you add will show up here for AI scoring.
              </p>
            </div>
          ) : (
            <motion.div
              className="flex flex-col gap-3"
              initial="hidden"
              animate="show"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
            >
              {leads.map((lead) => {
                const isScoring = scoringId === lead.id
                return (
                  <motion.div
                    key={lead.id}
                    variants={{
                      hidden: { opacity: 0, y: 12 },
                      show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 380, damping: 30 } },
                    }}
                    whileHover={{ y: -2 }}
                    className="relative flex flex-col gap-3 overflow-hidden rounded-xl border border-border bg-background/60 p-4 shadow-sm transition-shadow hover:shadow-md"
                  >
                    {/* sheen sweeping across the row while it is being scored */}
                    {isScoring && (
                      <motion.span
                        className="pointer-events-none absolute inset-y-0 w-1/3"
                        style={{
                          background:
                            'linear-gradient(100deg, transparent, color-mix(in oklch, var(--primary) 18%, transparent), transparent)',
                        }}
                        initial={{ x: '-140%' }}
                        animate={{ x: '360%' }}
                        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                        aria-hidden="true"
                      />
                    )}

                    <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-col gap-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-heading text-[15px] font-bold text-foreground">{lead.full_name}</p>
                          <Badge className={`rounded-full border-0 ${stageStyles[lead.stage]}`}>
                            {stageLabels[lead.stage]}
                          </Badge>
                          <Badge variant="outline" className={`rounded-full ${temperatureStyles[lead.temperature]}`}>
                            {lead.temperature}
                          </Badge>
                        </div>
                        <p className="text-[13px] text-muted-foreground">
                          {lead.requirement ?? 'No requirement noted'} ·{' '}
                          {formatBudgetRange(lead.budget_min, lead.budget_max)}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <ScoreDial score={lead.ai_score} scoring={isScoring} />
                          <p className="text-[11px] text-muted-foreground">AI score</p>
                        </div>
                        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                          <Button variant="outline" size="sm" disabled={isScoring} onClick={() => scoreLead(lead.id)}>
                            {isScoring ? (
                              <AIOrb size={16} phase="thinking" className="mr-1.5" />
                            ) : (
                              <Sparkles data-icon="inline-start" />
                            )}
                            {isScoring ? 'Scoring…' : 'Score with AI'}
                          </Button>
                        </motion.div>
                      </div>
                    </div>

                    {rowError[lead.id] && (
                      <p className="relative text-[13px] text-destructive">{rowError[lead.id]}</p>
                    )}

                    <AnimatePresence>
                      {reasoning[lead.id] && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.35, ease: 'easeOut' }}
                          className="relative overflow-hidden"
                        >
                          <div className="flex items-start gap-2.5 rounded-lg bg-muted/60 px-3 py-2.5 text-[13px] leading-relaxed text-foreground/80">
                            <AIOrb
                              size={22}
                              phase={streamingId === lead.id ? 'responding' : 'idle'}
                              className="mt-0.5 shrink-0"
                            />
                            <StreamingText
                              text={reasoning[lead.id]}
                              animate={streamingId === lead.id}
                              onDone={() => setStreamingId((cur) => (cur === lead.id ? null : cur))}
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
