'use client'

import { useMemo, useState } from 'react'
import { PageHeader } from '@/components/dashboard/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { ManageAccessDialog } from '@/components/settings/manage-access-dialog'
import { navByRole, type Role } from '@/lib/nav-config'
import { cn } from '@/lib/utils'
import { Search, ShieldCheck, TrendingUp, Users } from 'lucide-react'
import type { StaffMember } from '@/lib/staff/get-staff-data'

function getInitials(name: string) {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
}

function formatCr(amount: number) {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`
  if (amount >= 100000) return `₹${Math.round(amount / 100000)}L`
  return `₹${Math.round(amount).toLocaleString('en-IN')}`
}

/** Role default page count + any per-user overrides, net of duplicates. */
function accessCount(member: StaffMember) {
  const base = new Set((navByRole[member.role as Role] ?? []).flatMap((s) => s.groups.map((g) => g.label)))
  const overrides = member.nav_overrides ?? {}
  for (const [label, allowed] of Object.entries(overrides)) {
    if (allowed) base.add(label)
    else base.delete(label)
  }
  return base.size
}

export function StaffView({ staff }: { staff: StaffMember[] }) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return staff
    return staff.filter(
      (s) => s.full_name.toLowerCase().includes(q) || (s.reports_to ?? '').toLowerCase().includes(q),
    )
  }, [staff, query])

  const totals = useMemo(() => {
    const active = staff.filter((s) => s.is_active)
    return {
      count: staff.length,
      active: active.length,
      revenue: staff.reduce((sum, s) => sum + s.revenue_generated, 0),
      leads: staff.reduce((sum, s) => sum + s.total_leads, 0),
      avgConversion:
        staff.length > 0 ? Math.round((staff.reduce((sum, s) => sum + s.lead_conversion_pct, 0) / staff.length) * 10) / 10 : 0,
    }
  }, [staff])

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col gap-6">
      <PageHeader
        crumbs={[{ label: 'System' }, { label: 'Staff' }]}
        title="Staff"
        description="Every manager and user in your organization — performance and access, in one place."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl border-border shadow-sm">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10">
              <Users className="size-4.5 text-primary" />
            </div>
            <div>
              <p className="font-heading text-xl font-extrabold text-foreground">
                {totals.active} <span className="text-[13px] font-medium text-muted-foreground">/ {totals.count}</span>
              </p>
              <p className="text-[12px] text-muted-foreground">Active staff</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border shadow-sm">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10">
              <TrendingUp className="size-4.5 text-primary" />
            </div>
            <div>
              <p className="font-heading text-xl font-extrabold text-foreground">{formatCr(totals.revenue)}</p>
              <p className="text-[12px] text-muted-foreground">Team revenue</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border shadow-sm">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10">
              <Users className="size-4.5 text-primary" />
            </div>
            <div>
              <p className="font-heading text-xl font-extrabold text-foreground">{totals.leads}</p>
              <p className="text-[12px] text-muted-foreground">Team leads</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border shadow-sm">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10">
              <ShieldCheck className="size-4.5 text-primary" />
            </div>
            <div>
              <p className="font-heading text-xl font-extrabold text-foreground">{totals.avgConversion}%</p>
              <p className="text-[12px] text-muted-foreground">Avg. conversion</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <InputGroup className="w-full sm:w-72">
        <InputGroupAddon>
          <Search className="size-4" />
        </InputGroupAddon>
        <InputGroupInput placeholder="Search staff…" value={query} onChange={(e) => setQuery(e.target.value)} />
      </InputGroup>

      <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-border">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-border text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">Staff</th>
                <th className="px-3 py-3">Reports to</th>
                <th className="px-3 py-3">Leads</th>
                <th className="px-3 py-3">Hot</th>
                <th className="px-3 py-3">Conversion</th>
                <th className="px-3 py-3">Active deals</th>
                <th className="px-3 py-3">Closed</th>
                <th className="px-3 py-3">Revenue</th>
                <th className="px-3 py-3">Site visits</th>
                <th className="px-3 py-3">Follow-ups</th>
                <th className="px-3 py-3">Access</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((member) => (
                <tr key={member.id} className="border-b border-border/70 transition-colors last:border-0 hover:bg-accent/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar size="sm">
                        <AvatarFallback>{getInitials(member.full_name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{member.full_name}</span>
                        <div className="flex items-center gap-1.5">
                          <Badge
                            variant="outline"
                            className={cn(
                              'rounded-full border-0 px-1.5 py-0 text-[10px] font-semibold capitalize',
                              member.role === 'manager' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
                            )}
                          >
                            {member.role}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={cn(
                              'rounded-full border-0 px-1.5 py-0 text-[10px] font-semibold',
                              member.is_active ? 'bg-success/15 text-success' : 'bg-destructive/10 text-destructive',
                            )}
                          >
                            {member.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-foreground/80">{member.reports_to ?? '—'}</td>
                  <td className="px-3 py-3 text-foreground/80">{member.total_leads}</td>
                  <td className="px-3 py-3 text-foreground/80">{member.hot_leads}</td>
                  <td className="px-3 py-3 text-foreground/80">{member.lead_conversion_pct}%</td>
                  <td className="px-3 py-3 text-foreground/80">{member.active_deals}</td>
                  <td className="px-3 py-3 text-foreground/80">{member.deals_closed}</td>
                  <td className="px-3 py-3 font-medium text-foreground">{formatCr(member.revenue_generated)}</td>
                  <td className="px-3 py-3 text-foreground/80">
                    {member.site_visits_completed}/{member.site_visits_conducted}
                  </td>
                  <td className="px-3 py-3 text-foreground/80">
                    {member.follow_ups_completed}/{member.total_follow_ups}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-col">
                      <span className="text-foreground/80">{accessCount(member)} pages</span>
                      {member.nav_overrides && Object.keys(member.nav_overrides).length > 0 && (
                        <span className="text-[11px] text-primary">Custom</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ManageAccessDialog
                      member={member}
                      trigger={
                        <Button variant="outline" size="sm">
                          Manage Access
                        </Button>
                      }
                    />
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={12} className="px-5 py-12 text-center text-muted-foreground">
                    No staff match your search.
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
