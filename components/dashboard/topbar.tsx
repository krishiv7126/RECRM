'use client'

import { Bell, PanelLeft, Plus, Search, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Kbd } from '@/components/ui/kbd'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { notifications } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

export function DashboardTopbar({
  onToggleSidebar,
}: {
  onToggleSidebar: () => void
}) {
  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background/80 px-5 backdrop-blur-sm">
      <Button variant="ghost" size="icon" onClick={onToggleSidebar} aria-label="Toggle sidebar">
        <PanelLeft />
      </Button>

      <div className="relative w-full max-w-sm">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search leads, customers, properties…"
          className="h-9 rounded-full border-border bg-card pl-8 pr-14 text-[13px]"
        />
        <Kbd className="absolute right-2 top-1/2 -translate-y-1/2">⌘K</Kbd>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button variant="secondary" className="rounded-full bg-secondary text-foreground hover:bg-secondary/80">
          <Sparkles data-icon="inline-start" className="text-primary" />
          Ask AI
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
                <Bell />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-danger text-[10px] font-semibold text-white">
                    {unreadCount}
                  </span>
                )}
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.map((n) => (
                <DropdownMenuItem key={n.title} className="flex flex-col items-start gap-0.5 py-2">
                  <span className="flex w-full items-center gap-2">
                    <span
                      className={cn(
                        'size-1.5 shrink-0 rounded-full',
                        n.is_read ? 'bg-transparent' : 'bg-primary',
                      )}
                    />
                    <span className="truncate text-[13px] font-medium text-foreground">{n.title}</span>
                  </span>
                  <span className="pl-3.5 text-[12px] text-muted-foreground">{n.body}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button className="rounded-full">
          <Plus data-icon="inline-start" />
          New Lead
        </Button>
      </div>
    </header>
  )
}
