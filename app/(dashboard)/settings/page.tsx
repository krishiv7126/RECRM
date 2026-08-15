'use client'

import type { ComponentType } from 'react'
import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  Building2,
  Camera,
  Download,
  Lock,
  Megaphone,
  MessageCircle,
  Plus,
  Shield,
  UserCog,
} from 'lucide-react'
import { PageHeader } from '@/components/dashboard/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { currentUser, organization } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import { useRole } from '@/lib/role-context'
import type { UserRole } from '@/lib/types'

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

interface StaffRow {
  id: string
  full_name: string
  role: UserRole
  reports_to: string | null
  is_active: boolean
}

const staffRows: StaffRow[] = [
  { id: 'usr_priya_nair', full_name: 'Priya Nair', role: 'manager', reports_to: null, is_active: true },
  { id: 'usr_aditya_rao', full_name: 'Aditya Rao', role: 'admin', reports_to: null, is_active: true },
  { id: 'usr_karan_shetty', full_name: 'Karan Shetty', role: 'user', reports_to: 'Priya Nair', is_active: true },
  { id: 'usr_meera_iyer', full_name: 'Meera Iyer', role: 'user', reports_to: 'Priya Nair', is_active: true },
  { id: 'usr_rohan_verma', full_name: 'Rohan Verma', role: 'user', reports_to: 'Aditya Rao', is_active: true },
  { id: 'usr_divya_prakash', full_name: 'Divya Prakash', role: 'user', reports_to: 'Aditya Rao', is_active: false },
]

interface IntegrationDef {
  key: string
  name: string
  category: string
  status: 'connected' | 'disconnected' | 'error'
  icon: ComponentType<{ className?: string }>
  color: string
}

const integrations: IntegrationDef[] = [
  { key: 'whatsapp_business', name: 'WhatsApp Business', category: 'Messaging', status: 'disconnected', icon: MessageCircle, color: 'bg-emerald-500' },
  { key: 'facebook_page', name: 'Facebook Page', category: 'Lead Ads', status: 'disconnected', icon: Megaphone, color: 'bg-blue-600' },
  { key: 'instagram_business', name: 'Instagram Business', category: 'Lead Ads', status: 'disconnected', icon: Camera, color: 'bg-pink-500' },
]

interface NotificationPref {
  key: string
  label: string
  description: string
}

const notificationPrefs: NotificationPref[] = [
  { key: 'task_due', label: 'Task reminders', description: 'Get notified when a task is due.' },
  { key: 'follow_up_due', label: 'Follow-up reminders', description: 'Get notified when a follow-up is due.' },
  { key: 'approval_pending', label: 'Login approvals', description: 'Get notified when a new device needs approval.' },
  { key: 'lead_assigned', label: 'Lead assignments', description: 'Get notified when a lead is assigned to you.' },
  { key: 'deal_update', label: 'Deal updates', description: 'Get notified when a deal you own changes stage.' },
  { key: 'site_visit_reminder', label: 'Site visit reminders', description: 'Get notified ahead of scheduled site visits.' },
  { key: 'system', label: 'System notifications', description: 'Product updates and platform announcements.' },
]

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

// TODO: wire to POST /api/integrations/:provider_key/connect
function connectIntegration(providerKey: string) {
  console.log('[v0] connectIntegration called for', providerKey)
}

// TODO: generate a full CSV export of org data (leads, customers, deals, properties)
function exportAllData() {
  console.log('[v0] exportAllData called')
}

function canAccessTab(tab: TabKey, role: UserRole) {
  const isAdmin = role === 'admin' || role === 'super_admin'
  // Team Management is the one adminOnly tab managers can still reach — scoped
  // to their own reports once this page is wired to real data. Everything else
  // adminOnly (organization, integrations, danger) stays strictly admin.
  if (tab === 'team') return isAdmin || role === 'manager'
  return isAdmin || !TABS.find((t) => t.key === tab)?.adminOnly
}

