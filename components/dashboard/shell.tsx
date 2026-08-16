'use client'

import { useState } from 'react'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { DashboardTopbar } from '@/components/dashboard/topbar'
import { SessionWatchdog } from '@/components/dashboard/session-watchdog'
import { navByRole, type Role } from '@/lib/nav-config'

export function DashboardShell({
  role,
  children,
}: {
  role: Role
  children: React.ReactNode
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  function toggleSidebar() {
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      setCollapsed((v) => !v)
    } else {
      setMobileOpen((v) => !v)
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <SessionWatchdog />
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}
      <DashboardSidebar
        sections={navByRole[role]}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="flex min-h-screen flex-1 flex-col overflow-x-hidden">
        <DashboardTopbar onToggleSidebar={toggleSidebar} />
        <main className="flex-1 px-4 py-6 sm:px-6 md:px-8">{children}</main>
      </div>
    </div>
  )
}
