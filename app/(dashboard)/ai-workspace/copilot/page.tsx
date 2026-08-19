'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ArrowUp, Loader2, Sparkles } from 'lucide-react'
import { PageHeader } from '@/components/dashboard/page-header'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupTextarea } from '@/components/ui/input-group'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

const suggestedPrompts = [
  'Show me hot leads with budget above ₹2Cr',
  "Summarize today's sales performance",
  'Draft WhatsApp follow-up for Marina Bay visitors',
  'Which deals are at risk this month?',
]

export default function AiCopilotPage() {
  return (
    <Suspense>
      <AiCopilotPageContent />
    </Suspense>
  )
}

function AiCopilotPageContent() {
  const searchParams = useSearchParams()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const conversationIdRef = useRef<string | undefined>(undefined)
  const autoSentRef = useRef(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  async function send(text: string) {
    const trimmed = text.trim()
    if (!trimmed || sending) return

    setError(null)
    setMessages((prev) => [...prev, { role: 'user', content: trimmed }])
    setInput('')
    setSending(true)

    const supabase = createClient()
    const { data, error: fnError } = await supabase.functions.invoke('ai-copilot', {
      body: { conversation_id: conversationIdRef.current, message: trimmed },
    })

    setSending(false)

    if (fnError || data?.error) {
      setError(data?.error ?? fnError?.message ?? 'Something went wrong. Please try again.')
      return
    }

    conversationIdRef.current = data.conversation_id
    setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }])
  }

  useEffect(() => {
    const initial = searchParams.get('q')
    if (initial && !autoSentRef.current) {
      autoSentRef.current = true
      send(initial)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

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

      <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
          {messages.length === 0 && (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 py-16 text-center">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10">
                <Sparkles className="size-6 text-primary" />
              </div>
              <p className="max-w-xs text-[13px] text-muted-foreground">
                Ask about leads, deals, forecasts, or draft a message.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {suggestedPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => send(prompt)}
                    className="rounded-full border border-border bg-muted/50 px-3 py-1.5 text-[12px] font-medium text-foreground/80 transition-colors hover:bg-muted"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message, i) => (
            <div key={i} className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}>
              <p
                className={cn(
                  'max-w-[80%] rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed whitespace-pre-wrap',
                  message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground',
                )}
              >
                {message.content}
              </p>
            </div>
          ))}

          {sending && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl bg-muted px-4 py-2.5 text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
              </div>
            </div>
          )}

          {error && <p className="text-center text-[13px] text-destructive">{error}</p>}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-border p-4">
          <InputGroup className="h-auto rounded-2xl">
            <InputGroupTextarea
              placeholder="Ask anything…"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                  event.preventDefault()
                  send(input)
                }
              }}
              className="min-h-14 text-[14px]"
            />
            <InputGroupAddon align="block-end" className="justify-end">
              <InputGroupButton
                size="icon-sm"
                className="rounded-full"
                onClick={() => send(input)}
                disabled={sending || !input.trim()}
                aria-label="Send"
              >
                <ArrowUp />
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </div>
      </div>
    </div>
  )
}
