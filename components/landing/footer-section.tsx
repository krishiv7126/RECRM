import Link from "next/link"
import { AnimatedWave } from "./animated-wave"
import { BRAND, DEMO_HREF, SIGN_IN_HREF } from "./site"

const footerLinks: Record<string, { name: string; href: string }[]> = {
  Product: [
    { name: "Features", href: "#features" },
    { name: "How it works", href: "#how-it-works" },
    { name: "Modules", href: "#modules" },
    { name: "AI workspace", href: "#ai" },
  ],
  More: [
    { name: "Security", href: "#security" },
    ...(DEMO_HREF ? [{ name: "Request a demo", href: DEMO_HREF }] : []),
    { name: "Sign in", href: SIGN_IN_HREF },
  ],
}

export function FooterSection() {
  return (
    <footer className="relative border-t border-foreground/10">
      <div className="pointer-events-none absolute inset-0 h-64 overflow-hidden opacity-20">
        <AnimatedWave />
      </div>

      <div className="relative z-10 mx-auto max-w-[1400px] px-6 lg:px-12">
        <div className="py-16 lg:py-24">
          <div className="grid grid-cols-2 gap-12 md:grid-cols-4 lg:gap-8">
            <div className="col-span-2">
              <a href="#" className="mb-6 inline-flex items-center gap-2">
                <span className="font-display text-2xl">{BRAND}</span>
              </a>
              <p className="max-w-xs leading-relaxed text-muted-foreground">
                The real estate ERP for brokerages: leads, site visits, deals, inventory and
                WhatsApp in one place.
              </p>
            </div>

            {Object.entries(footerLinks).map(([title, links]) => (
              <div key={title}>
                <h3 className="mb-6 text-sm font-medium">{title}</h3>
                <ul className="space-y-4">
                  {links.map((link) => (
                    <li key={link.name}>
                      {link.href.startsWith("/") ? (
                        <Link
                          href={link.href}
                          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                        >
                          {link.name}
                        </Link>
                      ) : (
                        <a
                          href={link.href}
                          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                        >
                          {link.name}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-foreground/10 py-8 md:flex-row">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {BRAND}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
