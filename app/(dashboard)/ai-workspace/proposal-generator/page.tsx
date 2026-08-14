import { FileSignature } from 'lucide-react'
import { PageHeader } from '@/components/dashboard/page-header'
import { PlaceholderSection } from '@/components/dashboard/placeholder-section'

export default function ProposalGeneratorPage() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col gap-6">
      <PageHeader
        crumbs={[
          { label: 'Intelligence' },
          { label: 'AI Workspace', href: '/ai-workspace' },
          { label: 'Proposal Generator' },
        ]}
        title="Proposal Generator"
        description="Generate polished, ready-to-send proposals from deal and property data."
      />
      <PlaceholderSection
        icon={FileSignature}
        title="Your proposal generator will live here"
        description="Auto-filled proposal documents pulled straight from your CRM data — coming soon."
      />
    </div>
  )
}
