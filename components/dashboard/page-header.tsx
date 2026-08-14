import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export interface Crumb {
  label: string
  href?: string
}

export function PageHeader({
  crumbs,
  title,
  description,
}: {
  crumbs: Crumb[]
  title: string
  description?: string
}) {
  return (
    <div className="flex flex-col gap-2">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
        {crumbs.map((crumb, i) => (
          <span key={crumb.label} className="flex items-center gap-1.5">
            {crumb.href ? (
              <Link href={crumb.href} className="transition-colors hover:text-foreground">
                {crumb.label}
              </Link>
            ) : (
              <span className={i === crumbs.length - 1 ? 'font-medium text-foreground' : undefined}>
                {crumb.label}
              </span>
            )}
            {i < crumbs.length - 1 && <ChevronRight className="size-3" aria-hidden />}
          </span>
        ))}
      </nav>
      <div>
        <h1 className="font-heading text-2xl font-extrabold text-foreground text-balance sm:text-[28px]">
          {title}
        </h1>
        {description && <p className="mt-1 text-[13px] text-muted-foreground">{description}</p>}
      </div>
    </div>
  )
}
