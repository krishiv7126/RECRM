'use client'

import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CreateLeadDialog } from '@/components/leads/create-lead-dialog'

function getGreeting() {
  // getHours() reads the viewing device's own local hour -- forced to IST
  // here since the business operates in one timezone regardless of where a
  // teammate happens to be viewing from.
  const hour = Number(
    new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', hour: 'numeric', hourCycle: 'h23' }).format(new Date()),
  )
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function GreetingHeader({ fullName }: { fullName: string }) {
  const firstName = fullName.split(' ')[0] || fullName

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-heading text-2xl font-extrabold text-foreground text-balance sm:text-[28px]">
          {getGreeting()}, {firstName} 👋
        </h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Here&apos;s what&apos;s happening across your portfolio today.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <CreateLeadDialog
          trigger={
            <Button className="rounded-full">
              <Plus data-icon="inline-start" />
              Create
            </Button>
          }
        />
      </div>
    </div>
  )
}
