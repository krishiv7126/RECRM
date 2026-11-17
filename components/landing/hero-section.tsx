"use client"

import { useEffect, useState } from "react"
import { AnimatedSphere } from "./animated-sphere"
import { DEMO_HREF, SIGN_IN_HREF } from "./site"
import { PillLink } from "./pill-link"

const words = ["close", "nurture", "track", "grow"]

const modules = [
  { value: "Leads", label: "capture, score, assign" },
  { value: "Site visits", label: "schedule and log" },
  { value: "Deals", label: "pipeline to booking" },
  { value: "Inventory", label: "projects and units" },
  { value: "WhatsApp", label: "each agent's own number" },
  { value: "Follow-ups", label: "never miss a callback" },
  { value: "Automation", label: "rules that run themselves" },
  { value: "Analytics", label: "team and revenue" },
]

export function HeroSection() {
  const [isVisible, setIsVisible] = useState(false)
  const [wordIndex, setWordIndex] = useState(0)

  useEffect(() => {
    setIsVisible(true)
    const interval = setInterval(() => setWordIndex((prev) => (prev + 1) % words.length), 2500)
    return () => clearInterval(interval)
  }, [])

  const reveal = isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"

  return (
    <section className="relative flex min-h-screen flex-col justify-center overflow-hidden">
      <div className="pointer-events-none absolute top-1/2 right-0 h-[600px] w-[600px] -translate-y-1/2 opacity-40 lg:h-[800px] lg:w-[800px]">
        <AnimatedSphere />
      </div>

      {/* Subtle grid lines */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-30">
        {[...Array(8)].map((_, i) => (
          <div
            key={`h-${i}`}
            className="absolute right-0 left-0 h-px bg-foreground/10"
            style={{ top: `${12.5 * (i + 1)}%` }}
          />
        ))}
        {[...Array(12)].map((_, i) => (
          <div
            key={`v-${i}`}
            className="absolute top-0 bottom-0 w-px bg-foreground/10"
            style={{ left: `${8.33 * (i + 1)}%` }}
          />
        ))}
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1400px] px-6 pt-32 pb-16 lg:px-12 lg:pt-40 lg:pb-20">
        <div className={`mb-8 transition-all duration-700 ${reveal}`}>
          <span className="inline-flex items-center gap-3 font-mono text-sm text-muted-foreground">
            <span className="h-px w-8 bg-foreground/30" />
            The ERP for real estate brokerages
          </span>
        </div>

        <div className="mb-12">
          <h1
            className={`font-display text-[clamp(3rem,11vw,9rem)] leading-[0.9] tracking-tight transition-all duration-1000 ${
              isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
          >
            <span className="block">Every lead.</span>
            <span className="block">
              Built to{" "}
              <span className="relative inline-block">
                <span key={wordIndex} className="inline-flex">
                  {words[wordIndex].split("").map((char, i) => (
                    <span
                      key={`${wordIndex}-${i}`}
                      className="animate-char-in inline-block"
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      {char}
                    </span>
                  ))}
                </span>
                <span className="absolute right-0 -bottom-2 left-0 h-3 bg-foreground/10" />
              </span>
            </span>
          </h1>
        </div>

        <div className="grid items-end gap-12 lg:grid-cols-2 lg:gap-24">
          <p
            className={`max-w-xl text-xl leading-relaxed text-muted-foreground transition-all delay-200 duration-700 lg:text-2xl ${reveal}`}
          >
            Inquiries, site visits, deals, inventory and WhatsApp in one workspace for your whole
            team, with AI that tells each agent who to call next.
          </p>

          <div className={`flex flex-col items-start gap-4 transition-all delay-300 duration-700 sm:flex-row ${reveal}`}>
            {DEMO_HREF && (
              <PillLink href={DEMO_HREF} arrow>
                Request a demo
              </PillLink>
            )}
            <PillLink href={SIGN_IN_HREF} variant={DEMO_HREF ? "outline" : "solid"} arrow={!DEMO_HREF}>
              Sign in
            </PillLink>
          </div>
        </div>
      </div>

      {/* Module marquee */}
      <div
        className={`relative z-10 pb-12 transition-all delay-500 duration-700 lg:pb-16 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden
      >
        <div className="marquee flex gap-16 whitespace-nowrap">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex gap-16">
              {modules.map((m) => (
                <div key={`${m.value}-${i}`} className="flex items-baseline gap-4">
                  <span className="font-display text-4xl lg:text-5xl">{m.value}</span>
                  <span className="font-mono text-xs text-muted-foreground">{m.label}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
