'use client'

import { FileText } from 'lucide-react'
import { PageHeader } from '@/components/dashboard/page-header'
import { Button } from '@/components/ui/button'
import { SelectField } from '@/components/ai-workspace/select-field'
import { AiResult } from '@/components/ai-workspace/ai-result'
import { useAiGenerate } from '@/lib/ai-workspace/use-ai-generate'
import { useCustomers } from '@/lib/ai-workspace/use-pickable'
import { useState } from 'react'

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

      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-end sm:gap-3">
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
        <Button
          disabled={!customerId || loading}
          onClick={() => generate({ type: 'customer_summary', customer_id: customerId })}
        >
          <FileText data-icon="inline-start" />
          Generate Summary
        </Button>
      </div>

      <AiResult output={output} loading={loading} error={error} loadingLabel="Reading customer history…" />
    </div>
  )
}
