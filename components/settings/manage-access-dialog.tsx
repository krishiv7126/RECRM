'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
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
import { allNavAccessGroups, allNavGroupLabels, navByRole, type Role } from '@/lib/nav-config'

interface Member {
  id: string
  full_name: string
  role: string
  nav_overrides: unknown
}

export function ManageAccessDialog({ trigger, member }: { trigger: React.ReactElement; member: Member }) {
  const router = useRouter()
  const memberOverrides = (member.nav_overrides ?? null) as Record<string, boolean> | null
  const [open, setOpen] = useState(false)
  const [overrides, setOverrides] = useState<Record<string, boolean>>(memberOverrides ?? {})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const roleSections = navByRole[member.role as Role] ?? []
  const roleDefaults = new Set([
    ...roleSections.flatMap((s) => s.groups.map((g) => g.label)),
    ...roleSections.flatMap((s) => s.groups.flatMap((g) => g.items?.map((i) => i.label) ?? [])),
  ])

  function isChecked(label: string) {
    return label in overrides ? overrides[label] : roleDefaults.has(label)
  }

  function toggle(label: string) {
    setOverrides((prev) => {
      const next = { ...prev }
      const newValue = !isChecked(label)
      if (newValue === roleDefaults.has(label)) {
        delete next[label] // matches the role default again -- no override needed
      } else {
        next[label] = newValue
      }
      return next
    })
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) {
      setOverrides(memberOverrides ?? {})
      setError(null)
    }
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    const supabase = createClient()
    const { error: updateErr } = await supabase
      .from('platform_users')
      .update({ nav_overrides: Object.keys(overrides).length > 0 ? overrides : null })
      .eq('id', member.id)
    setSaving(false)
    if (updateErr) {
      setError(updateErr.message)
      return
    }
    setOpen(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage Access — {member.full_name}</DialogTitle>
          <DialogDescription>
            Turn pages — and individual sub-pages — on or off for this person, overriding their role’s defaults.
          </DialogDescription>
        </DialogHeader>

        <div className="flex max-h-[60vh] flex-col gap-1 overflow-y-auto pr-1">
          {allNavGroupLabels.map((label) => {
            const overridden = label in overrides
            const groupOn = isChecked(label)
            const accessGroup = allNavAccessGroups.find((g) => g.label === label)
            return (
              <div key={label} className="flex flex-col">
                <div className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 hover:bg-accent/40">
                  <div className="flex flex-col">
                    <span className="text-[13px] font-medium text-foreground">{label}</span>
                    {overridden && <span className="text-[11px] text-primary">Custom override</span>}
                  </div>
                  <Switch size="sm" checked={groupOn} onCheckedChange={() => toggle(label)} />
                </div>

                {accessGroup && groupOn && (
                  <div className="ml-4 flex flex-col gap-0.5 border-l border-border pl-3">
                    {accessGroup.items.map((itemLabel) => {
                      const itemOverridden = itemLabel in overrides
                      return (
                        <div
                          key={itemLabel}
                          className="flex items-center justify-between gap-3 rounded-lg px-2 py-1 hover:bg-accent/40"
                        >
                          <div className="flex flex-col">
                            <span className="text-[12px] text-foreground/80">{itemLabel}</span>
                            {itemOverridden && <span className="text-[10px] text-primary">Custom override</span>}
                          </div>
                          <Switch size="sm" checked={isChecked(itemLabel)} onCheckedChange={() => toggle(itemLabel)} />
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {error && <p className="text-[13px] text-destructive">{error}</p>}

        <div className="mt-1 flex justify-end gap-2">
          <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
          <Button type="button" disabled={saving} onClick={handleSave}>
            {saving ? <Loader2 className="animate-spin" /> : <ShieldCheck data-icon="inline-start" />}
            Save Access
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
