'use client'

import { LineChart } from 'lucide-react'
import { PageHeader } from '@/components/dashboard/page-header'
import { AiResult } from '@/components/ai-workspace/ai-result'
import { AiGenerateButton, AiToolCard } from '@/components/ai-workspace/ai-tool-card'
import { useAiGenerate } from '@/lib/ai-workspace/use-ai-generate'
import { RevenueForecastView } from '@/components/ai-workspace/revenue-forecast-view'

export default function RevenueForecastPage() {
  const { output, loading, error, generate } = useAiGenerate()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        crumbs={[
          { label: 'Intelligence' },
          { label: 'AI Workspace', href: '/ai-workspace' },
          { label: 'AI Revenue Forecast' },
        ]}
        title="AI Revenue Forecast"
        description="Booked revenue and a weighted pipeline forecast — monthly, quarterly, yearly or in total."
      />

      <RevenueForecastView />

      <AiToolCard
        phase={loading ? 'thinking' : 'idle'}
        title={loading ? 'Crunching the pipeline…' : "Today's daily brief"}
        subtitle={
          loading
            ? 'Scanning hot leads, active deals, and scheduled visits.'
            : 'Generate a live snapshot of where your pipeline stands right now.'
        }
      >
        <div>
          <AiGenerateButton
            loading={loading}
            onClick={() => generate({ type: 'daily_brief' })}
            icon={LineChart}
            label="Generate Daily Brief"
            loadingLabel="Crunching…"
          />
        </div>
      </AiToolCard>

      <AiResult output={output} loading={loading} error={error} loadingLabel="Crunching the pipeline…" />
    </div>
  )
}
