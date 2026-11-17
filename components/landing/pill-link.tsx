import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

/** Rounded CTA link used across the landing page (a link, not a <button>). */
export function PillLink({
  href,
  children,
  variant = "solid",
  arrow = false,
  className,
  onClick,
}: {
  href: string
  children: React.ReactNode
  variant?: "solid" | "outline"
  arrow?: boolean
  className?: string
  onClick?: () => void
}) {
  const external = !href.startsWith("/") && !href.startsWith("#")
  const classes = cn(
    "group inline-flex h-14 items-center justify-center gap-2 rounded-full px-8 text-base font-medium transition-colors",
    variant === "solid"
      ? "bg-foreground text-background hover:bg-foreground/90"
      : "border border-foreground/20 text-foreground hover:bg-foreground/5",
    className,
  )
  const content = (
    <>
      {children}
      {arrow && <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />}
    </>
  )

  if (external) {
    const web = href.startsWith("http")
    return (
      <a
        href={href}
        className={classes}
        onClick={onClick}
        {...(web ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {content}
      </a>
    )
  }
  return (
    <Link href={href} className={classes} onClick={onClick}>
      {content}
    </Link>
  )
}
