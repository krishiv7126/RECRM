import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  Users,
  UserRound,
  Handshake,
  PhoneCall,
  Building2,
  FolderKanban,
  CalendarCheck,
  Bot,
  Sparkles,
  UserSearch,
  FileText,
  Mail,
  FileSignature,
  LineChart,
  Workflow,
  BarChart3,
  Inbox,
  Settings,
  ShieldCheck,
  ClipboardList,
  MessageCircle,
  UserCog,
} from 'lucide-react'

export interface NavLeaf {
  label: string
  href: string
  icon?: LucideIcon
}

export interface NavGroup {
  label: string
  icon: LucideIcon
  href?: string
  items?: NavLeaf[]
}

export interface NavSection {
  label: string
  groups: NavGroup[]
}

export type Role = 'super_admin' | 'admin' | 'manager' | 'user' | 'receptionist'

export const adminNav: NavSection[] = [
  {
    label: 'Overview',
    groups: [{ label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' }],
  },
  {
    label: 'Sales',
    groups: [
      {
        label: 'Pipeline',
        icon: Handshake,
        items: [
          { label: 'Leads', href: '/leads', icon: Users },
          { label: 'Customers', href: '/customers', icon: UserRound },
          { label: 'Deals', href: '/deals', icon: Handshake },
          { label: 'Follow-ups', href: '/follow-ups', icon: PhoneCall },
        ],
      },
      {
        label: 'Inventory',
        icon: Building2,
        items: [
          { label: 'Properties', href: '/properties', icon: Building2 },
          { label: 'Projects', href: '/projects', icon: FolderKanban },
          { label: 'Site Visits', href: '/site-visits', icon: CalendarCheck },
        ],
      },
      { label: 'Inquiries', icon: ClipboardList, href: '/inquiries' },
    ],
  },
  {
    label: 'Intelligence',
    groups: [
      {
        label: 'AI Workspace',
        icon: Bot,
        href: '/ai-workspace',
        items: [
          { label: 'AI Copilot', href: '/ai-workspace/copilot', icon: Sparkles },
          { label: 'Lead Intelligence', href: '/ai-workspace/lead-intelligence', icon: UserSearch },
          { label: 'Customer Summary', href: '/ai-workspace/customer-summary', icon: FileText },
          { label: 'Call Summary', href: '/ai-workspace/call-summary', icon: PhoneCall },
          { label: 'Email Generator', href: '/ai-workspace/email-generator', icon: Mail },
          { label: 'Proposal Generator', href: '/ai-workspace/proposal-generator', icon: FileSignature },
          { label: 'Revenue Forecast', href: '/ai-workspace/revenue-forecast', icon: LineChart },
        ],
      },
      { label: 'Automation', icon: Workflow, href: '/automation' },
      { label: 'WhatsApp Broadcast', icon: MessageCircle, href: '/whatsapp-broadcast' },
      { label: 'Analytics', icon: BarChart3, href: '/analytics' },
    ],
  },
  {
    label: 'System',
    groups: [
      { label: 'Staff', icon: UserCog, href: '/staff' },
      { label: 'Inbox', icon: Inbox, href: '/inbox' },
      { label: 'Approvals', icon: ShieldCheck, href: '/approvals' },
      { label: 'Settings', icon: Settings, href: '/settings' },
    ],
  },
]

function withoutGroups(sections: NavSection[], labelsToRemove: string[]): NavSection[] {
  return sections
    .map((section) => ({
      ...section,
      groups: section.groups.filter((group) => !labelsToRemove.includes(group.label)),
    }))
    .filter((section) => section.groups.length > 0)
}

// Manager: no Automation (workflow rules are an org-level admin concern), no
// Approvals (only admins decide manager/user login approvals), no Inquiries
// dashboard (that's an admin/receptionist front-desk view), no Staff (org-wide
// performance + access control is an admin-only concern).
export const managerNav: NavSection[] = withoutGroups(adminNav, ['Automation', 'Approvals', 'Inquiries', 'Staff'])

// User: no Automation, no Analytics (individual contributors don't see org-wide
// reporting), no Approvals, no Inquiries dashboard, no WhatsApp Broadcast
// (mass messaging is a manager/admin action), no Staff. New Inquiry itself
// isn't a nav item — it's the floating action button, shown to every role.
export const userNav: NavSection[] = withoutGroups(adminNav, [
  'Automation',
  'Analytics',
  'Approvals',
  'Inquiries',
  'WhatsApp Broadcast',
  'Staff',
])

// Receptionist: a narrow, front-desk-only role — not derived from adminNav
// since it needs to exclude nearly everything rather than a few groups.
export const receptionistNav: NavSection[] = [
  {
    label: 'Overview',
    groups: [{ label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' }],
  },
  {
    label: 'Front Desk',
    groups: [{ label: 'Inquiries', icon: ClipboardList, href: '/inquiries' }],
  },
]

export const navByRole: Record<Role, NavSection[]> = {
  super_admin: adminNav,
  admin: adminNav,
  manager: managerNav,
  user: userNav,
  receptionist: receptionistNav,
}

/**
 * Every togglable group, for the admin "manage access" UI. Staff is
 * excluded — it's hard-gated to admin/super_admin in the page itself, so
 * granting it via override would show a nav link that 404s into a redirect.
 */
export const allNavGroupLabels: string[] = adminNav
  .flatMap((section) => section.groups.map((g) => g.label))
  .filter((label) => label !== 'Staff')

/** A group and its sub-pages, for rendering per-leaf toggles under a group. */
export interface AccessGroup {
  label: string
  items: string[]
}

/** Every group that has sub-pages, for the "manage access" detailed view. */
export const allNavAccessGroups: AccessGroup[] = adminNav
  .flatMap((section) => section.groups)
  .filter((g) => g.label !== 'Staff' && (g.items?.length ?? 0) > 0)
  .map((g) => ({ label: g.label, items: (g.items ?? []).map((i) => i.label) }))

// (href prefix, owning group label) pairs, longest hrefs first so a more
// specific route (e.g. /ai-workspace/copilot) matches before its parent
// (/ai-workspace) would.
const pathToGroupLabel: [string, string][] = adminNav
  .flatMap((section) => section.groups)
  .flatMap((group) => {
    const hrefs = [group.href, ...(group.items?.map((i) => i.href) ?? [])].filter((h): h is string => !!h)
    return hrefs.map((href) => [href, group.label] as [string, string])
  })
  .sort((a, b) => b[0].length - a[0].length)

/** Which nav group "owns" a pathname, for middleware-level access checks. */
export function groupLabelForPath(pathname: string): string | null {
  const match = pathToGroupLabel.find(([href]) => pathname === href || pathname.startsWith(href + '/'))
  return match?.[1] ?? null
}

interface AccessTarget {
  groupLabel: string
  leafLabel: string | null
}

// Same idea as pathToGroupLabel, but resolves to the specific leaf (sub-page)
// under a group when the path is one, so leaf-level overrides can be checked
// without a separate lookup.
const pathToAccessTarget: [string, AccessTarget][] = adminNav
  .flatMap((section) => section.groups)
  .flatMap((group) => {
    const entries: [string, AccessTarget][] = []
    if (group.href) entries.push([group.href, { groupLabel: group.label, leafLabel: null }])
    for (const item of group.items ?? []) {
      entries.push([item.href, { groupLabel: group.label, leafLabel: item.label }])
    }
    return entries
  })
  .sort((a, b) => b[0].length - a[0].length)

function accessTargetForPath(pathname: string): AccessTarget | null {
  const match = pathToAccessTarget.find(([href]) => pathname === href || pathname.startsWith(href + '/'))
  return match?.[1] ?? null
}

/**
 * Whether a pathname is reachable under a role's nav plus per-user overrides,
 * checking the specific sub-page override (not just the parent group) when
 * the path is one. Paths outside the togglable nav (e.g. /dashboard) are
 * always allowed here — callers gate those separately.
 */
export function isPathAllowed(
  pathname: string,
  role: Role,
  overrides: Record<string, boolean> | null | undefined,
): boolean {
  const target = accessTargetForPath(pathname)
  if (!target) return true

  const effectiveSections = applyNavOverrides(navByRole[role] ?? navByRole.user, overrides)
  const group = effectiveSections.flatMap((s) => s.groups).find((g) => g.label === target.groupLabel)
  if (!group) return false
  if (!target.leafLabel) return true
  return (group.items ?? []).some((item) => item.label === target.leafLabel)
}

function findGroupInAdminNav(label: string): { section: NavSection; group: NavGroup } | null {
  for (const section of adminNav) {
    const group = section.groups.find((g) => g.label === label)
    if (group) return { section, group }
  }
  return null
}

function findLeafInAdminNav(label: string): NavLeaf | null {
  for (const section of adminNav) {
    for (const group of section.groups) {
      const item = group.items?.find((i) => i.label === label)
      if (item) return item
    }
  }
  return null
}

/**
 * Per-user overrides on top of the role default, set by an admin in Settings
 * → Team Management. `true` grants a page the role wouldn't normally show;
 * `false` revokes one it would. Absent keys fall through to the role default.
 * Overrides share one flat namespace of group labels and leaf (sub-page)
 * labels — the two never collide, so a single lookup by key works for both.
 */
export function applyNavOverrides(baseSections: NavSection[], overrides: Record<string, boolean> | null | undefined): NavSection[] {
  if (!overrides || Object.keys(overrides).length === 0) return baseSections

  let sections: NavSection[] = baseSections.map((s) => ({
    ...s,
    groups: s.groups.map((g) => ({ ...g, items: g.items ? [...g.items] : g.items })),
  }))

  for (const [label, allowed] of Object.entries(overrides)) {
    const alreadyHasGroup = sections.some((s) => s.groups.some((g) => g.label === label))

    if (allowed === false && alreadyHasGroup) {
      sections = sections
        .map((s) => ({ ...s, groups: s.groups.filter((g) => g.label !== label) }))
        .filter((s) => s.groups.length > 0)
    }

    if (allowed === true && !alreadyHasGroup) {
      const found = findGroupInAdminNav(label)
      if (!found) continue
      const targetIndex = sections.findIndex((s) => s.label === found.section.label)
      if (targetIndex >= 0) {
        sections[targetIndex] = { ...sections[targetIndex], groups: [...sections[targetIndex].groups, found.group] }
      } else {
        sections = [...sections, { ...found.section, groups: [found.group] }]
      }
    }
  }

  // Second pass: leaf-level overrides within whatever groups survived above.
  // A leaf can only be added into a group that's already present — granting
  // a sub-page of a group the role/overrides don't otherwise show would leave
  // it with nowhere to render.
  for (const [label, allowed] of Object.entries(overrides)) {
    sections = sections.map((s) => ({
      ...s,
      groups: s.groups.map((g) => {
        if (!g.items) return g
        const alreadyHasItem = g.items.some((i) => i.label === label)

        if (allowed === false && alreadyHasItem) {
          return { ...g, items: g.items.filter((i) => i.label !== label) }
        }
        if (allowed === true && !alreadyHasItem) {
          const leaf = findLeafInAdminNav(label)
          if (leaf && findGroupInAdminNav(g.label)?.group.items?.some((i) => i.label === label)) {
            return { ...g, items: [...g.items, leaf] }
          }
        }
        return g
      }),
    }))
  }

  // Drop groups whose sub-pages were all revoked and that have no hub page
  // of their own to fall back to — nothing left in them to click.
  sections = sections
    .map((s) => ({ ...s, groups: s.groups.filter((g) => !(g.items && g.items.length === 0 && !g.href)) }))
    .filter((s) => s.groups.length > 0)

  return sections
}
