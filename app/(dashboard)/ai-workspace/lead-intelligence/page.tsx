import { UserSearch } from 'lucide-react'
import { PageHeader } from '@/components/dashboard/page-header'
import { PlaceholderSection } from '@/components/dashboard/placeholder-section'

export default function LeadIntelligencePage() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col gap-6">
      <PageHeader
        crumbs={[
          { label: 'Intelligence' },
          { label: 'AI Workspace', href: '/ai-workspace' },
          { label: 'Lead Intelligence' },
        ]}
        title="Lead Intelligence"
        description="AI-driven scoring, intent signals, and next-best-action for every lead."
      />
      <PlaceholderSection
        icon={UserSearch}
        title="Your lead intelligence feed will live here"
        description="Ranked leads with AI scores, buying signals, and recommended actions are coming soon."
      />
    </div>
  )
}
