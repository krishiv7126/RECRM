import { Download, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

function getGreeting() {
  const hour = new Date().getHours()
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
        <Button variant="outline" className="rounded-full bg-card">
          <Download data-icon="inline-start" />
          Export
        </Button>
        <Button className="rounded-full">
          <Plus data-icon="inline-start" />
          Create
        </Button>
      </div>
    </div>
  )
}
