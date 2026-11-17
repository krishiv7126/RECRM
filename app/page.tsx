import type { Metadata } from "next"
import { Instrument_Serif, JetBrains_Mono } from "next/font/google"
import { Navigation } from "@/components/landing/navigation"
import { HeroSection } from "@/components/landing/hero-section"
import { FeaturesSection } from "@/components/landing/features-section"
import { HowItWorksSection } from "@/components/landing/how-it-works-section"
import { ModulesSection } from "@/components/landing/modules-section"
import { AiSection } from "@/components/landing/ai-section"
import { SecuritySection } from "@/components/landing/security-section"
import { CtaSection } from "@/components/landing/cta-section"
import { FooterSection } from "@/components/landing/footer-section"

// Landing-only typefaces; the app itself keeps Manrope/Inter from the root layout.
const display = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-landing-display",
})

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-landing-mono",
})

export const metadata: Metadata = {
  title: { absolute: "Vardaan ERP · The real estate ERP for brokerages" },
  description:
    "Leads, site visits, deals, inventory and WhatsApp in one workspace for your whole brokerage, with AI that tells each agent who to call next.",
}

export default function Home() {
  return (
    <main className={`landing noise-overlay relative min-h-screen overflow-x-hidden ${display.variable} ${mono.variable}`}>
      <Navigation />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <ModulesSection />
      <AiSection />
      <SecuritySection />
      <CtaSection />
      <FooterSection />
    </main>
  )
}
