"use client"

import { useState } from "react"
import { Check, Copy, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

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

  async function copy() {
    if (!output) return
    await navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  if (loading) {
    return (
      <div className="flex min-h-[160px] flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-card text-sm text-muted-foreground">
        <Loader2 className="size-5 animate-spin text-primary" />
        {loadingLabel}
      </div>
    )
  }

  if (error) {
    return <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive">{error}</div>
  }

  if (!output) return null

  return (
    <div className="relative rounded-2xl border border-border bg-card p-5">
      <Button
        variant="outline"
        size="icon-sm"
        className="absolute top-4 right-4"
        onClick={copy}
        aria-label="Copy to clipboard"
      >
        {copied ? <Check /> : <Copy />}
      </Button>
      <p className="pr-10 text-[14px] leading-relaxed whitespace-pre-wrap text-foreground">{output}</p>
    </div>
  )
}
