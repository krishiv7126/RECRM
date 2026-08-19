'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUp, Sparkles } from 'lucide-react'
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

function AiOrb({ size = 'size-12', iconSize = 'size-6' }: { size?: string; iconSize?: string }) {
  return (
    <div className={cn('relative flex shrink-0 items-center justify-center', size)}>
      <div className="ai-conic-glow animate-ai-spin absolute inset-[-60%] rounded-full opacity-70 blur-md" />
      <div className="animate-ai-pulse absolute inset-0 rounded-full bg-primary/20 blur-sm" />
      <div className="relative flex size-full items-center justify-center rounded-full bg-card ring-1 ring-border">
        <Sparkles className={cn(iconSize, 'text-primary')} />
      </div>
    </div>
  )
}

function ThinkingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      className="flex items-center gap-3"
    >
      <AiOrb size="size-7" iconSize="size-3.5" />
      <div className="flex items-center gap-2 rounded-2xl bg-muted px-4 py-2.5">
        <span className="ai-shimmer-text text-[13px] font-medium">Thinking</span>
        <div className="flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="size-1.5 rounded-full bg-primary"
              animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  )
}

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
  const [focused, setFocused] = useState(false)
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

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative flex flex-1 overflow-hidden rounded-2xl p-px"
      >
        <div className="ai-conic-glow animate-ai-spin absolute inset-[-100%] opacity-30" />

        <div className="relative flex flex-1 flex-col overflow-hidden rounded-[15px] bg-card">
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="flex flex-1 flex-col items-center justify-center gap-4 py-16 text-center"
              >
                <AiOrb />
                <p className="max-w-xs text-[13px] text-muted-foreground">
                  Ask about leads, deals, forecasts, or draft a message.
                </p>
                <motion.div
                  className="flex flex-wrap justify-center gap-2"
                  initial="hidden"
                  animate="show"
                  variants={{
                    hidden: {},
                    show: { transition: { staggerChildren: 0.06, delayChildren: 0.15 } },
                  }}
                >
                  {suggestedPrompts.map((prompt) => (
                    <motion.button
                      key={prompt}
                      type="button"
                      onClick={() => send(prompt)}
                      variants={{
                        hidden: { opacity: 0, y: 8 },
                        show: { opacity: 1, y: 0 },
                      }}
                      whileHover={{ scale: 1.04, y: -1 }}
                      whileTap={{ scale: 0.97 }}
                      className="rounded-full border border-border bg-muted/50 px-3 py-1.5 text-[12px] font-medium text-foreground/80 transition-colors hover:border-primary/40 hover:bg-muted hover:text-foreground"
                    >
                      {prompt}
                    </motion.button>
                  ))}
                </motion.div>
              </motion.div>
            )}

            <AnimatePresence initial={false}>
              {messages.map((message, i) => (
                <motion.div
                  key={i}
                  layout
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}
                >
                  {message.role === 'assistant' && (
                    <div className="mr-2 mt-0.5">
                      <AiOrb size="size-7" iconSize="size-3.5" />
                    </div>
                  )}
                  <p
                    className={cn(
                      'max-w-[80%] rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed whitespace-pre-wrap',
                      message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground',
                    )}
                  >
                    {message.content}
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>

            <AnimatePresence>{sending && <ThinkingIndicator />}</AnimatePresence>

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-[13px] text-destructive"
              >
                {error}
              </motion.p>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-border p-4">
            <div className="relative rounded-2xl">
              <div
                className={cn(
                  'ai-conic-glow animate-ai-spin absolute -inset-1 rounded-2xl opacity-0 blur-md transition-opacity duration-500',
                  focused && 'opacity-50',
                )}
              />
              <InputGroup className="relative h-auto rounded-2xl bg-card">
                <InputGroupTextarea
                  placeholder="Ask anything…"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                      event.preventDefault()
                      send(input)
                    }
                  }}
                  className="min-h-14 text-[14px]"
                />
                <InputGroupAddon align="block-end" className="justify-end">
                  <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}>
                    <InputGroupButton
                      size="icon-sm"
                      className="rounded-full"
                      onClick={() => send(input)}
                      disabled={sending || !input.trim()}
                      aria-label="Send"
                    >
                      <ArrowUp />
                    </InputGroupButton>
                  </motion.div>
                </InputGroupAddon>
              </InputGroup>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
