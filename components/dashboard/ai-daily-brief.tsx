import { ArrowRight, Flame, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCr } from '@/lib/dashboard-metrics'

interface Props {
  topHotLead: { full_name: string; ai_score: number | null } | null
  biggestActiveDeal: { title: string } | null
  hotLeadsCount: number
  activePipelineValue: number
}

export function AiDailyBrief({ topHotLead, biggestActiveDeal, hotLeadsCount, activePipelineValue }: Props) {
  return (
    <div className="relative isolate overflow-hidden rounded-2xl bg-gradient-to-br from-foreground via-foreground to-primary p-6 sm:p-7">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-primary/40 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-28 left-10 size-64 rounded-full bg-white/10 blur-3xl"
      />

      <div className="relative flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-white/15">
              <Sparkles className="size-4 text-white" />
            </div>
            <span className="font-heading text-sm font-bold text-white">AI Daily Brief</span>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold text-white">
            <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
            Live
          </span>
        </div>

        <p className="max-w-2xl text-[15px] leading-relaxed text-white/90 text-pretty sm:text-base">
          {topHotLead ? (
            <>
              <span className="inline-flex items-center gap-1 font-semibold text-white">
                <Flame className="size-4 text-orange-300" />
                {topHotLead.full_name}
              </span>{' '}
              is scoring {topHotLead.ai_score ?? '—'}/100 and ready for a proposal
              {biggestActiveDeal && (
                <>
                  , while the <span className="font-semibold text-white">{biggestActiveDeal.title}</span> deal
                  remains your largest live opportunity
                </>
              )}
              . Across the portfolio, {hotLeadsCount} hot lead{hotLeadsCount === 1 ? '' : 's'} are driving{' '}
              {formatCr(activePipelineValue)} in active pipeline this week.
            </>
          ) : (
            <>No hot leads yet — {formatCr(activePipelineValue)} is currently active across your pipeline.</>
          )}
        </p>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button className="rounded-full bg-white text-foreground hover:bg-white/90">
            Open AI Planner
            <ArrowRight data-icon="inline-end" />
          </Button>
          <Button variant="ghost" className="rounded-full text-white hover:bg-white/15 hover:text-white">
            See hot leads
            <ArrowRight data-icon="inline-end" />
          </Button>
        </div>
      </div>
    </div>
  )
}
