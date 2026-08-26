'use client'

import { useState } from 'react'
import { PhoneCall } from 'lucide-react'
import { PageHeader } from '@/components/dashboard/page-header'
import { Textarea } from '@/components/ui/textarea'
import { AiResult } from '@/components/ai-workspace/ai-result'
import { AiGenerateButton, AiToolCard } from '@/components/ai-workspace/ai-tool-card'
import { useAiGenerate } from '@/lib/ai-workspace/use-ai-generate'

export default function CallSummaryPage() {
  const [transcript, setTranscript] = useState('')
  const { output, loading, error, generate } = useAiGenerate()
  const ready = transcript.trim().length > 0

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        crumbs={[
          { label: 'Intelligence' },
          { label: 'AI Workspace', href: '/ai-workspace' },
          { label: 'AI Call Summary' },
        ]}
        title="AI Call Summary"
        description="Paste a call transcript or notes to get a summary, sentiment, objections, and next action."
      />

      <AiToolCard
        phase={loading ? 'thinking' : ready ? 'listening' : 'idle'}
        title={loading ? 'Analyzing the call…' : 'Summarize a call'}
        subtitle={
          loading
            ? 'Pulling out sentiment, objections, and the next action.'
            : 'Paste the transcript or your notes and let AI break it down.'
        }
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor="transcript" className="text-sm font-medium text-foreground">
            Call transcript or notes
          </label>
          <Textarea
            id="transcript"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Paste the call transcript or your notes here…"
            className="min-h-40"
          />
        </div>

        <div>
          <AiGenerateButton
            loading={loading}
            disabled={!ready}
            onClick={() => generate({ type: 'call_summary', extra_instructions: transcript })}
            icon={PhoneCall}
            label="Summarize Call"
            loadingLabel="Summarizing…"
          />
        </div>
      </AiToolCard>

      <AiResult output={output} loading={loading} error={error} loadingLabel="Analyzing the call…" />
    </div>
  )
}
