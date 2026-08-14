'use client'

import { useState } from 'react'
import { PhoneCall } from 'lucide-react'
import { PageHeader } from '@/components/dashboard/page-header'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { AiResult } from '@/components/ai-workspace/ai-result'
import { useAiGenerate } from '@/lib/ai-workspace/use-ai-generate'

export default function CallSummaryPage() {
  const [transcript, setTranscript] = useState('')
  const { output, loading, error, generate } = useAiGenerate()

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

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
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
        <div>
          <Button
            disabled={!transcript.trim() || loading}
            onClick={() => generate({ type: 'call_summary', extra_instructions: transcript })}
          >
            <PhoneCall data-icon="inline-start" />
            Summarize Call
          </Button>
        </div>
      </div>

      <AiResult output={output} loading={loading} error={error} loadingLabel="Analyzing the call…" />
    </div>
  )
}
