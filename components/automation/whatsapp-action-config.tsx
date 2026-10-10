'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { getWhatsAppTemplatesForSender } from '@/lib/whatsapp/actions'
import { safeCall } from '@/lib/whatsapp/safe-call'
import type { WhatsAppTemplate } from '@/lib/whatsapp/client'

const selectClass =
  'h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'

/**
 * Config for the "Send WhatsApp template" automation action. Stored as
 * { sender_id?, template_name, template_language, params[] }; params may use
 * {{name}} or any {{field}} of the triggering record.
 */
export function WhatsAppActionConfig({
  cfg,
  onChange,
  owners,
}: {
  cfg: Record<string, unknown>
  onChange: (patch: Record<string, unknown>) => void
  owners: { id: string; full_name: string }[]
}) {
  const senderId = (cfg.sender_id as string) || ''
  const templateName = (cfg.template_name as string) ?? ''
  const templateLanguage = (cfg.template_language as string) ?? ''
  const params = (cfg.params as string[]) ?? []

  const [templates, setTemplates] = useState<WhatsAppTemplate[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setTemplates(null)
    setError(null)
    safeCall(() => getWhatsAppTemplatesForSender(senderId || null)).then((res) => {
      if (cancelled) return
      if (res.ok) setTemplates(res.templates)
      else setError(res.message)
    })
    return () => {
      cancelled = true
    }
  }, [senderId])

  const selected = templates?.find((t) => t.name === templateName && t.language === templateLanguage) ?? null

  function pickTemplate(key: string) {
    const t = templates?.find((x) => `${x.name}|${x.language}` === key)
    if (!t) {
      onChange({ template_name: '', template_language: '', params: [] })
      return
    }
    onChange({
      template_name: t.name,
      template_language: t.language,
      params: Array.from({ length: t.paramCount }, (_, i) => params[i] ?? (i === 0 ? '{{name}}' : '')),
    })
  }

  return (
    <div className="grid grid-cols-2 gap-2.5">
      <div className="flex flex-col gap-1.5">
        <label className="text-[12px] font-medium text-foreground/80">Send from</label>
        <select value={senderId} onChange={(e) => onChange({ sender_id: e.target.value || null })} className={selectClass}>
          <option value="">Record owner’s number</option>
          {owners.map((o) => (
            <option key={o.id} value={o.id}>
              {o.full_name}’s number
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[12px] font-medium text-foreground/80">Template</label>
        {templates ? (
          <select
            value={templateName ? `${templateName}|${templateLanguage}` : ''}
            onChange={(e) => pickTemplate(e.target.value)}
            className={selectClass}
          >
            <option value="">Select…</option>
            {templateName && !selected && (
              <option value={`${templateName}|${templateLanguage}`}>
                {templateName} ({templateLanguage})
              </option>
            )}
            {templates.map((t) => (
              <option key={`${t.name}|${t.language}`} value={`${t.name}|${t.language}`}>
                {t.name} ({t.language})
              </option>
            ))}
          </select>
        ) : error ? (
          <Input
            value={templateName}
            onChange={(e) => onChange({ template_name: e.target.value.trim(), template_language: templateLanguage || 'en_US' })}
            placeholder="Template name, e.g. welcome_lead"
          />
        ) : (
          <div className="flex h-8 items-center">
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {params.map((value, idx) => (
        <div key={idx} className="col-span-2 flex items-center gap-2">
          <span className="w-10 shrink-0 text-[12px] font-medium text-muted-foreground">{`{{${idx + 1}}}`}</span>
          <Input
            value={value}
            onChange={(e) => onChange({ params: params.map((p, j) => (j === idx ? e.target.value : p)) })}
            placeholder="e.g. {{name}} or {{city}}"
          />
        </div>
      ))}

      {selected?.body && (
        <p className="col-span-2 whitespace-pre-wrap rounded-lg bg-emerald-500/10 px-3 py-2 text-[12px] text-foreground">
          {selected.body}
        </p>
      )}

      <p className="col-span-2 text-[11px] text-muted-foreground">
        {error && !templates ? `${error} You can still type a template name. ` : ''}
        Sent within a minute from that person’s connected WhatsApp number, 1 credit each. The template must be approved on
        the sending number’s WhatsApp account. Use {'{{name}}'} or any {'{{field}}'} of the record in placeholders.
      </p>
    </div>
  )
}
