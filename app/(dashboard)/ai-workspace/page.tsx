'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowUp,
  CheckCircle2,
  FileSignature,
  FileText,
  LineChart,
  Mail,
  PhoneCall,
  PhoneOutgoing,
  Sparkles,
  UserSearch,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { PageHeader } from '@/components/dashboard/page-header'
import { Badge } from '@/components/ui/badge'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupTextarea } from '@/components/ui/input-group'

const suggestedPrompts = [
  'Show me hot leads with budget above ₹2Cr',
  "Summarize today's sales performance",
  'Draft WhatsApp follow-up for Marina Bay visitors',
  'Which deals are at risk this month?',
  'Generate proposal for 3BHK in Bandra',
]

interface PlannerStat {
  label: string
  value: string
  hint: string
  icon: LucideIcon
}

const plannerStats: PlannerStat[] = [
  { label: 'Priority Leads', value: '5', hint: 'Call before noon', icon: Users },
  { label: 'Calls Planned', value: '12', hint: '3 high-intent', icon: PhoneOutgoing },
  { label: 'Meetings', value: '4', hint: '2 closing calls', icon: FileSignature },
  { label: 'Follow-ups', value: '6', hint: 'Auto-drafted', icon: Mail },
]

interface Capability {
  label: string
  description: string
  href: string
  icon: LucideIcon
}

const capabilities: Capability[] = [
  {
    label: 'AI Lead Intelligence',
    description: 'Auto-score leads by intent, urgency & closing probability',
    href: '/ai-workspace/lead-intelligence',
    icon: UserSearch,
  },
  {
    label: 'AI Customer Summary',
    description: 'Generate 360° summaries from calls, emails & visits',
    href: '/ai-workspace/customer-summary',
    icon: FileText,
  },
  {
    label: 'AI Call Summary',
    description: 'Transcript, sentiment, objections and action items',
    href: '/ai-workspace/call-summary',
    icon: PhoneCall,
  },
  {
    label: 'AI Email Generator',
    description: 'Draft personalized follow-up emails in seconds',
    href: '/ai-workspace/email-generator',
    icon: Mail,
  },
  {
    label: 'AI Proposal Generator',
    description: 'Create tailored property proposals instantly',
    href: '/ai-workspace/proposal-generator',
    icon: FileSignature,
  },
  {
    label: 'AI Revenue Forecast',
    description: 'Predict monthly bookings from pipeline data',
    href: '/ai-workspace/revenue-forecast',
    icon: LineChart,
  },
]

export default function AiWorkspacePage() {
  const router = useRouter()
  const [message, setMessage] = useState('')

  function goToCopilot(text: string) {
    if (!text.trim()) return
    router.push(`/ai-workspace/copilot?q=${encodeURIComponent(text.trim())}`)
  }

  function handleSend() {
    goToCopilot(message)
    setMessage('')
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        crumbs={[{ label: 'Intelligence' }, { label: 'AI Workspace' }]}
        title="AI Workspace"
        description="Your intelligent co-pilot for real estate operations"
      />

      <div className="relative isolate overflow-hidden rounded-2xl bg-gradient-to-br from-foreground via-foreground to-primary p-6 sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-primary/40 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-28 left-10 size-64 rounded-full bg-white/10 blur-3xl"
        />

        <div className="relative flex flex-col gap-5">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-white/15">
              <Sparkles className="size-4 text-white" />
            </div>
            <span className="font-heading text-[11px] font-bold uppercase tracking-wide text-white/80">
              AI Copilot
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <h2 className="max-w-xl font-heading text-2xl font-extrabold text-white text-balance sm:text-3xl">
              How can I help you today?
            </h2>
            <p className="max-w-xl text-[14px] leading-relaxed text-white/75 text-pretty">
              Ask about leads, deals, forecasts, or draft a message
            </p>
          </div>

          <InputGroup className="h-auto rounded-2xl border-white/20 bg-white/10 backdrop-blur-sm">
            <InputGroupTextarea
              placeholder="Ask anything…"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                  event.preventDefault()
                  handleSend()
                }
              }}
              className="min-h-20 text-[14px] text-white placeholder:text-white/50"
            />
            <InputGroupAddon align="block-end" className="justify-end">
              <InputGroupButton
                size="icon-sm"
                className="rounded-full bg-white text-foreground hover:bg-white/90"
                onClick={handleSend}
                aria-label="Send"
              >
                <ArrowUp />
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>

          <div className="flex flex-wrap gap-2">
            {suggestedPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => goToCopilot(prompt)}
                className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[12px] font-medium text-white/90 transition-colors hover:bg-white/20"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-3 font-heading text-base font-bold text-foreground">AI Daily Planner</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {plannerStats.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm"
            >
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                <stat.icon className="size-4.5 text-primary" />
              </div>
              <div>
                <p className="font-heading text-2xl font-extrabold text-foreground">{stat.value}</p>
                <p className="text-[13px] font-medium text-foreground/80">{stat.label}</p>
                <p className="mt-0.5 text-[12px] text-muted-foreground">{stat.hint}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-3 font-heading text-base font-bold text-foreground">AI Capabilities</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {capabilities.map((capability) => (
            <Link
              key={capability.href}
              href={capability.href}
              className="group flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm transition-colors hover:border-primary/40"
            >
              <div className="flex items-center justify-between">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                  <capability.icon className="size-5 text-primary" />
                </div>
                <Badge className="gap-1 rounded-full border-0 bg-emerald-500/10 text-emerald-600">
                  <CheckCircle2 className="size-3" />
                  Active
                </Badge>
              </div>
              <div>
                <p className="font-heading text-[15px] font-bold text-foreground">{capability.label}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                  {capability.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
