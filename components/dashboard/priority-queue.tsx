import Link from 'next/link'
import { AlertTriangle, Clock, Flame, Sparkles } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { LucideIcon } from 'lucide-react'
import type { getDashboardData } from '@/lib/dashboard/get-dashboard-data'

type PriorityQueue = Awaited<ReturnType<typeof getDashboardData>>['priorityQueue']

function formatDueLabel(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate())
  const diffDays = Math.round((startOfDay(d).getTime() - startOfDay(now).getTime()) / 86400000)
  const time = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })
  if (diffDays === 0) return `Today, ${time}`
  if (diffDays === -1) return `Yesterday, ${time}`
  if (diffDays < -1) return `${d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', timeZone: 'Asia/Kolkata' })}, ${time}`
  return time
}

function linkedName(item: { lead: { full_name: string } | null; customer: { full_name: string } | null }) {
  return item.lead?.full_name ?? item.customer?.full_name ?? '—'
}

function linkedHref(item: { lead: { id: string } | null; customer: { id: string } | null }) {
  if (item.lead) return `/leads/${item.lead.id}`
  if (item.customer) return `/customers/${item.customer.id}`
  return '/follow-ups'
}

function Column({
  title,
  icon: Icon,
  accent,
  href,
  count,
  children,
  emptyLabel,
}: {
  title: string
  icon: LucideIcon
  accent: string
  href: string
  count: number
  children: React.ReactNode
  emptyLabel: string
}) {
  return (
    <Card className="rounded-2xl border-border shadow-sm">
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Icon className={`size-4 ${accent}`} />
            <h3 className="font-heading text-[13px] font-bold text-foreground">{title}</h3>
          </div>
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-[11px] font-semibold text-muted-foreground">
            {count}
          </span>
        </div>
        {count === 0 ? (
          <p className="py-4 text-center text-[12px] text-muted-foreground">{emptyLabel}</p>
        ) : (
          <div className="flex max-h-56 flex-col gap-1 overflow-y-auto">{children}</div>
        )}
        <Link href={href} className="text-[12px] font-medium text-primary hover:underline">
          View all →
        </Link>
      </CardContent>
    </Card>
  )
}

function Row({ primary, secondary, tone, href }: { primary: string; secondary: string; tone?: 'warning'; href: string }) {
  return (
    <Link href={href} className="flex flex-col gap-0.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-accent/40">
      <span className="truncate text-[13px] font-medium text-foreground">{primary}</span>
      <span className={`truncate text-[11px] ${tone === 'warning' ? 'font-semibold text-destructive' : 'text-muted-foreground'}`}>
        {secondary}
      </span>
    </Link>
  )
}

export function PriorityQueue({ data }: { data: PriorityQueue }) {
  return (
    <div>
      <h2 className="mb-3 font-heading text-sm font-bold text-foreground">Today’s Priorities</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Column
          title="Overdue"
          icon={AlertTriangle}
          accent="text-destructive"
          href="/follow-ups?tab=overdue"
          count={data.overdueFollowUps.length}
          emptyLabel="Nothing overdue."
        >
          {data.overdueFollowUps.map((f) => (
            <Row
              key={f.id}
              primary={linkedName(f)}
              secondary={`${formatDueLabel(f.due_at)} · ${f.owner?.full_name ?? '—'}`}
              tone="warning"
              href={linkedHref(f)}
            />
          ))}
        </Column>

        <Column
          title="Due Today"
          icon={Clock}
          accent="text-primary"
          href="/follow-ups"
          count={data.dueTodayFollowUps.length}
          emptyLabel="Nothing due today."
        >
          {data.dueTodayFollowUps.map((f) => (
            <Row
              key={f.id}
              primary={linkedName(f)}
              secondary={`${formatDueLabel(f.due_at)} · ${f.owner?.full_name ?? '—'}`}
              href={linkedHref(f)}
            />
          ))}
        </Column>

        <Column
          title="Hot Leads to Contact"
          icon={Flame}
          accent="text-destructive"
          href="/leads"
          count={data.hotLeadsToContact.length}
          emptyLabel="No hot leads waiting."
        >
          {data.hotLeadsToContact.map((l) => (
            <Row
              key={l.id}
              primary={l.full_name}
              secondary={`Score ${l.ai_score} · ${l.owner?.full_name ?? '—'}`}
              href={`/leads/${l.id}`}
            />
          ))}
        </Column>

        <Column
          title="Fresh Leads"
          icon={Sparkles}
          accent="text-chart-2"
          href="/leads"
          count={data.freshLeads.length}
          emptyLabel="No new leads waiting."
        >
          {data.freshLeads.map((l) => (
            <Row key={l.id} primary={l.full_name} secondary={l.owner?.full_name ?? 'Unassigned'} href={`/leads/${l.id}`} />
          ))}
        </Column>
      </div>
    </div>
  )
}
