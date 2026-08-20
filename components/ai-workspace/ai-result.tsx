"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Check, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AIOrb, AuroraField, StreamingText } from "@/components/ai/ai-motion"

export function AiResult({
  output,
  loading,
  error,
  loadingLabel = "Generating…",
}: {
  output: string | null
  loading: boolean
  error: string | null
  loadingLabel?: string
}) {
  const [copied, setCopied] = useState(false)
  const [streaming, setStreaming] = useState(false)

  // Reveal word-by-word only for a freshly generated result, so re-renders
  // (copy button, resize) don't replay the whole animation.
  const lastOutputRef = useRef<string | null>(null)
  useEffect(() => {
    if (output && output !== lastOutputRef.current) {
      lastOutputRef.current = output
      setStreaming(true)
    }
  }, [output])

  async function copy() {
    if (!output) return
    await navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative min-h-[160px] overflow-hidden rounded-2xl border border-border bg-card"
      >
        <AuroraField active />
        <div className="relative flex min-h-[160px] flex-col items-center justify-center gap-3">
          <AIOrb size={40} phase="thinking" />
          <motion.span
            className="bg-clip-text text-sm font-medium text-transparent"
            style={{
              backgroundImage:
                "linear-gradient(90deg, var(--muted-foreground) 0%, var(--muted-foreground) 35%, var(--primary) 50%, var(--muted-foreground) 65%, var(--muted-foreground) 100%)",
              backgroundSize: "220% 100%",
            }}
            animate={{ backgroundPositionX: ["180%", "-40%"] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
          >
            {loadingLabel}
          </motion.span>
        </div>
      </motion.div>
    )
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive"
      >
        {error}
      </motion.div>
    )
  }

  if (!output) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 340, damping: 30 }}
        className="relative overflow-hidden rounded-2xl border border-border bg-card"
      >
        <AuroraField active={streaming} />

        <div className="relative flex items-start gap-3 p-5">
          <AIOrb size={28} phase={streaming ? "responding" : "idle"} ripples={streaming} className="mt-0.5 shrink-0" />
          <div className="min-w-0 flex-1 pr-10 text-[14px] leading-relaxed text-foreground">
            <StreamingText text={output} animate={streaming} onDone={() => setStreaming(false)} />
          </div>
        </div>

        <Button
          variant="outline"
          size="icon-sm"
          className="absolute top-4 right-4"
          onClick={copy}
          aria-label="Copy to clipboard"
        >
          {copied ? <Check /> : <Copy />}
        </Button>
      </motion.div>
    </AnimatePresence>
  )
}
