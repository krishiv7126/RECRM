import { LineChart } from 'lucide-react'
import { PageHeader } from '@/components/dashboard/page-header'
import { PlaceholderSection } from '@/components/dashboard/placeholder-section'

export default function RevenueForecastPage() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col gap-6">
      <PageHeader
        crumbs={[
          { label: 'Intelligence' },
          { label: 'AI Workspace', href: '/ai-workspace' },
          { label: 'Revenue Forecast' },
        ]}
        title="Revenue Forecast"
        description="AI-projected revenue based on your live pipeline and historical trends."
      />
      <PlaceholderSection
        icon={LineChart}
        title="Your revenue forecast will live here"
        description="Probability-weighted projections across the coming quarters — coming soon."
      />
    </div>
  )
}
