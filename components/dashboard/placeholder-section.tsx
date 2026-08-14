import type { LucideIcon } from 'lucide-react'

export function PlaceholderSection({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon
  title: string
  description: string
}) {
  return (
    <div className="flex min-h-[420px] flex-1 items-center justify-center rounded-2xl border border-border bg-card">
      <div className="flex max-w-sm flex-col items-center gap-4 px-6 py-16 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10">
          <Icon className="size-6 text-primary" />
        </div>
        <div className="flex flex-col gap-1.5">
          <h2 className="font-heading text-lg font-bold text-foreground">{title}</h2>
          <p className="text-[13px] leading-relaxed text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  )
}
