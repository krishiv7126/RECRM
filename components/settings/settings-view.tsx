'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  Building2,
  Camera,
  Download,
  Loader2,
  Lock,
  Megaphone,
  MessageCircle,
  Plus,
} from 'lucide-react'
import { PageHeader } from '@/components/dashboard/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { InviteMemberDialog } from '@/components/settings/invite-member-dialog'
import { ReassignDialog } from '@/components/settings/reassign-dialog'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { SettingsData } from '@/lib/settings/get-settings-data'

type TabKey = 'profile' | 'organization' | 'team' | 'integrations' | 'notifications' | 'danger'

interface TabDef {
  key: TabKey
  label: string
  adminOnly: boolean
  danger?: boolean
}

const TABS: TabDef[] = [
  { key: 'profile', label: 'Profile', adminOnly: false },
  { key: 'organization', label: 'Organization', adminOnly: true },
  { key: 'team', label: 'Team Management', adminOnly: true },
  { key: 'integrations', label: 'Integrations', adminOnly: true },
  { key: 'notifications', label: 'Notifications', adminOnly: false },
  { key: 'danger', label: 'Danger Zone', adminOnly: true, danger: true },
]

const integrationMeta: Record<string, { icon: typeof MessageCircle; color: string }> = {
  whatsapp: { icon: MessageCircle, color: 'bg-emerald-500' },
  facebook: { icon: Megaphone, color: 'bg-blue-600' },
  instagram: { icon: Camera, color: 'bg-pink-500' },
}

const notificationPrefs = [
  { key: 'task_due', label: 'Task reminders', description: 'Get notified when a task is due.' },
  { key: 'follow_up_due', label: 'Follow-up reminders', description: 'Get notified when a follow-up is due.' },
  { key: 'approval_pending', label: 'Login approvals', description: 'Get notified when a new device needs approval.' },
  { key: 'lead_assigned', label: 'Lead assignments', description: 'Get notified when a lead is assigned to you.' },
  { key: 'deal_update', label: 'Deal updates', description: 'Get notified when a deal you own changes stage.' },
  { key: 'site_visit_reminder', label: 'Site visit reminders', description: 'Get notified ahead of scheduled site visits.' },
  { key: 'system', label: 'System notifications', description: 'Product updates and platform announcements.' },
] as const

function getInitials(name: string) {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
}

function canAccessTab(tab: TabKey, role: string) {
  const isAdmin = role === 'admin' || role === 'super_admin'
  if (tab === 'team') return isAdmin || role === 'manager'
  return isAdmin || !TABS.find((t) => t.key === tab)?.adminOnly
}

