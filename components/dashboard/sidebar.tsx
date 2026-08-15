'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ChevronDown, Home } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import type { NavSection } from '@/lib/nav-config'
import { currentUser, organization } from '@/lib/mock-data'
import { useRole } from '@/lib/role-context'

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

const roleLabels: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  manager: 'Manager',
  user: 'User',
}

export function DashboardSidebar({
  sections,
  collapsed,
  mobileOpen,
  onCloseMobile,
}: {
  sections: NavSection[]
  collapsed: boolean
  mobileOpen: boolean
  onCloseMobile: () => void
}) {
  const pathname = usePathname()
  const role = useRole()

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 flex h-screen w-62 shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-200',
        'md:sticky md:top-0 md:translate-x-0 md:transition-[width]',
        mobileOpen ? 'translate-x-0' : '-translate-x-full',
        collapsed ? 'md:w-[76px]' : 'md:w-62',
      )}
    >
      <div className="flex h-16 shrink-0 items-center gap-3 px-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-foreground text-sm font-heading font-extrabold text-white">
          E
        </div>
        {!collapsed && (
          <div className="flex flex-col leading-none">
            <span className="font-heading text-[15px] font-extrabold text-sidebar-foreground">
              Estatly
            </span>
            <span className="text-[11px] text-muted-foreground">Real Estate CRM</span>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {sections.map((section) => (
          <div key={section.label} className="mb-5">
            {!collapsed && (
              <p className="mb-1.5 px-2.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                {section.label}
              </p>
            )}
            <div className="flex flex-col gap-0.5">
              {section.groups.map((group) =>
                group.items ? (
                  <NavGroupItem
                    key={group.label}
                    group={group}
                    pathname={pathname}
                    collapsed={collapsed}
                  />
                ) : (
                  <NavLink
                    key={group.label}
                    href={group.href ?? '#'}
                    icon={group.icon}
                    label={group.label}
                    active={pathname === group.href}
                    collapsed={collapsed}
                  />
                ),
              )}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-2.5 rounded-xl bg-sidebar-accent p-2.5">
          <Avatar className="size-9 shrink-0">
            <AvatarFallback className="bg-primary font-heading text-xs font-bold text-primary-foreground">
              {initials(currentUser.full_name)}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-[13px] font-semibold text-sidebar-foreground">
                {currentUser.full_name}
              </span>
              <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Badge
                  variant="secondary"
                  className="h-4.5 rounded-full bg-primary/15 px-1.5 text-[10px] text-primary"
                >
                  {roleLabels[role]}
                </Badge>
                <span className="truncate">{organization.city} HQ</span>
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}

function NavLink({
  href,
  icon: Icon,
  label,
  active,
  collapsed,
  nested,
}: {
  href: string
  icon?: typeof Home
  label: string
  active?: boolean
  collapsed?: boolean
  nested?: boolean
}) {
  const content = (
    <>
      {Icon && (
        <Icon
          className={cn('size-4 shrink-0', active ? 'text-primary' : 'text-muted-foreground')}
        />
      )}
      {!collapsed && <span className="truncate">{label}</span>}
    </>
  )

  const className = cn(
    'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors',
    nested && !collapsed && 'py-1.5 pl-9',
    active
      ? 'bg-primary/15 text-primary'
      : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground',
  )

  return (
    <Link href={href} className={className}>
      {content}
    </Link>
  )
}

function NavGroupItem({
  group,
  pathname,
  collapsed,
}: {
  group: NavSection['groups'][number]
  pathname: string
  collapsed: boolean
}) {
  const hasActiveChild = Boolean(group.items?.some((item) => item.href === pathname))
  const isHubActive = group.href === pathname
  const [open, setOpen] = useState(hasActiveChild)
  const Icon = group.icon

  useEffect(() => {
    if (hasActiveChild) setOpen(true)
  }, [hasActiveChild])

  if (collapsed) {
    return (
      <div className="flex items-center justify-center rounded-lg px-2.5 py-2 text-muted-foreground">
        <Icon className="size-4" />
      </div>
    )
  }

  const labelRow = group.href ? (
    <Link
      href={group.href}
      className={cn(
        'flex flex-1 items-center gap-2.5 truncate rounded-lg py-2 text-left text-[13px] font-medium transition-colors',
        isHubActive ? 'text-primary' : 'text-sidebar-foreground/80 hover:text-sidebar-foreground',
      )}
    >
      <Icon className={cn('size-4 shrink-0', isHubActive ? 'text-primary' : 'text-muted-foreground')} />
      <span className="flex-1 truncate">{group.label}</span>
    </Link>
  ) : (
    <span className="flex flex-1 items-center gap-2.5 truncate py-2 text-left text-[13px] font-medium text-sidebar-foreground/80">
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <span className="flex-1 truncate">{group.label}</span>
    </span>
  )

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div
        className={cn(
          'flex items-center gap-1 rounded-lg pl-2.5 pr-1 transition-colors',
          isHubActive ? 'bg-primary/15' : 'hover:bg-sidebar-accent',
        )}
      >
        {labelRow}
        <CollapsibleTrigger className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent-foreground/10">
          <ChevronDown className={cn('size-3.5 shrink-0 transition-transform', open && 'rotate-180')} />
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="flex flex-col gap-0.5 pt-0.5">
        {group.items?.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            active={pathname === item.href}
            nested
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  )
}
