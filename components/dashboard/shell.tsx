'use client'

import { useState } from 'react'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { DashboardTopbar } from '@/components/dashboard/topbar'
import { navByRole, type Role } from '@/lib/nav-config'

export function DashboardShell({
  role,
  children,
}: {
  role: Role
  children: React.ReactNode
}) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar sections={navByRole[role]} collapsed={collapsed} />
      <div className="flex min-h-screen flex-1 flex-col">
        <DashboardTopbar onToggleSidebar={() => setCollapsed((v) => !v)} />
        <main className="flex-1 px-6 py-6 md:px-8">{children}</main>
      </div>
    </div>
  )
}
