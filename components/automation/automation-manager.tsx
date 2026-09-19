'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import {
  CalendarClock,
  CheckCircle2,
  FileUp,
  Handshake,
  MapPinCheck,
  MoreHorizontal,
  Plus,
  Repeat,
  UserPlus,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/dashboard/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { RuleDialog } from '@/components/automation/rule-dialog'
import { AuroraField } from '@/components/ai/ai-motion'
import { useConfirm } from '@/components/ui/use-confirm'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import {
  type Action,
  type Condition,
  describeActions,
  describeConditions,
  entityForTrigger,
  triggerLabel,
} from '@/lib/automation/automation-config'
import type { AutomationLogRow, AutomationRuleRow } from '@/lib/automation/get-automation-data'

type LogStatus = 'success' | 'failed' | 'skipped'

const logStatusStyles: Record<LogStatus, string> = {
  success: 'bg-success/15 text-success',
  failed: 'bg-destructive/10 text-destructive',
  skipped: 'bg-muted text-muted-foreground',
}

const logStatusLabels: Record<LogStatus, string> = {
  success: 'Success',
  failed: 'Failed',
  skipped: 'Skipped',
}

function triggerIcon(trigger: string) {
  if (trigger.startsWith('lead')) return UserPlus
  if (trigger.startsWith('deal')) return Handshake
  if (trigger.startsWith('site_visit')) return MapPinCheck
  if (trigger.startsWith('follow_up')) return CheckCircle2
  if (trigger.startsWith('customer')) return FileUp
  return Zap
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hr ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
}

function logResult(details: unknown) {
  if (!details || typeof details !== 'object') return '—'
  const d = details as Record<string, unknown>
  if (typeof d.error === 'string') return d.error
  if (typeof d.result === 'string') return d.result
  if (typeof d.reason === 'string') return d.reason
  return '—'
}

