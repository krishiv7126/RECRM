import { PhoneCall } from 'lucide-react'
import { PageHeader } from '@/components/dashboard/page-header'
import { PlaceholderSection } from '@/components/dashboard/placeholder-section'

export default function CallSummaryPage() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col gap-6">
      <PageHeader
        crumbs={[
          { label: 'Intelligence' },
          { label: 'AI Workspace', href: '/ai-workspace' },
          { label: 'Call Summary' },
        ]}
        title="Call Summary"
        description="Transcribed and summarized call recordings with key takeaways."
      />
      <PlaceholderSection
        icon={PhoneCall}
        title="Your call summaries will live here"
        description="Auto-transcribed calls with action items and sentiment — this view is coming soon."
      />
    </div>
  )
}
