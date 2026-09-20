'use client'

import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/dashboard/page-header'
import AICopilot, { type CopilotMessage } from '@/components/ai-copilot'
import { createClient } from '@/lib/supabase/client'

// How long a conversation stays resumable after its last message. Older
// conversations still exist in the DB, they just no longer auto-load --
// leaving the chat page starts a fresh thread instead.
const RESUME_WINDOW_MS = 24 * 60 * 60 * 1000

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
  // null = still loading any resumable conversation; AICopilot only reads
  // initialMessages once on mount, so it must not render until this resolves.
  const [initialMessages, setInitialMessages] = useState<CopilotMessage[] | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadRecentConversation() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user || cancelled) return setInitialMessages([])

      const { data: me } = await supabase.from('platform_users').select('id').eq('auth_user_id', user.id).single()
      if (!me || cancelled) return setInitialMessages([])

      const since = new Date(Date.now() - RESUME_WINDOW_MS).toISOString()
      const { data: convo } = await supabase
        .from('ai_conversations')
        .select('id')
        .eq('owner_id', me.id)
        .eq('context_type', 'general')
        .gte('updated_at', since)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!convo || cancelled) return setInitialMessages([])
      conversationIdRef.current = convo.id

      const { data: msgs } = await supabase
        .from('ai_messages')
        .select('id, role, content')
        .eq('ai_conversation_id', convo.id)
        .in('role', ['user', 'assistant'])
        .order('created_at', { ascending: true })
      if (cancelled) return

      setInitialMessages((msgs ?? []) as CopilotMessage[])
    }

    loadRecentConversation()
    return () => {
      cancelled = true
    }
  }, [])

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

      {initialMessages === null ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <AICopilot
          key={conversationIdRef.current ?? 'new'}
          onSendMessage={handleSend}
          autoSendPrompt={searchParams.get('q') ?? undefined}
          initialMessages={initialMessages}
        />
      )}
    </div>
  )
}
