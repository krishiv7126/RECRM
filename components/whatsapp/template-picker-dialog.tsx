'use client'

import { useEffect, useState } from 'react'
import { Loader2, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { getWhatsAppTemplates } from '@/lib/whatsapp/actions'
import { safeCall } from '@/lib/whatsapp/safe-call'
import type { WhatsAppTemplate } from '@/lib/whatsapp/client'
import { cn } from '@/lib/utils'

export interface ChosenTemplate {
  name: string
  language: string
  body: string
  params: string[]
}

export function fillTemplate(body: string, params: string[]) {
  return params.reduce((t, v, i) => t.replace(new RegExp(`\\{\\{\\s*${i + 1}\\s*\\}\\}`, 'g'), v || `{{${i + 1}}}`), body)
}

/**
 * Lists the approved templates on a WhatsApp number and collects values for
 * their {{1}}, {{2}}… placeholders. `conversationId` picks that chat's number;
 * without it the caller's own number is used.
 */
export function TemplatePickerDialog({
  open,
  onOpenChange,
  conversationId,
  description,
  submitLabel = 'Send template',
  paramHint,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  conversationId?: string
  description?: string
  submitLabel?: string
  paramHint?: string
  onSubmit: (template: ChosenTemplate) => Promise<boolean>
}) {
  const [templates, setTemplates] = useState<WhatsAppTemplate[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<WhatsAppTemplate | null>(null)
  const [params, setParams] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setTemplates(null)
    setError(null)
    setSelected(null)
    safeCall(() => getWhatsAppTemplates(conversationId)).then((res) => {
      if (cancelled) return
      if (res.ok) setTemplates(res.templates)
      else setError(res.message)
    })
    return () => {
      cancelled = true
    }
  }, [open, conversationId])

  function pick(t: WhatsAppTemplate) {
    setSelected(t)
    setParams(Array.from({ length: t.paramCount }, () => ''))
  }

  async function handleSubmit() {
    if (!selected) return
    if (params.some((p) => !p.trim())) {
      setError('Fill in every placeholder.')
      return
    }
    setSubmitting(true)
    setError(null)
    const ok = await onSubmit({ name: selected.name, language: selected.language, body: selected.body, params: params.map((p) => p.trim()) })
    setSubmitting(false)
    if (ok) onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Choose a template</DialogTitle>
          <DialogDescription>
            {description ?? 'Only templates approved by Meta can start a conversation or reopen one after 24 hours.'}
          </DialogDescription>
        </DialogHeader>

        {templates === null && !error && (
          <div className="flex justify-center py-8">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {templates && templates.length === 0 && (
          <p className="py-4 text-[13px] text-muted-foreground">
            No approved templates on this number yet. Create one in WhatsApp Manager (business.facebook.com → WhatsApp
            Manager → Message templates) and wait for approval.
          </p>
        )}

        {templates && templates.length > 0 && (
          <div className="flex max-h-56 flex-col gap-1.5 overflow-y-auto">
            {templates.map((t) => (
              <button
                key={`${t.name}:${t.language}`}
                type="button"
                onClick={() => pick(t)}
                className={cn(
                  'rounded-lg border border-border px-3 py-2 text-left transition-colors hover:bg-muted/60',
                  selected?.name === t.name && selected.language === t.language && 'border-primary bg-primary/5',
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-[13px] font-medium text-foreground">{t.name}</span>
                  <span className="shrink-0 text-[11px] uppercase text-muted-foreground">
                    {t.language} · {t.category.toLowerCase()}
                  </span>
                </div>
                <p className="mt-0.5 line-clamp-2 text-[12px] text-muted-foreground">{t.body || 'No body text'}</p>
              </button>
            ))}
          </div>
        )}

        {selected && selected.paramCount > 0 && (
          <div className="flex flex-col gap-2">
            {params.map((value, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-10 shrink-0 text-[12px] font-medium text-muted-foreground">{`{{${i + 1}}}`}</span>
                <Input
                  value={value}
                  placeholder={i === 0 && paramHint ? paramHint : `Value for {{${i + 1}}}`}
                  onChange={(e) => setParams((prev) => prev.map((p, j) => (j === i ? e.target.value : p)))}
                />
              </div>
            ))}
          </div>
        )}

        {selected && (
          <div className="whitespace-pre-wrap rounded-xl bg-emerald-500/10 px-3.5 py-2.5 text-[13px] text-foreground">
            {fillTemplate(selected.body, params) || `Template: ${selected.name}`}
          </div>
        )}

        {error && <p className="text-[12px] text-destructive">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!selected || submitting} onClick={handleSubmit}>
            {submitting ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Send data-icon="inline-start" />}
            {submitLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
