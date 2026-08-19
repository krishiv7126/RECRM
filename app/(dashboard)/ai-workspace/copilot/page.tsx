'use client'

import { Suspense, useCallback, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { PageHeader } from '@/components/dashboard/page-header'
import AICopilot, { type CopilotMessage } from '@/components/ai-copilot'
import { createClient } from '@/lib/supabase/client'

export default function AiCopilotPage() {
  return (
    <Suspense>
      <AiCopilotPageContent />
    </Suspense>
  )
}

function AiCopilotPageContent() {
  const searchParams = useSearchParams()
  const conversationIdRef = useRef<string | undefined>(undefined)

  // AICopilot owns the transcript and its own error UI; this only has to make
  // the call and hand back the reply text. Throwing here is what tells the
  // component to render its error bubble.
  const handleSend = useCallback(async (prompt: string, _history: CopilotMessage[]) => {
    const supabase = createClient()
    const { data, error } = await supabase.functions.invoke('ai-copilot', {
      body: { conversation_id: conversationIdRef.current, message: prompt },
    })

    if (error || data?.error) {
      throw new Error(data?.error ?? error?.message ?? 'Request failed')
    }

    conversationIdRef.current = data.conversation_id
    return data.reply as string
  }, [])

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col gap-6">
      <PageHeader
        crumbs={[
          { label: 'Intelligence' },
          { label: 'AI Workspace', href: '/ai-workspace' },
          { label: 'AI Copilot' },
        ]}
        title="AI Copilot"
        description="Ask questions and get instant answers about your leads, deals, and portfolio."
      />

      <AICopilot onSendMessage={handleSend} autoSendPrompt={searchParams.get('q') ?? undefined} />
    </div>
  )
}
