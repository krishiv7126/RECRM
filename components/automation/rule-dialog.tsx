'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'
import {
  type Action,
  type Condition,
  actionTypes,
  entityForTrigger,
  fieldsByEntity,
  followUpTypes,
  notificationTypes,
  operators,
  taskCategories,
  taskPriorities,
  triggers,
} from '@/lib/automation/automation-config'

const selectClass =
  'h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'

interface EditableRule {
  id: string
  name: string
  trigger_type: string
  is_active: boolean
  conditions: unknown
  actions: unknown
}

export function RuleDialog({
  trigger,
  open: openProp,
  onOpenChange: onOpenChangeProp,
  owners,
  rule,
}: {
  trigger?: React.ReactElement
  open?: boolean
  onOpenChange?: (open: boolean) => void
  owners: { id: string; full_name: string }[]
  rule?: EditableRule
}) {
  const router = useRouter()
  const [openState, setOpenState] = useState(false)
  const open = openProp ?? openState
  const setOpen = onOpenChangeProp ?? setOpenState

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [triggerType, setTriggerType] = useState('lead_created')
  const [conditions, setConditions] = useState<Condition[]>([])
  const [actions, setActions] = useState<Action[]>([])

  useEffect(() => {
    if (!open) return
    setName(rule?.name ?? '')
    setTriggerType(rule?.trigger_type ?? 'lead_created')
    setConditions(Array.isArray(rule?.conditions) ? (rule.conditions as Condition[]) : [])
    setActions(Array.isArray(rule?.actions) ? (rule.actions as Action[]) : [])
    setError(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, rule?.id])

  const entity = entityForTrigger(triggerType)
  const fields = fieldsByEntity[entity]

  const triggerGroups = useMemo(() => {
    const groups = new Map<string, typeof triggers>()
    for (const t of triggers) {
      const list = groups.get(t.group) ?? []
      list.push(t)
      groups.set(t.group, list)
    }
    return Array.from(groups.entries())
  }, [])

  function updateCondition(i: number, patch: Partial<Condition>) {
    setConditions((prev) => prev.map((c, idx) => (idx === i ? { ...c, ...patch } : c)))
  }

  function updateActionConfig(i: number, patch: Record<string, string | number>) {
    setActions((prev) => prev.map((a, idx) => (idx === i ? { ...a, config: { ...a.config, ...patch } } : a)))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setError('Rule name is required.')
      return
    }
    if (actions.length === 0) {
      setError('Add at least one action — a rule with no actions does nothing.')
      return
    }
    const incomplete = conditions.find((c) => !c.field || !c.operator || c.value === '')
    if (incomplete) {
      setError('Every condition needs a field, operator and value.')
      return
    }

    setSubmitting(true)
    setError(null)
    const supabase = createClient()

    const payload = {
      name: name.trim(),
      trigger_type: triggerType,
      conditions: conditions as unknown as never,
      actions: actions as unknown as never,
    }

    if (rule) {
      const { error: updateErr } = await supabase.from('automation_rules').update(payload).eq('id', rule.id)
      setSubmitting(false)
      if (updateErr) {
        setError(updateErr.message)
        return
      }
    } else {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setError('Not signed in.')
        setSubmitting(false)
        return
      }
      const { data: me } = await supabase
        .from('platform_users')
        .select('id, org_id')
        .eq('auth_user_id', user.id)
        .single()
      if (!me?.org_id) {
        setError('Could not resolve your organization.')
        setSubmitting(false)
        return
      }

      const { error: insertErr } = await supabase
        .from('automation_rules')
        .insert({ org_id: me.org_id, created_by: me.id, ...payload })
      setSubmitting(false)
      if (insertErr) {
        setError(insertErr.message)
        return
      }
    }

    setOpen(false)
    router.refresh()
  }

  function renderActionConfig(action: Action, i: number) {
    const cfg = action.config ?? {}
    const assigneeSelect = (key: string, label: string) => (
      <div className="flex flex-col gap-1.5">
        <label className="text-[12px] font-medium text-foreground/80">{label}</label>
        <select
          value={(cfg[key] as string) ?? ''}
          onChange={(e) => updateActionConfig(i, { [key]: e.target.value })}
          className={selectClass}
        >
          <option value="">Record owner</option>
          {owners.map((o) => (
            <option key={o.id} value={o.id}>
              {o.full_name}
            </option>
          ))}
        </select>
      </div>
    )

    if (action.type === 'create_task') {
      return (
        <div className="grid grid-cols-2 gap-2.5">
          <div className="col-span-2 flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-foreground/80">Task title</label>
            <Input
              value={(cfg.title as string) ?? ''}
              onChange={(e) => updateActionConfig(i, { title: e.target.value })}
              placeholder="e.g. Call hot lead within 1 hour"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-foreground/80">Category</label>
            <select
              value={(cfg.category as string) ?? 'other'}
              onChange={(e) => updateActionConfig(i, { category: e.target.value })}
              className={selectClass}
            >
              {taskCategories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-foreground/80">Priority</label>
            <select
              value={(cfg.priority as string) ?? 'medium'}
              onChange={(e) => updateActionConfig(i, { priority: e.target.value })}
              className={selectClass}
            >
              {taskPriorities.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-foreground/80">Due in (days)</label>
            <Input
              type="number"
              value={(cfg.due_in_days as string) ?? '1'}
              onChange={(e) => updateActionConfig(i, { due_in_days: e.target.value })}
            />
          </div>
          {assigneeSelect('assignee_id', 'Assign to')}
        </div>
      )
    }

    if (action.type === 'create_follow_up') {
      return (
        <div className="grid grid-cols-2 gap-2.5">
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-foreground/80">Type</label>
            <select
              value={(cfg.follow_up_type as string) ?? 'call'}
              onChange={(e) => updateActionConfig(i, { follow_up_type: e.target.value })}
              className={selectClass}
            >
              {followUpTypes.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-foreground/80">Due in (hours)</label>
            <Input
              type="number"
              value={(cfg.due_in_hours as string) ?? '24'}
              onChange={(e) => updateActionConfig(i, { due_in_hours: e.target.value })}
            />
          </div>
          <div className="col-span-2 flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-foreground/80">Notes</label>
            <Input
              value={(cfg.notes as string) ?? ''}
              onChange={(e) => updateActionConfig(i, { notes: e.target.value })}
            />
          </div>
          {assigneeSelect('assignee_id', 'Assign to')}
        </div>
      )
    }

    if (action.type === 'create_notification') {
      return (
        <div className="grid grid-cols-2 gap-2.5">
          <div className="col-span-2 flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-foreground/80">Title</label>
            <Input
              value={(cfg.title as string) ?? ''}
              onChange={(e) => updateActionConfig(i, { title: e.target.value })}
              placeholder="e.g. New hot lead assigned"
            />
          </div>
          <div className="col-span-2 flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-foreground/80">Body</label>
            <Input value={(cfg.body as string) ?? ''} onChange={(e) => updateActionConfig(i, { body: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-foreground/80">Notification type</label>
            <select
              value={(cfg.notification_type as string) ?? 'system'}
              onChange={(e) => updateActionConfig(i, { notification_type: e.target.value })}
              className={selectClass}
            >
              {notificationTypes.map((n) => (
                <option key={n.value} value={n.value}>
                  {n.label}
                </option>
              ))}
            </select>
          </div>
          {assigneeSelect('recipient_id', 'Notify')}
        </div>
      )
    }

    if (action.type === 'assign_owner') {
      return (
        <div className="grid grid-cols-2 gap-2.5">
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-foreground/80">New owner</label>
            <select
              value={(cfg.new_owner_id as string) ?? ''}
              onChange={(e) => updateActionConfig(i, { new_owner_id: e.target.value })}
              className={selectClass}
            >
              <option value="">Select…</option>
              {owners.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.full_name}
                </option>
              ))}
            </select>
          </div>
          <p className="col-span-2 text-[11px] text-muted-foreground">
            Only applies to leads and deals.
          </p>
        </div>
      )
    }

    // send_whatsapp / send_email
    return (
      <div className="flex flex-col gap-2.5">
        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-medium text-foreground/80">Message</label>
          <Input
            value={(cfg.message as string) ?? ''}
            onChange={(e) => updateActionConfig(i, { message: e.target.value })}
          />
        </div>
        <p className="text-[11px] text-muted-foreground">
          Queued as a notification only — real delivery needs the integration connected in Settings.
        </p>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger render={trigger} />}
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{rule ? 'Edit Rule' : 'New Automation Rule'}</DialogTitle>
          <DialogDescription>
            When the trigger fires, every condition must pass, then all actions run.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="rule_name" className="text-sm font-medium text-foreground">
                Rule name <span className="text-destructive">*</span>
              </label>
              <Input
                id="rule_name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. Route hot leads instantly"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="rule_trigger" className="text-sm font-medium text-foreground">
                When (trigger)
              </label>
              <select
                id="rule_trigger"
                value={triggerType}
                onChange={(e) => {
                  setTriggerType(e.target.value)
                  setConditions([])
                }}
                className={selectClass}
              >
                {triggerGroups.map(([group, items]) => (
                  <optgroup key={group} label={group}>
                    {items.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-xl border border-border p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                Conditions <span className="font-normal text-muted-foreground">(all must match)</span>
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setConditions((prev) => [...prev, { field: fields[0].value, operator: 'eq', value: '' }])
                }
              >
                <Plus data-icon="inline-start" />
                Add
              </Button>
            </div>

            {conditions.length === 0 && (
              <p className="text-[12px] text-muted-foreground">
                No conditions — this rule runs every time the trigger fires.
              </p>
            )}

            {conditions.map((c, i) => {
              const fieldDef = fields.find((f) => f.value === c.field)
              return (
                <div key={i} className="flex items-end gap-2">
                  <div className="flex flex-1 flex-col gap-1.5">
                    <select
                      value={c.field}
                      onChange={(e) => updateCondition(i, { field: e.target.value, value: '' })}
                      className={selectClass}
                    >
                      {fields.map((f) => (
                        <option key={f.value} value={f.value}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-24">
                    <select
                      value={c.operator}
                      onChange={(e) => updateCondition(i, { operator: e.target.value })}
                      className={selectClass}
                    >
                      {operators.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    {fieldDef?.type === 'enum' ? (
                      <select
                        value={c.value}
                        onChange={(e) => updateCondition(i, { value: e.target.value })}
                        className={selectClass}
                      >
                        <option value="">Select…</option>
                        {fieldDef.options?.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        type={fieldDef?.type === 'number' ? 'number' : 'text'}
                        value={c.value}
                        onChange={(e) => updateCondition(i, { value: e.target.value })}
                        placeholder="Value"
                      />
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Remove condition"
                    onClick={() => setConditions((prev) => prev.filter((_, idx) => idx !== i))}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              )
            })}
          </div>

          <div className="flex flex-col gap-2 rounded-xl border border-border p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                Actions <span className="font-normal text-muted-foreground">(run in order)</span>
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setActions((prev) => [...prev, { type: 'create_task', config: {} }])}
              >
                <Plus data-icon="inline-start" />
                Add
              </Button>
            </div>

            {actions.length === 0 && (
              <p className="text-[12px] text-muted-foreground">Add at least one action.</p>
            )}

            {actions.map((a, i) => (
              <div key={i} className="flex flex-col gap-2.5 rounded-lg bg-muted/40 p-3">
                <div className="flex items-center gap-2">
                  <select
                    value={a.type}
                    onChange={(e) =>
                      setActions((prev) => prev.map((x, idx) => (idx === i ? { type: e.target.value, config: {} } : x)))
                    }
                    className={selectClass}
                  >
                    {actionTypes.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Remove action"
                    onClick={() => setActions((prev) => prev.filter((_, idx) => idx !== i))}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
                {renderActionConfig(a, i)}
              </div>
            ))}
          </div>

          {error && <p className="text-[13px] text-destructive">{error}</p>}

          <div className="mt-1 flex justify-end gap-2">
            <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="animate-spin" /> : <Plus data-icon="inline-start" />}
              {rule ? 'Save Changes' : 'Create Rule'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
