'use client'

import { useMemo, useState } from 'react'
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
} from 'lucide-react'
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
import { cn } from '@/lib/utils'

type TriggerType =
  | 'lead_created'
  | 'lead_won'
  | 'deal_won'
  | 'site_visit_completed'
  | 'task_completed'
  | 'document_uploaded'

interface AutomationRule {
  id: string
  name: string
  trigger: TriggerType
  condition: string
  actions: string
  enabled: boolean
  runsToday: number
}

const triggerConfig: Record<TriggerType, { label: string; icon: typeof UserPlus }> = {
  lead_created: { label: 'Lead Created', icon: UserPlus },
  lead_won: { label: 'Lead Won', icon: Handshake },
  deal_won: { label: 'Deal Won', icon: Handshake },
  site_visit_completed: { label: 'Site Visit Completed', icon: MapPinCheck },
  task_completed: { label: 'Task Completed', icon: CheckCircle2 },
  document_uploaded: { label: 'Document Uploaded', icon: FileUp },
}

const initialRules: AutomationRule[] = [
  {
    id: 'rule_1',
    name: 'Route hot leads instantly',
    trigger: 'lead_created',
    condition: 'Temperature = Hot',
    actions: 'Create Task + Notify Owner',
    enabled: true,
    runsToday: 14,
  },
  {
    id: 'rule_2',
    name: 'Kick off onboarding on win',
    trigger: 'lead_won',
    condition: 'Stage changes to Won',
    actions: 'Create Customer + Schedule Follow-up',
    enabled: true,
    runsToday: 6,
  },
  {
    id: 'rule_3',
    name: 'Notify finance on closed deals',
    trigger: 'deal_won',
    condition: 'Deal value > ₹50L',
    actions: 'Notify Owner + Queue Email',
    enabled: true,
    runsToday: 3,
  },
  {
    id: 'rule_4',
    name: 'Auto follow-up after site visit',
    trigger: 'site_visit_completed',
    condition: 'Visit status = Completed',
    actions: 'Schedule Follow-up + Queue WhatsApp',
    enabled: true,
    runsToday: 9,
  },
  {
    id: 'rule_5',
    name: 'Reassign stale tasks',
    trigger: 'task_completed',
    condition: 'No next task created within 24h',
    actions: 'Reassign Owner + Notify Manager',
    enabled: false,
    runsToday: 0,
  },
  {
    id: 'rule_6',
    name: 'Verify KYC documents',
    trigger: 'document_uploaded',
    condition: 'Document type = KYC',
    actions: 'Create Task + Queue Email',
    enabled: true,
    runsToday: 2,
  },
]

type LogStatus = 'success' | 'failed' | 'skipped'

interface LogRow {
  id: string
  ruleName: string
  target: string
  status: LogStatus
  result: string
  time: string
}

const logRows: LogRow[] = [
  { id: 'log_1', ruleName: 'Route hot leads instantly', target: 'Lead: Rahul Sharma', status: 'success', result: 'Task created, owner notified', time: '5 min ago' },
  { id: 'log_2', ruleName: 'Auto follow-up after site visit', target: 'Visit: DLF Crest, Gurgaon', status: 'success', result: 'Follow-up scheduled for tomorrow 10 AM', time: '18 min ago' },
  { id: 'log_3', ruleName: 'Notify finance on closed deals', target: 'Deal: D-204 · Devansh Oberoi', status: 'success', result: 'Email queued to finance@estatly.com', time: '42 min ago' },
  { id: 'log_4', ruleName: 'Route hot leads instantly', target: 'Lead: Ananya Deshpande', status: 'skipped', result: 'Temperature was Warm, condition not met', time: '1 hr ago' },
  { id: 'log_5', ruleName: 'Verify KYC documents', target: 'Customer: Kabir Malhotra', status: 'success', result: 'Compliance task created', time: '2 hr ago' },
  { id: 'log_6', ruleName: 'Kick off onboarding on win', target: 'Lead: Sneha Kulkarni', status: 'failed', result: 'Customer record already exists', time: '3 hr ago' },
  { id: 'log_7', ruleName: 'Auto follow-up after site visit', target: 'Visit: Skyline Residency, Mumbai', status: 'success', result: 'WhatsApp reminder queued', time: '5 hr ago' },
  { id: 'log_8', ruleName: 'Notify finance on closed deals', target: 'Deal: D-198 · Priya Nair', status: 'success', result: 'Owner notified via push', time: '6 hr ago' },
]

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

