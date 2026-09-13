import Link from 'next/link'
import { ArrowRight, Trophy } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import type { StaffMember } from '@/lib/staff/get-staff-data'

function getInitials(name: string) {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
}

function formatCr(amount: number) {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`
  if (amount >= 100000) return `₹${Math.round(amount / 100000)}L`
  return `₹${Math.round(amount).toLocaleString('en-IN')}`
}

export function TeamPerformanceCard({ staff }: { staff: StaffMember[] }) {
  const top = staff.slice(0, 5)

  return (
    <Card className="rounded-2xl border-border shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle className="font-heading text-base font-bold">Team Performance</CardTitle>
        <Link href="/staff" className="flex items-center gap-1 text-[12px] font-medium text-primary hover:underline">
          View full staff page
          <ArrowRight className="size-3.5" />
        </Link>
      </CardHeader>
      <CardContent className="flex flex-col gap-1 p-0 pb-2">
        {top.map((member, i) => (
          <div key={member.id} className="flex items-center gap-3 px-5 py-2.5 hover:bg-accent/40">
            <div className="flex size-5 shrink-0 items-center justify-center text-[12px] font-semibold text-muted-foreground">
              {i === 0 ? <Trophy className="size-3.5 text-primary" /> : `#${i + 1}`}
            </div>
            <Avatar size="sm">
              <AvatarFallback>{getInitials(member.full_name)}</AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-[13px] font-medium text-foreground">{member.full_name}</span>
              <span className="text-[11px] text-muted-foreground capitalize">{member.role}</span>
            </div>
            <div className="flex shrink-0 items-center gap-4 text-[12px] text-foreground/80">
              <span>{member.total_leads} leads</span>
              <span>{member.deals_closed} closed</span>
              <Badge variant="outline" className="rounded-full border-0 bg-success/15 text-success">
                {formatCr(member.revenue_generated)}
              </Badge>
            </div>
          </div>
        ))}
        {top.length === 0 && (
          <p className="px-5 py-6 text-center text-[13px] text-muted-foreground">No staff activity yet.</p>
        )}
      </CardContent>
    </Card>
  )
}