function downloadCsv(rows: (string | number)[][], filename: string) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function SettingsView({ data }: { data: SettingsData }) {
  const router = useRouter()
  const { me, organization, staff, managers, providers, orgIntegrations } = data
  const role = me.role
  const isAdmin = role === 'admin' || role === 'super_admin'

  const [activeTab, setActiveTab] = useState<TabKey>('profile')

  const [fullName, setFullName] = useState(me.full_name)
  const [phone, setPhone] = useState(me.phone ?? '')
  const [savingProfile, setSavingProfile] = useState(false)

  const [orgName, setOrgName] = useState(organization?.name ?? '')
  const [orgCity, setOrgCity] = useState(organization?.city ?? '')
  const [savingOrg, setSavingOrg] = useState(false)

  const [staffRows, setStaffRows] = useState(staff)
  const [reassignTarget, setReassignTarget] = useState<(typeof staff)[number] | null>(null)

  const [exporting, setExporting] = useState(false)

  const initialPrefs = (me.notification_preferences ?? {}) as Record<string, boolean>
  const [prefs, setPrefs] = useState<Record<string, boolean>>(
    Object.fromEntries(notificationPrefs.map((p) => [p.key, initialPrefs[p.key] ?? true])),
  )
  const [savingPrefs, setSavingPrefs] = useState(false)

  const integrationStatusByProvider = useMemo(() => {
    const map = new Map<string, string>()
    for (const oi of orgIntegrations) map.set(oi.provider_id, oi.status)
    return map
  }, [orgIntegrations])

  async function handleSaveProfile() {
    setSavingProfile(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('platform_users')
      .update({ full_name: fullName.trim(), phone: phone.trim() || null })
      .eq('id', me.id)
    setSavingProfile(false)
    if (error) {
      window.alert(error.message)
      return
    }
    router.refresh()
  }

  async function handleSaveOrg() {
    if (!organization) return
    setSavingOrg(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('organizations')
      .update({ name: orgName.trim(), city: orgCity.trim() || null })
      .eq('id', organization.id)
    setSavingOrg(false)
    if (error) {
      window.alert(error.message)
      return
    }
    router.refresh()
  }

  async function toggleActive(member: (typeof staff)[number]) {
    const next = !member.is_active
    const prev = staffRows
    setStaffRows((p) => p.map((m) => (m.id === member.id ? { ...m, is_active: next } : m)))
    const supabase = createClient()
    const { error } = await supabase.from('platform_users').update({ is_active: next }).eq('id', member.id)
    if (error) {
      setStaffRows(prev)
      window.alert(error.message)
    }
  }

  async function handleSavePrefs() {
    setSavingPrefs(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('platform_users')
      .update({ notification_preferences: prefs })
      .eq('id', me.id)
    setSavingPrefs(false)
    if (error) window.alert(error.message)
  }

  async function exportAllData() {
    setExporting(true)
    const supabase = createClient()
    const stamp = new Date().toISOString().slice(0, 10)

    const [{ data: leads }, { data: customers }, { data: deals }, { data: properties }] = await Promise.all([
      supabase.from('leads').select('full_name, email, phone, stage, temperature, source, created_at'),
      supabase.from('customers').select('full_name, email, phone, city, created_at'),
      supabase.from('deals').select('code, title, stage, value, expected_close_date, created_at'),
      supabase.from('properties').select('title, property_type, status, city, price, created_at'),
    ])

    const tables: [string, { data: Record<string, unknown>[] | null }][] = [
      ['leads', { data: leads }],
      ['customers', { data: customers }],
      ['deals', { data: deals }],
      ['properties', { data: properties }],
    ]

    for (const [name, { data: rows }] of tables) {
      if (!rows || rows.length === 0) continue
      const headers = Object.keys(rows[0])
      downloadCsv([headers, ...rows.map((r) => headers.map((h) => String(r[h] ?? '')))], `${name}-export-${stamp}.csv`)
      // Small gap so the browser doesn't treat rapid downloads as a popup flood.
      await new Promise((resolve) => setTimeout(resolve, 250))
    }

    setExporting(false)
  }

  return (
    <TooltipProvider>
      <div className="flex min-h-[calc(100vh-8rem)] flex-col gap-6">
        <PageHeader
          crumbs={[{ label: 'System' }, { label: 'Settings' }]}
          title="Settings"
          description="Manage your organization, team, roles, and platform preferences."
        />

        <div className="flex flex-col gap-6 lg:flex-row">
          <nav className="flex shrink-0 flex-col gap-1 lg:w-[220px]">
            {TABS.map((tab) => {
              const locked = !canAccessTab(tab.key, role)
              const isActive = activeTab === tab.key
              const button = (
                <button
                  key={tab.key}
                  type="button"
                  disabled={locked}
                  onClick={() => !locked && setActiveTab(tab.key)}
                  className={cn(
                    'flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-[13px] font-medium transition-colors',
                    isActive && !locked
                      ? 'bg-primary text-primary-foreground'
                      : tab.danger
                        ? 'text-destructive hover:bg-destructive/10'
                        : 'text-foreground/80 hover:bg-muted',
                    locked && 'cursor-not-allowed text-muted-foreground opacity-60 hover:bg-transparent',
                  )}
                >
                  <span>{tab.label}</span>
                  {locked && <Lock className="size-3.5 shrink-0" />}
                </button>
              )
              return locked ? (
                <Tooltip key={tab.key}>
                  <TooltipTrigger render={button} />
                  <TooltipContent side="right">Admin only</TooltipContent>
                </Tooltip>
              ) : (
                button
              )
            })}
          </nav>

          <div className="min-w-0 flex-1">
            {activeTab === 'profile' && (
              <Card className="rounded-2xl border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="font-heading text-base font-bold">Profile</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-5">
                  <div className="flex items-center gap-4">
                    <Avatar size="lg" className="size-16">
                      <AvatarFallback className="bg-primary/15 text-lg font-semibold text-primary">
                        {getInitials(me.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Button variant="outline" size="sm" disabled>
                            Change photo
                          </Button>
                        }
                      />
                      <TooltipContent>Avatar uploads need storage set up first</TooltipContent>
                    </Tooltip>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="full_name" className="text-[12px] font-medium text-foreground/80">
                        Full Name
                      </label>
                      <Input id="full_name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="phone" className="text-[12px] font-medium text-foreground/80">
                        Phone
                      </label>
                      <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="username" className="text-[12px] font-medium text-foreground/80">
                        Username
                      </label>
                      <Input id="username" value={me.username} disabled className="text-muted-foreground" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[12px] font-medium text-foreground/80">Role</span>
                      <div>
                        <Badge variant="outline" className="rounded-full border-0 bg-primary/10 capitalize text-primary">
                          {role.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[12px] font-medium text-foreground/80">Organization</span>
                      <p className="text-[13px] text-foreground/80">{organization?.name ?? '—'}</p>
                    </div>
                  </div>

                  <div>
                    <Button
                      size="sm"
                      className="bg-foreground text-background hover:bg-foreground/85"
                      disabled={savingProfile}
                      onClick={handleSaveProfile}
                    >
                      {savingProfile && <Loader2 className="animate-spin" data-icon="inline-start" />}
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'organization' && isAdmin && (
              <Card className="rounded-2xl border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="font-heading text-base font-bold">Organization</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="org_name" className="text-[12px] font-medium text-foreground/80">
                        Organization Name
                      </label>
                      <Input id="org_name" value={orgName} onChange={(e) => setOrgName(e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="org_city" className="text-[12px] font-medium text-foreground/80">
                        City
                      </label>
                      <Input id="org_city" value={orgCity} onChange={(e) => setOrgCity(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <Button
                      size="sm"
                      className="bg-foreground text-background hover:bg-foreground/85"
                      disabled={savingOrg}
                      onClick={handleSaveOrg}
                    >
                      {savingOrg && <Loader2 className="animate-spin" data-icon="inline-start" />}
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'team' && canAccessTab('team', role) && (
              <Card className="rounded-2xl border-border shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                  <CardTitle className="font-heading text-base font-bold">Team Management</CardTitle>
                  <InviteMemberDialog
                    callerRole={role}
                    managers={managers}
                    trigger={
                      <Button size="sm" className="shrink-0 bg-foreground text-background hover:bg-foreground/85">
                        <Plus data-icon="inline-start" />
                        Invite Member
                      </Button>
                    }
                  />
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-[13px]">
                      <thead>
                        <tr className="border-b border-border/70 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                          <th className="px-5 py-2 font-medium">Staff</th>
                          <th className="px-3 py-2 font-medium">Reports To</th>
                          <th className="px-3 py-2 font-medium">Status</th>
                          <th className="px-5 py-2 font-medium text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {staffRows.map((member) => (
                          <tr key={member.id} className="border-b border-border/50 transition-colors last:border-0 hover:bg-muted/40">
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-2.5">
                                <Avatar size="sm">
                                  <AvatarFallback>{getInitials(member.full_name)}</AvatarFallback>
                                </Avatar>
                                <span className="font-medium text-foreground">{member.full_name}</span>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    'rounded-full border-0 px-2 py-0 text-[10px] font-semibold capitalize',
                                    member.role === 'manager' || member.role === 'admin' || member.role === 'super_admin'
                                      ? 'bg-primary/10 text-primary'
                                      : 'bg-muted text-muted-foreground',
                                  )}
                                >
                                  {member.role.replace('_', ' ')}
                                </Badge>
                              </div>
                            </td>
                            <td className="px-3 py-3 text-foreground/80">{member.manager?.full_name ?? '—'}</td>
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-2">
                                <Switch
                                  size="sm"
                                  checked={member.is_active}
                                  disabled={member.id === me.id}
                                  onCheckedChange={() => toggleActive(member)}
                                />
                                <span className="text-[12px] text-muted-foreground">
                                  {member.is_active ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                            </td>
                            <td className="px-5 py-3 text-right">
                              {isAdmin && member.role === 'user' && (
                                <Button variant="outline" size="sm" onClick={() => setReassignTarget(member)}>
                                  Reassign
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                        {staffRows.length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-5 py-12 text-center text-muted-foreground">
                              No team members visible to you yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'integrations' && isAdmin && (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {providers.map((provider) => {
                    const meta = integrationMeta[provider.key] ?? { icon: MessageCircle, color: 'bg-muted-foreground' }
                    const Icon = meta.icon
                    const status = integrationStatusByProvider.get(provider.id) ?? 'disconnected'
                    const connectButton = (
                      <Button variant="outline" size="sm" className="w-full" disabled={!provider.is_active}>
                        Connect
                      </Button>
                    )
                    return (
                      <Card key={provider.id} className="rounded-2xl border-border shadow-sm">
                        <CardContent className="flex flex-col gap-3 pt-4">
                          <div className="flex items-center justify-between">
                            <span className={cn('flex size-10 items-center justify-center rounded-xl text-white', meta.color)}>
                              <Icon className="size-5" />
                            </span>
                            <Badge
                              variant="outline"
                              className={cn(
                                'rounded-full border-0 px-2 py-0 text-[10px] font-semibold capitalize',
                                status === 'connected' && 'bg-emerald-500/15 text-emerald-600',
                                status === 'disconnected' && 'bg-muted text-muted-foreground',
                                status === 'error' && 'bg-destructive/10 text-destructive',
                              )}
                            >
                              {status}
                            </Badge>
                          </div>
                          <div>
                            <p className="font-heading text-sm font-bold text-foreground">{provider.name}</p>
                            <Badge variant="outline" className="mt-1 rounded-full border-0 bg-muted text-[11px] capitalize text-muted-foreground">
                              {provider.category}
                            </Badge>
                          </div>
                          {provider.is_active ? (
                            connectButton
                          ) : (
                            <Tooltip>
                              <TooltipTrigger render={<span className="block">{connectButton}</span>} />
                              <TooltipContent>Not available yet — pending Meta Business Verification</TooltipContent>
                            </Tooltip>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
                <p className="flex items-center gap-2 rounded-lg bg-muted/50 px-4 py-3 text-[12px] text-muted-foreground">
                  <Lock className="size-4 shrink-0" />
                  Additional integrations can be added by Super Admin from the Integration Marketplace.
                </p>
              </div>
            )}

            {activeTab === 'notifications' && (
              <Card className="rounded-2xl border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="font-heading text-base font-bold">Notifications</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-1">
                  {notificationPrefs.map((pref, index) => (
                    <div
                      key={pref.key}
                      className={cn(
                        'flex items-center justify-between gap-4 py-3',
                        index < notificationPrefs.length - 1 && 'border-b border-border/50',
                      )}
                    >
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-foreground">{pref.label}</p>
                        <p className="text-[12px] text-muted-foreground">{pref.description}</p>
                      </div>
                      <Switch
                        checked={prefs[pref.key] ?? false}
                        onCheckedChange={(checked) => setPrefs((prev) => ({ ...prev, [pref.key]: checked }))}
                      />
                    </div>
                  ))}
                  <div className="pt-3">
                    <Button
                      size="sm"
                      className="bg-foreground text-background hover:bg-foreground/85"
                      disabled={savingPrefs}
                      onClick={handleSavePrefs}
                    >
                      {savingPrefs && <Loader2 className="animate-spin" data-icon="inline-start" />}
                      Save Preferences
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'danger' && isAdmin && (
              <Card className="rounded-2xl border-destructive/30 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-heading text-base font-bold text-destructive">
                    <AlertTriangle className="size-4" />
                    Danger Zone
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between gap-4 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-4">
                    <div className="flex items-start gap-3">
                      <Building2 className="mt-0.5 size-5 shrink-0 text-destructive" />
                      <div>
                        <p className="text-[13px] font-semibold text-foreground">Export All Data</p>
                        <p className="text-[12px] text-muted-foreground">
                          Download CSV exports of your organization&apos;s leads, customers, deals, and properties.
                        </p>
                      </div>
                    </div>
                    <Button variant="destructive" size="sm" className="shrink-0" disabled={exporting} onClick={exportAllData}>
                      {exporting ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Download data-icon="inline-start" />}
                      Export
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <ReassignDialog
          open={!!reassignTarget}
          onOpenChange={(next) => {
            if (!next) setReassignTarget(null)
          }}
          member={reassignTarget}
          managers={managers}
        />
      </div>
    </TooltipProvider>
  )
}