export default function AutomationPage() {
  const [rules, setRules] = useState<AutomationRule[]>(initialRules)

  const activeCount = useMemo(() => rules.filter((r) => r.enabled).length, [rules])
  const totalRunsToday = useMemo(() => rules.reduce((sum, r) => sum + r.runsToday, 0), [rules])

  function toggleRule(id: string) {
    setRules((prev) => prev.map((rule) => (rule.id === id ? { ...rule, enabled: !rule.enabled } : rule)))
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          crumbs={[{ label: 'Intelligence' }, { label: 'Automation' }]}
          title="Automation"
          description={`${activeCount} active rules · ${totalRunsToday} actions triggered today`}
        />
        <div className="flex shrink-0 items-center gap-2">
          <Button size="sm" className="bg-foreground text-background hover:bg-foreground/85">
            <Plus data-icon="inline-start" />
            New Rule
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="font-heading text-sm font-bold uppercase tracking-wide text-muted-foreground">Rules</h2>
        <div className="flex flex-col gap-2">
          {rules.map((rule) => {
            const TriggerIcon = triggerConfig[rule.trigger].icon
            return (
              <div
                key={rule.id}
                className={cn(
                  'flex items-center gap-4 rounded-2xl bg-card px-4 py-3.5 ring-1 ring-border transition-colors hover:bg-accent/40',
                  !rule.enabled && 'opacity-60',
                )}
              >
                <Switch checked={rule.enabled} onCheckedChange={() => toggleRule(rule.id)} aria-label={`Toggle ${rule.name}`} />

                <div
                  className={cn(
                    'flex size-9 shrink-0 items-center justify-center rounded-full',
                    rule.enabled ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground',
                  )}
                >
                  <TriggerIcon className="size-4" />
                </div>

                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate font-medium text-foreground">{rule.name}</span>
                  <span className="truncate text-[12px] text-muted-foreground">
                    When <span className="font-medium text-foreground/80">{triggerConfig[rule.trigger].label}</span>
                    {' → if '}
                    <span className="font-medium text-foreground/80">{rule.condition}</span>
                    {' → '}
                    <span className="font-medium text-foreground/80">{rule.actions}</span>
                  </span>
                </div>

                <div className="hidden shrink-0 items-center gap-1.5 text-[12px] text-muted-foreground sm:flex">
                  <Repeat className="size-3.5" />
                  {rule.runsToday > 0 ? `${rule.runsToday} runs today` : 'Never run'}
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
                    <DropdownMenuItem>Edit rule</DropdownMenuItem>
                    <DropdownMenuItem>Duplicate</DropdownMenuItem>
                    <DropdownMenuItem>View logs</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive">Delete rule</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="font-heading text-sm font-bold uppercase tracking-wide text-muted-foreground">
          Recent Activity
        </h2>
        <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-border">
          <table className="w-full text-left text-[13px]">
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
              {logRows.map((log) => (
                <tr key={log.id} className="border-b border-border/60 transition-colors last:border-0 hover:bg-accent/30">
                  <td className="px-4 py-3 font-medium text-foreground">{log.ruleName}</td>
                  <td className="px-4 py-3 text-foreground/80">{log.target}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={cn('rounded-full', logStatusStyles[log.status])}>
                      {logStatusLabels[log.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{log.result}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarClock className="size-3.5" />
                      {log.time}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
