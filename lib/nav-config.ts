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
  ClipboardPlus,
  ClipboardList,
  MessageCircle,
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
      { label: 'New Inquiry', icon: ClipboardPlus, href: '/inquiries/new' },
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
// dashboard (that's an admin/receptionist front-desk view).
export const managerNav: NavSection[] = withoutGroups(adminNav, ['Automation', 'Approvals', 'Inquiries'])

// User: no Automation, no Analytics (individual contributors don't see org-wide
// reporting), no Approvals, no Inquiries dashboard, no WhatsApp Broadcast
// (mass messaging is a manager/admin action) — but they do get New Inquiry,
// since sales staff are exactly who logs a walk-in/offline inquiry.
export const userNav: NavSection[] = withoutGroups(adminNav, [
  'Automation',
  'Analytics',
  'Approvals',
  'Inquiries',
  'WhatsApp Broadcast',
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
    groups: [
      { label: 'New Inquiry', icon: ClipboardPlus, href: '/inquiries/new' },
      { label: 'Inquiries', icon: ClipboardList, href: '/inquiries' },
    ],
  },
]

export const navByRole: Record<Role, NavSection[]> = {
  super_admin: adminNav,
  admin: adminNav,
  manager: managerNav,
  user: userNav,
  receptionist: receptionistNav,
}