export function AutomationManager({
  initialRules,
  initialLogs,
  owners,
}: {
  initialRules: AutomationRuleRow[]
  initialLogs: AutomationLogRow[]
  owners: { id: string; full_name: string }[]
}) {
  const router = useRouter()
  const [rules, setRules] = useState(initialRules)
  const [editingRule, setEditingRule] = useState<AutomationRuleRow | null>(null)
  const { confirm, ConfirmDialog } = useConfirm()

  useEffect(() => {
    setRules(initialRules)
  }, [initialRules])

  const activeCount = useMemo(() => rules.filter((r) => r.is_active).length, [rules])

  const runsToday = useMemo(() => {
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    return initialLogs.filter((l) => new Date(l.triggered_at) >= start && l.status === 'success').length
  }, [initialLogs])

  const runCountByRule = useMemo(() => {
    const map = new Map<string, number>()
    for (const log of initialLogs) {
      if (log.status !== 'success') continue
      map.set(log.rule_id, (map.get(log.rule_id) ?? 0) + 1)
    }
    return map
  }, [initialLogs])

  async function toggleRule(rule: AutomationRuleRow) {
    const next = !rule.is_active
    const prev = rules
    setRules((p) => p.map((r) => (r.id === rule.id ? { ...r, is_active: next } : r)))
    const supabase = createClient()
    const { error } = await supabase.from('automation_rules').update({ is_active: next }).eq('id', rule.id)
    if (error) {
      setRules(prev)
      toast.error(error.message)
      return
    }
    toast.success(next ? `${rule.name} activated` : `${rule.name} paused`)
  }

  async function handleDuplicate(rule: AutomationRuleRow) {
    const supabase = createClient()
    const { error } = await supabase.from('automation_rules').insert({
      org_id: rule.org_id,
      created_by: rule.created_by,
      name: `${rule.name} (copy)`,
      trigger_type: rule.trigger_type,
      conditions: rule.conditions,
      actions: rule.actions,
      is_active: false,
    })
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Rule duplicated')
    router.refresh()
  }

  async function handleDelete(rule: AutomationRuleRow) {
    const ok = await confirm({
      title: 'Delete automation rule?',
      description: `Are you sure you want to delete "${rule.name}"? This action cannot be undone.`,
      confirmLabel: 'Delete',
      destructive: true,
    })
    if (!ok) return
    const supabase = createClient()
    const { error } = await supabase.from('automation_rules').delete().eq('id', rule.id)
    if (error) {
      toast.error(error.message)
      return
    }
    setRules((p) => p.filter((r) => r.id !== rule.id))
    toast.success('Rule deleted')
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          crumbs={[{ label: 'Intelligence' }, { label: 'Automation' }]}
          title="Automation"
          description={`${activeCount} active rules · ${runsToday} actions triggered today`}
        />
        <div className="flex shrink-0 items-center gap-2">
          <RuleDialog
            trigger={
              <Button size="sm" className="bg-foreground text-background hover:bg-foreground/85">
                <Plus data-icon="inline-start" />
                New Rule
              </Button>
            }
            owners={owners}
          />
        </div>
      </div>

      <RuleDialog
        open={!!editingRule}
        onOpenChange={(next) => {
          if (!next) setEditingRule(null)
        }}
        owners={owners}
        rule={editingRule ?? undefined}
      />

      {/* Aurora only breathes while something is actually armed, so the page
          reads as "live" at a glance rather than animating for decoration. */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card">
        <AuroraField active={activeCount > 0} />
        <div className="relative flex items-center gap-3 p-4">
          <div className="relative flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
            {activeCount > 0 && (
              <motion.span
                className="absolute inset-0 rounded-full bg-primary/25"
                animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
                aria-hidden="true"
              />
            )}
            <Zap className="relative size-4" />
          </div>
          <div className="flex flex-col leading-tight">
            <p className="font-heading text-sm font-bold text-foreground">
              {activeCount > 0 ? `${activeCount} rule${activeCount === 1 ? '' : 's'} running` : 'No rules running'}
            </p>
            <p className="text-[12px] text-muted-foreground">
              {runsToday > 0
                ? `${runsToday} action${runsToday === 1 ? '' : 's'} triggered today.`
                : 'Nothing has triggered yet today.'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="font-heading text-sm font-bold uppercase tracking-wide text-muted-foreground">Rules</h2>
        <motion.div
          className="flex flex-col gap-2"
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
        >
          <AnimatePresence initial={false}>
          {rules.map((rule) => {
            const TriggerIcon = triggerIcon(rule.trigger_type)
            const entity = entityForTrigger(rule.trigger_type)
            const conditions = Array.isArray(rule.conditions) ? (rule.conditions as unknown as Condition[]) : []
            const actions = Array.isArray(rule.actions) ? (rule.actions as unknown as Action[]) : []
            const runs = runCountByRule.get(rule.id) ?? 0

            return (
              <motion.div
                key={rule.id}
                layout
                variants={{
                  hidden: { opacity: 0, y: 12 },
                  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 380, damping: 30 } },
                }}
                exit={{ opacity: 0, x: -12, transition: { duration: 0.18 } }}
                whileHover={{ y: -2 }}
                className={cn(
                  'flex items-center gap-4 rounded-2xl bg-card px-4 py-3.5 ring-1 ring-border transition-[background-color,opacity] duration-300 hover:bg-accent/40 hover:shadow-md',
                  !rule.is_active && 'opacity-60',
                )}
              >
                <Switch
                  checked={rule.is_active}
                  onCheckedChange={() => toggleRule(rule)}
                  aria-label={`Toggle ${rule.name}`}
                />

                <div
                  className={cn(
                    'flex size-9 shrink-0 items-center justify-center rounded-full',
                    rule.is_active ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground',
                  )}
                >
                  <TriggerIcon className="size-4" />
                </div>

                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate font-medium text-foreground">{rule.name}</span>
                  <span className="truncate text-[12px] text-muted-foreground">
                    When <span className="font-medium text-foreground/80">{triggerLabel(rule.trigger_type)}</span>
                    {' → if '}
                    <span className="font-medium text-foreground/80">{describeConditions(conditions, entity)}</span>
                    {' → '}
                    <span className="font-medium text-foreground/80">{describeActions(actions)}</span>
                  </span>
                </div>

                <div className="hidden shrink-0 items-center gap-1.5 text-[12px] text-muted-foreground sm:flex">
                  <Repeat className="size-3.5" />
                  {runs > 0 ? `${runs} recent runs` : 'Never run'}
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button variant="ghost" size="icon-sm" aria-label={`More actions for ${rule.name}`}>
                        <MoreHorizontal className="size-3.5" />
                      </Button>
                    }
                  />
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditingRule(rule)}>Edit rule</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDuplicate(rule)}>Duplicate</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" onClick={() => handleDelete(rule)}>
                      Delete rule
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </motion.div>
            )
          })}
          </AnimatePresence>

          {rules.length === 0 && (
            <div className="rounded-2xl bg-card px-4 py-12 text-center text-muted-foreground ring-1 ring-border">
              No automation rules yet. Create one to start automating your pipeline.
            </div>
          )}
        </motion.div>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="font-heading text-sm font-bold uppercase tracking-wide text-muted-foreground">
          Recent Activity
        </h2>
        <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-border">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-border text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Rule</th>
                  <th className="px-4 py-3 font-medium">Target</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Result</th>
                  <th className="px-4 py-3 text-right font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {initialLogs.map((log, i) => (
                  <motion.tr
                    key={log.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    // Cap the stagger so a long activity list doesn't leave the
                    // last rows visibly trailing in.
                    transition={{ duration: 0.25, delay: Math.min(i, 8) * 0.035, ease: 'easeOut' }}
                    className="border-b border-border/60 transition-colors last:border-0 hover:bg-accent/30"
                  >
                    <td className="px-4 py-3 font-medium text-foreground">{log.rule?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-foreground/80">
                      {log.target_type ?? '—'}
                      {log.target_id ? ` · ${log.target_id.slice(0, 8)}` : ''}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={cn('rounded-full', logStatusStyles[log.status as LogStatus])}
                      >
                        {logStatusLabels[log.status as LogStatus]}
                      </Badge>
                    </td>
                    <td className="max-w-[280px] px-4 py-3 text-muted-foreground">
                      <span className="line-clamp-2">{logResult(log.details)}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarClock className="size-3.5" />
                        {timeAgo(log.triggered_at)}
                      </span>
                    </td>
                  </motion.tr>
                ))}
                {initialLogs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                      No automation activity yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <ConfirmDialog />
    </div>
  )
}
