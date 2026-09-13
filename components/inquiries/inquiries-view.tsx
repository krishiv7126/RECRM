'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ClipboardList, ClipboardPlus, Mail, Phone } from 'lucide-react'
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon'
import { PageHeader } from '@/components/dashboard/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { InquiryRow } from '@/lib/inquiries/get-inquiries-data'

const stageStyles: Record<string, string> = {
  new: 'bg-muted text-muted-foreground',
  contacted: 'bg-accent text-accent-foreground',
  qualified: 'bg-secondary text-secondary-foreground',
  proposal: 'bg-primary/15 text-primary',
  site_visit: 'border border-primary/40 bg-transparent text-primary',
  won: 'bg-success/15 text-success',
  lost: 'bg-destructive/10 text-destructive',
  archive: 'bg-muted text-muted-foreground',
}

function isToday(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
}

function isThisWeek(dateStr: string) {
  const d = new Date(dateStr).getTime()
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  return d >= weekAgo
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export function InquiriesView({ initialInquiries }: { initialInquiries: InquiryRow[] }) {
  const router = useRouter()
  const [inquiries, setInquiries] = useState(initialInquiries)

  useEffect(() => {
    setInquiries(initialInquiries)
  }, [initialInquiries])

  // Reception should see a new inquiry land without reloading — same
  // realtime+poll pattern as Approvals/Leads/etc, scoped to just this source.
  useEffect(() => {
    let cancelled = false
    const supabase = createClient()
    const channel = supabase.channel('inquiries-live')

    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'leads', filter: 'source=eq.Offline Inquiry' },
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

  const total = inquiries.length
  const today = inquiries.filter((i) => isToday(i.created_at)).length
  const thisWeek = inquiries.filter((i) => isThisWeek(i.created_at)).length

  const stats = [
    { label: 'Total inquiries', value: total },
    { label: 'Today', value: today },
    { label: 'Last 7 days', value: thisWeek },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeader
          crumbs={[{ label: 'Sales' }, { label: 'Front Desk' }, { label: 'Inquiries' }]}
          title="Inquiries"
          description="Every offline inquiry logged at the front desk, live."
        />
        <Button size="sm" render={<Link href="/inquiries/new" />} nativeButton={false}>
          <ClipboardPlus data-icon="inline-start" />
          New Inquiry
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label} className="rounded-2xl border-border shadow-sm">
            <CardContent className="flex flex-col gap-1 p-5">
              <p className="font-heading text-2xl font-extrabold text-foreground">{s.value}</p>
              <p className="text-[13px] text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-border">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-border text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">City</th>
                <th className="px-4 py-3">Asking about</th>
                <th className="px-4 py-3">Stage</th>
                <th className="px-4 py-3">Logged</th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3 text-right">Contact</th>
              </tr>
            </thead>
            <tbody>
              {inquiries.map((inquiry) => (
                <tr key={inquiry.id} className="border-b border-border/70 transition-colors last:border-b-0 hover:bg-accent/50">
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">{inquiry.full_name}</span>
                      <span className="text-[12px] text-muted-foreground">{inquiry.phone ?? inquiry.email ?? '—'}</span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-foreground/80">{inquiry.city ?? '—'}</td>
                  <td className="max-w-[260px] px-4 py-3 text-foreground/80">
                    <span className="line-clamp-2">{inquiry.requirement ?? inquiry.notes ?? '—'}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <Badge variant="outline" className={cn('rounded-full', stageStyles[inquiry.stage] ?? 'bg-muted text-muted-foreground')}>
                      {inquiry.stage.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{formatDate(inquiry.created_at)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-foreground/80">{inquiry.owner?.full_name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        disabled={!inquiry.phone}
                        aria-label={`Call ${inquiry.full_name}`}
                        render={<a href={inquiry.phone ? `tel:${inquiry.phone}` : undefined} />}
                        nativeButton={false}
                      >
                        <Phone className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        disabled={!inquiry.phone}
                        aria-label={`WhatsApp ${inquiry.full_name}`}
                        render={<a href={inquiry.phone ? `https://wa.me/${inquiry.phone.replace(/\D/g, '')}` : undefined} target="_blank" rel="noreferrer" />}
                        nativeButton={false}
                      >
                        <WhatsAppIcon className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        disabled={!inquiry.email}
                        aria-label={`Email ${inquiry.full_name}`}
                        render={<a href={inquiry.email ? `mailto:${inquiry.email}` : undefined} />}
                        nativeButton={false}
                      >
                        <Mail className="size-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {inquiries.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <ClipboardList className="size-6 text-muted-foreground/60" />
                      No inquiries logged yet.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
