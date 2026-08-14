import { FileText } from 'lucide-react'
import { PageHeader } from '@/components/dashboard/page-header'
import { PlaceholderSection } from '@/components/dashboard/placeholder-section'

export default function CustomerSummaryPage() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col gap-6">
      <PageHeader
        crumbs={[
          { label: 'Intelligence' },
          { label: 'AI Workspace', href: '/ai-workspace' },
          { label: 'Customer Summary' },
        ]}
        title="Customer Summary"
        description="AI-generated summaries of customer history, preferences, and relationship health."
      />
      <PlaceholderSection
        icon={FileText}
        title="Your customer summaries will live here"
        description="Concise, auto-updated briefs on every customer relationship are coming soon."
      />
    </div>
  )
}
