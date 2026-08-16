'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Loader2, MonitorSmartphone, ShieldCheck, X } from 'lucide-react'
import { PageHeader } from '@/components/dashboard/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { ApprovalRow } from '@/lib/approvals/get-approvals-data'

function getInitials(name: string) {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hr ago`
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
}

const statusStyles: Record<string, string> = {
  approved: 'bg-success/15 text-success',
  rejected: 'bg-destructive/10 text-destructive',
}

export function ApprovalsList({
  initialPending,
  initialDecided,
}: {
  initialPending: ApprovalRow[]
  initialDecided: ApprovalRow[]
}) {
  const router = useRouter()
  const [pending, setPending] = useState(initialPending)
  const [decided, setDecided] = useState(initialDecided)
  const [decidingId, setDecidingId] = useState<string | null>(null)

  useEffect(() => {
    setPending(initialPending)
    setDecided(initialDecided)
  }, [initialPending, initialDecided])

  // New login requests should show up without the admin needing to manually
  // reload. Postgres Changes + RLS is best-effort here (Supabase's own docs
  // call it out as the "quick testing, low connection count" mechanism, not
  // guaranteed-delivery), so a short poll backs it up rather than leaving
  // this page silently stale if a realtime event never arrives.
  useEffect(() => {
    let cancelled = false
    const supabase = createClient()
    const channel = supabase.channel('login-approvals')

    channel.on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'login_approval_queue' },
      () => {
        if (cancelled) return
        router.refresh()
      },
    )
    channel.subscribe()

    const poll = setInterval(() => {
      if (!cancelled) router.refresh()
    }, 15000)

    return () => {
      cancelled = true
      clearInterval(poll)
      supabase.removeChannel(channel)
    }
  }, [router])

  async function decide(row: ApprovalRow, decision: 'approved' | 'rejected') {
    setDecidingId(row.id)
    const supabase = createClient()
    const { data, error } = await supabase.functions.invoke('decide-login-approval', {
      body: { approval_id: row.id, decision },
    })
    setDecidingId(null)

    if (error || data?.error) {
      console.error('[decide-login-approval]', error, data)
      window.alert(data?.error ?? error?.message ?? 'Failed to record decision.')
      return
    }

    setPending((prev) => prev.filter((r) => r.id !== row.id))
    setDecided((prev) => [{ ...row, status: decision, decided_at: new Date().toISOString() }, ...prev].slice(0, 20))
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col gap-6">
      <PageHeader
        crumbs={[{ label: 'System' }, { label: 'Approvals' }]}
        title="Login Approvals"
        description={`${pending.length} pending request${pending.length === 1 ? '' : 's'} from your team.`}
      />

      <div className="flex flex-col gap-3">
        {pending.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-card px-4 py-12 text-center ring-1 ring-border">
            <ShieldCheck className="size-8 text-muted-foreground/60" />
            <p className="text-[13px] text-muted-foreground">No pending login requests.</p>
          </div>
        )}

        {pending.map((row) => (
          <div
            key={row.id}
            className="flex items-center gap-4 rounded-2xl bg-card px-4 py-3.5 ring-1 ring-border transition-colors hover:bg-accent/40"
          >
            <Avatar>
              <AvatarFallback>{getInitials(row.platform_user?.full_name ?? '?')}</AvatarFallback>
            </Avatar>

            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <span className="truncate font-medium text-foreground">{row.platform_user?.full_name ?? 'Unknown'}</span>
                <Badge variant="outline" className="rounded-full border-0 bg-primary/10 px-2 py-0 text-[10px] font-semibold capitalize text-primary">
                  {row.platform_user?.role}
                </Badge>
              </div>
              <span className="flex items-center gap-1.5 truncate text-[12px] text-muted-foreground">
                <MonitorSmartphone className="size-3.5 shrink-0" />
                New device · requested {timeAgo(row.requested_at)}
              </span>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={decidingId === row.id}
                onClick={() => decide(row, 'rejected')}
              >
                <X data-icon="inline-start" />
                Reject
              </Button>
              <Button
                size="sm"
                className="bg-foreground text-background hover:bg-foreground/85"
                disabled={decidingId === row.id}
                onClick={() => decide(row, 'approved')}
              >
                {decidingId === row.id ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Check data-icon="inline-start" />}
                Approve
              </Button>
            </div>
          </div>
        ))}
      </div>

      {decided.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="font-heading text-sm font-bold uppercase tracking-wide text-muted-foreground">
            Recent Decisions
          </h2>
          <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-border">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Person</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">Decided</th>
                  </tr>
                </thead>
                <tbody>
                  {decided.map((row) => (
                    <tr key={row.id} className="border-b border-border/60 transition-colors last:border-0 hover:bg-accent/30">
                      <td className="px-4 py-3 font-medium text-foreground">{row.platform_user?.full_name ?? 'Unknown'}</td>
                      <td className="px-4 py-3 capitalize text-foreground/80">{row.platform_user?.role}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={cn('rounded-full', statusStyles[row.status] ?? 'bg-muted text-muted-foreground')}>
                          {row.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {row.decided_at ? timeAgo(row.decided_at) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
