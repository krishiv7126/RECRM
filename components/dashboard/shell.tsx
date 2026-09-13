'use client'

import { useState } from 'react'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { DashboardTopbar } from '@/components/dashboard/topbar'
import { SessionWatchdog } from '@/components/dashboard/session-watchdog'
import { FloatingInquiryButton } from '@/components/dashboard/floating-inquiry-button'
import { applyNavOverrides, navByRole, type Role } from '@/lib/nav-config'

export function DashboardShell({
  role,
  fullName,
  city,
  navOverrides,
  children,
}: {
  role: Role
  fullName: string
  city: string | null
  navOverrides?: Record<string, boolean> | null
  children: React.ReactNode
}) {
  const sections = applyNavOverrides(navByRole[role], navOverrides)
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
        sections={sections}
        fullName={fullName}
        city={city}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="flex min-h-screen flex-1 flex-col overflow-x-hidden">
        <DashboardTopbar onToggleSidebar={toggleSidebar} />
        <main className="flex-1 px-4 py-6 sm:px-6 md:px-8">{children}</main>
      </div>
      <FloatingInquiryButton />
    </div>
  )
}