export default function SettingsPage() {
  const role = useRole()
  const isAdmin = role === 'admin' || role === 'super_admin'
  const [activeTab, setActiveTab] = useState<TabKey>('profile')

  const [fullName, setFullName] = useState(currentUser.full_name)
  const [phone, setPhone] = useState(currentUser.phone)

  const [orgName, setOrgName] = useState(organization.name)
  const [orgCity, setOrgCity] = useState(organization.city)

  const [staff, setStaff] = useState(staffRows)

  const [prefs, setPrefs] = useState<Record<string, boolean>>({
    task_due: true,
    follow_up_due: true,
    approval_pending: true,
    lead_assigned: true,
    deal_update: false,
    site_visit_reminder: true,
    system: false,
  })

  const visibleTabs = useMemo(() => TABS, [])

  return (
    <TooltipProvider>
      <div className="flex min-h-[calc(100vh-8rem)] flex-col gap-6">
        <PageHeader
          crumbs={[{ label: 'System' }, { label: 'Settings' }]}
          title="Settings"
          description="Manage your organization, team, roles, and platform preferences."
        />

        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Left tab nav */}
          <nav className="flex shrink-0 flex-col gap-1 lg:w-[220px]">
            {visibleTabs.map((tab) => {
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

          {/* Right content panel */}
          <div className="min-w-0 flex-1">
            {activeTab === 'profile' && (
              <div className="flex flex-col gap-5">
                <Card className="rounded-2xl border-border shadow-sm">
                  <CardHeader>
                    <CardTitle className="font-heading text-base font-bold">Profile</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-5">
                    <div className="flex items-center gap-4">
                      <Avatar size="lg" className="size-16">
                        <AvatarFallback className="bg-primary/15 text-lg font-semibold text-primary">
                          {getInitials(currentUser.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <Button variant="outline" size="sm">
                        Change photo
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="flex flex-col gap-1.5">
                        <label htmlFor="full_name" className="text-[12px] font-medium text-foreground/80">
                          Full Name
                        </label>
                        <Input
                          id="full_name"
                          value={fullName}
                          onChange={(event) => setFullName(event.target.value)}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label htmlFor="phone" className="text-[12px] font-medium text-foreground/80">
                          Phone
                        </label>
                        <Input id="phone" value={phone} onChange={(event) => setPhone(event.target.value)} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label htmlFor="username" className="text-[12px] font-medium text-foreground/80">
                          Username
                        </label>
                        <Input id="username" value={currentUser.username} disabled className="text-muted-foreground" />
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
                        <p className="text-[13px] text-foreground/80">{organization.name}</p>
                      </div>
                    </div>

                    <div>
                      <Button size="sm" className="bg-foreground text-background hover:bg-foreground/85">
                        Save Changes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
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
                      <Input id="org_name" value={orgName} onChange={(event) => setOrgName(event.target.value)} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="org_city" className="text-[12px] font-medium text-foreground/80">
                        City
                      </label>
                      <Input id="org_city" value={orgCity} onChange={(event) => setOrgCity(event.target.value)} />
                    </div>
                  </div>
                  <div>
                    <Button size="sm" className="bg-foreground text-background hover:bg-foreground/85">
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
                  <Button size="sm" className="shrink-0 bg-foreground text-background hover:bg-foreground/85">
                    <Plus data-icon="inline-start" />
                    Invite Member
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
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
                      {staff.map((member) => (
                        <tr
                          key={member.id}
                          className="border-b border-border/50 transition-colors last:border-0 hover:bg-muted/40"
                        >
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
                                  member.role === 'manager' || member.role === 'admin'
                                    ? 'bg-primary/10 text-primary'
                                    : 'bg-muted text-muted-foreground',
                                )}
                              >
                                {member.role === 'admin' ? 'Admin' : member.role === 'manager' ? 'Manager' : 'User'}
                              </Badge>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-foreground/80">{member.reports_to ?? '—'}</td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2">
                              <Switch
                                size="sm"
                                checked={member.is_active}
                                onCheckedChange={(checked) =>
                                  setStaff((prev) =>
                                    prev.map((row) => (row.id === member.id ? { ...row, is_active: checked } : row)),
                                  )
                                }
                              />
                              <span className="text-[12px] text-muted-foreground">
                                {member.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button variant="outline" size="sm">
                                Reassign
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger
                                  render={
                                    <Button variant="ghost" size="icon-sm" aria-label="More actions">
                                      <UserCog className="size-4" />
                                    </Button>
                                  }
                                />
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>Edit</DropdownMenuItem>
                                  <DropdownMenuItem>View Activity</DropdownMenuItem>
                                  <DropdownMenuItem variant="destructive">Remove</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )}

            {activeTab === 'integrations' && isAdmin && (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {integrations.map((integration) => {
                    const Icon = integration.icon
                    return (
                      <Card key={integration.key} className="rounded-2xl border-border shadow-sm">
                        <CardContent className="flex flex-col gap-3 pt-4">
                          <div className="flex items-center justify-between">
                            <span
                              className={cn(
                                'flex size-10 items-center justify-center rounded-xl text-white',
                                integration.color,
                              )}
                            >
                              <Icon className="size-5" />
                            </span>
                            <Badge
                              variant="outline"
                              className={cn(
                                'rounded-full border-0 px-2 py-0 text-[10px] font-semibold capitalize',
                                integration.status === 'connected' && 'bg-emerald-500/15 text-emerald-600',
                                integration.status === 'disconnected' && 'bg-muted text-muted-foreground',
                                integration.status === 'error' && 'bg-destructive/10 text-destructive',
                              )}
                            >
                              {integration.status}
                            </Badge>
                          </div>
                          <div>
                            <p className="font-heading text-sm font-bold text-foreground">{integration.name}</p>
                            <Badge variant="outline" className="mt-1 rounded-full border-0 bg-muted text-[11px] text-muted-foreground">
                              {integration.category}
                            </Badge>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => connectIntegration(integration.key)}
                          >
                            Connect
                          </Button>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
                <p className="flex items-center gap-2 rounded-lg bg-muted/50 px-4 py-3 text-[12px] text-muted-foreground">
                  <Shield className="size-4 shrink-0" />
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
                    <Button size="sm" className="bg-foreground text-background hover:bg-foreground/85">
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
                          Download a full CSV export of your organization&apos;s data.
                        </p>
                      </div>
                    </div>
                    <Button variant="destructive" size="sm" className="shrink-0" onClick={exportAllData}>
                      <Download data-icon="inline-start" />
                      Export
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
