import { Sparkles } from 'lucide-react'
import { PageHeader } from '@/components/dashboard/page-header'
import { PlaceholderSection } from '@/components/dashboard/placeholder-section'

export default function AiCopilotPage() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col gap-6">
      <PageHeader
        crumbs={[
          { label: 'Intelligence' },
          { label: 'AI Workspace', href: '/ai-workspace' },
          { label: 'AI Copilot' },
        ]}
        title="AI Copilot"
        description="Ask questions and get instant answers about your leads, deals, and portfolio."
      />
      <PlaceholderSection
        icon={Sparkles}
        title="Your AI copilot chat will live here"
        description="A conversational assistant with full context on your CRM data is coming soon."
      />
    </div>
  )
}
