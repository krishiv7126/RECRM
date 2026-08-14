'use client'

import { LineChart } from 'lucide-react'
import { PageHeader } from '@/components/dashboard/page-header'
import { Button } from '@/components/ui/button'
import { AiResult } from '@/components/ai-workspace/ai-result'
import { useAiGenerate } from '@/lib/ai-workspace/use-ai-generate'

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
        description="Full pipeline-based forecasting is coming soon. For now, generate today's AI daily brief — hot leads, top active deals, and today's visits."
      />

      <div className="rounded-2xl border border-border bg-card p-5">
        <Button disabled={loading} onClick={() => generate({ type: 'daily_brief' })}>
          <LineChart data-icon="inline-start" />
          Generate Daily Brief
        </Button>
      </div>

      <AiResult output={output} loading={loading} error={error} loadingLabel="Crunching the pipeline…" />
    </div>
  )
}
