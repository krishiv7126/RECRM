'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  BarChart3,
  Building2,
  Check,
  Handshake,
  Inbox,
  LayoutDashboard,
  PhoneCall,
  ShieldCheck,
  Sparkles,
  Users,
  Workflow,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AIOrb, AuroraField } from '@/components/ai/ai-motion'
import { createClient } from '@/lib/supabase/client'
import type { Role } from '@/lib/nav-config'

interface TourStep {
  icon: LucideIcon
  title: string
  body: string
  /** Roles that see this step. Omitted means everyone. */
  roles?: Role[]
}

const STEPS: TourStep[] = [
  {
    icon: LayoutDashboard,
    title: 'Your dashboard',
    body: 'Every morning starts here — live pipeline value, active deals, revenue this month, and today’s site visits at a glance.',
  },
  {
    icon: Users,
    title: 'Leads & customers',
    body: 'Capture every enquiry, track it from New to Qualified, and convert won leads into customers without re-typing anything.',
  },
  {
    icon: Handshake,
    title: 'Deals pipeline',
    body: 'A drag-and-drop board for your whole pipeline. Move a deal between stages and it saves instantly.',
  },
  {
    icon: PhoneCall,
    title: 'Follow-ups',
    body: 'Schedule calls, WhatsApps, emails and meetings so nothing slips. Overdue items are flagged automatically.',
  },
  {
    icon: Building2,
    title: 'Properties & projects',
    body: 'Your inventory — list properties, group them under projects, and record site visits against each one.',
  },
  {
    icon: Sparkles,
    title: 'AI Workspace',
    body: 'Ask the Copilot anything about your data, score leads by intent, and generate emails, proposals and summaries in seconds.',
  },
  {
    icon: Workflow,
    title: 'Automation',
    body: 'Set rules once — "when a lead turns hot, create a follow-up" — and let the ERP do the repetitive work.',
    roles: ['super_admin', 'admin', 'manager'],
  },
  {
    icon: BarChart3,
    title: 'Analytics',
    body: 'See what’s actually working: conversion by stage, lead sources, and revenue trends over any date range.',
    roles: ['super_admin', 'admin', 'manager'],
  },
  {
    icon: Inbox,
    title: 'Team inbox',
    body: 'Message your team in real time without leaving the ERP — direct messages and group chats.',
  },
  {
    icon: ShieldCheck,
    title: 'Approvals',
    body: 'Every sign-in from a new device needs your approval, so you always know who is in the system.',
    roles: ['super_admin', 'admin'],
  },
]

export function OnboardingTour({ role, platformUserId }: { role: Role; platformUserId: string }) {
  const steps = STEPS.filter((s) => !s.roles || s.roles.includes(role))
  const [index, setIndex] = useState(0)
  const [open, setOpen] = useState(true)
  const [saving, setSaving] = useState(false)

  const step = steps[index]
  const isLast = index === steps.length - 1

  // Marking it done is fire-and-forget: if the write fails the user still gets
  // on with their work, and the worst case is seeing the tour once more.
  async function finish() {
    setSaving(true)
    setOpen(false)
    const supabase = createClient()
    await supabase
      .from('platform_users')
      .update({ onboarding_completed_at: new Date().toISOString() })
      .eq('id', platformUserId)
  }

  if (!open) return null

  const Icon = step.icon

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" aria-hidden="true" />

        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="tour-title"
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-xl"
        >
          <AuroraField active />

          <div className="relative flex flex-col gap-5 p-6">
            <div className="flex items-center justify-between">
              <AIOrb size={34} phase="idle" />
              <button
                type="button"
                onClick={finish}
                disabled={saving}
                className="text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Skip tour
              </button>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="flex flex-col gap-2.5"
              >
                <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10">
                  <Icon className="size-5 text-primary" />
                </div>
                <h2 id="tour-title" className="font-heading text-lg font-bold text-foreground">
                  {step.title}
                </h2>
                <p className="text-[14px] leading-relaxed text-muted-foreground">{step.body}</p>
              </motion.div>
            </AnimatePresence>

            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1.5">
                {steps.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Go to step ${i + 1}`}
                    onClick={() => setIndex(i)}
                    className={
                      i === index
                        ? 'h-1.5 w-5 rounded-full bg-primary transition-all'
                        : 'h-1.5 w-1.5 rounded-full bg-border transition-all hover:bg-muted-foreground/50'
                    }
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                {index > 0 && (
                  <Button variant="outline" size="sm" onClick={() => setIndex((i) => i - 1)} disabled={saving}>
                    Back
                  </Button>
                )}
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button
                    size="sm"
                    disabled={saving}
                    onClick={() => (isLast ? finish() : setIndex((i) => i + 1))}
                  >
                    {isLast ? (
                      <>
                        <Check data-icon="inline-start" />
                        Get started
                      </>
                    ) : (
                      'Next'
                    )}
                  </Button>
                </motion.div>
              </div>
            </div>

            <p className="text-center text-[11px] text-muted-foreground">
              Step {index + 1} of {steps.length}
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
