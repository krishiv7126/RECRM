'use client'

import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AIOrb, AuroraField, type Phase } from '@/components/ai/ai-motion'

/**
 * Shared shell for the AI Workspace tool inputs, so every generator page
 * (email, proposal, call summary, customer summary, forecast) animates the
 * same way rather than each repeating the aurora + orb header markup.
 */
export function AiToolCard({
  phase,
  title,
  subtitle,
  children,
}: {
  phase: Phase
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card">
      <AuroraField active={phase !== 'idle'} />

      <div className="relative flex flex-col gap-4 p-5">
        <div className="flex items-center gap-3">
          <AIOrb size={32} phase={phase} />
          <div className="flex flex-col leading-tight">
            <p className="font-heading text-sm font-bold text-foreground">{title}</p>
            <p className="text-[12px] text-muted-foreground">{subtitle}</p>
          </div>
        </div>

        {children}
      </div>
    </div>
  )
}

export function AiGenerateButton({
  loading,
  disabled,
  onClick,
  icon: Icon,
  label,
  loadingLabel = 'Generating…',
}: {
  loading: boolean
  disabled?: boolean
  onClick: () => void
  icon: LucideIcon
  label: string
  loadingLabel?: string
}) {
  return (
    <motion.div className="inline-block" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
      <Button disabled={disabled || loading} onClick={onClick}>
        {loading ? <AIOrb size={16} phase="thinking" className="mr-1.5" /> : <Icon data-icon="inline-start" />}
        {loading ? loadingLabel : label}
      </Button>
    </motion.div>
  )
}
