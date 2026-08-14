import { Mail } from 'lucide-react'
import { PageHeader } from '@/components/dashboard/page-header'
import { PlaceholderSection } from '@/components/dashboard/placeholder-section'

export default function EmailGeneratorPage() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col gap-6">
      <PageHeader
        crumbs={[
          { label: 'Intelligence' },
          { label: 'AI Workspace', href: '/ai-workspace' },
          { label: 'Email Generator' },
        ]}
        title="Email Generator"
        description="Draft personalized, on-brand emails for any lead or customer in seconds."
      />
      <PlaceholderSection
        icon={Mail}
        title="Your email generator will live here"
        description="Context-aware drafts ready to review and send — this view is coming soon."
      />
    </div>
  )
}
