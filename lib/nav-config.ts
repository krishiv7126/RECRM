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

export type Role = 'super_admin' | 'admin' | 'manager' | 'user'

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
      { label: 'Analytics', icon: BarChart3, href: '/analytics' },
    ],
  },
  {
    label: 'System',
    groups: [
      { label: 'Inbox', icon: Inbox, href: '/inbox' },
      { label: 'Settings', icon: Settings, href: '/settings' },
    ],
  },
]

export const navByRole: Record<Role, NavSection[]> = {
  super_admin: adminNav,
  admin: adminNav,
  manager: adminNav,
  user: adminNav,
}
