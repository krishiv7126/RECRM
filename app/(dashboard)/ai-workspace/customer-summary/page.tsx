'use client'

import { useState } from 'react'
import { FileText } from 'lucide-react'
import { PageHeader } from '@/components/dashboard/page-header'
import { SelectField } from '@/components/ai-workspace/select-field'
import { AiResult } from '@/components/ai-workspace/ai-result'
import { AiGenerateButton, AiToolCard } from '@/components/ai-workspace/ai-tool-card'
import { useAiGenerate } from '@/lib/ai-workspace/use-ai-generate'
import { useCustomers } from '@/lib/ai-workspace/use-pickable'

export default function CustomerSummaryPage() {
  const { customers, loading: loadingCustomers } = useCustomers()
  const [customerId, setCustomerId] = useState('')
  const { output, loading, error, generate } = useAiGenerate()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        crumbs={[
          { label: 'Intelligence' },
          { label: 'AI Workspace', href: '/ai-workspace' },
          { label: 'AI Customer Summary' },
        ]}
        title="AI Customer Summary"
        description="Generate a 360° summary from a customer's profile, deals, and site visits."
      />

      <AiToolCard
        phase={loading ? 'thinking' : customerId ? 'listening' : 'idle'}
        title={loading ? 'Reading customer history…' : 'Summarize a customer'}
        subtitle={
          loading
            ? 'Going through their profile, deals, and site visits.'
            : 'Pick a customer to get their full 360° picture.'
        }
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-3">
          <div className="flex-1">
            <SelectField
              label="Customer"
              value={customerId}
              onChange={setCustomerId}
              disabled={loadingCustomers}
              placeholder={loadingCustomers ? 'Loading customers…' : 'Select a customer'}
              options={customers.map((c) => ({
                value: c.id,
                label: c.phone ? `${c.full_name} (${c.phone})` : c.full_name,
              }))}
            />
          </div>
          <AiGenerateButton
            loading={loading}
            disabled={!customerId}
            onClick={() => generate({ type: 'customer_summary', customer_id: customerId })}
            icon={FileText}
            label="Generate Summary"
            loadingLabel="Summarizing…"
          />
        </div>
      </AiToolCard>

      <AiResult output={output} loading={loading} error={error} loadingLabel="Reading customer history…" />
    </div>
  )
}
