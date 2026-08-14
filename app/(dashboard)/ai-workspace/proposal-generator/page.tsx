'use client'

import { useState } from 'react'
import { FileSignature } from 'lucide-react'
import { PageHeader } from '@/components/dashboard/page-header'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { SelectField } from '@/components/ai-workspace/select-field'
import { AiResult } from '@/components/ai-workspace/ai-result'
import { useAiGenerate } from '@/lib/ai-workspace/use-ai-generate'
import { useCustomers, useDealsForCustomer } from '@/lib/ai-workspace/use-pickable'

export default function ProposalGeneratorPage() {
  const { customers, loading: loadingCustomers } = useCustomers()
  const [customerId, setCustomerId] = useState('')
  const [dealId, setDealId] = useState('')
  const { deals, loading: loadingDeals } = useDealsForCustomer(customerId)
  const [instructions, setInstructions] = useState('')
  const { output, loading, error, generate } = useAiGenerate()

  function handleCustomerChange(id: string) {
    setCustomerId(id)
    setDealId('')
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        crumbs={[
          { label: 'Intelligence' },
          { label: 'AI Workspace', href: '/ai-workspace' },
          { label: 'AI Proposal Generator' },
        ]}
        title="AI Proposal Generator"
        description="Create a tailored property proposal message for a customer and deal."
      />

      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectField
            label="Customer"
            value={customerId}
            onChange={handleCustomerChange}
            disabled={loadingCustomers}
            placeholder={loadingCustomers ? 'Loading customers…' : 'Select a customer'}
            options={customers.map((c) => ({
              value: c.id,
              label: c.phone ? `${c.full_name} (${c.phone})` : c.full_name,
            }))}
          />
          <SelectField
            label="Deal"
            value={dealId}
            onChange={setDealId}
            disabled={!customerId || loadingDeals}
            placeholder={
              !customerId ? 'Select a customer first' : loadingDeals ? 'Loading deals…' : 'Optional — select a deal'
            }
            options={deals.map((d) => ({ value: d.id, label: `${d.code} — ${d.title}` }))}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="instructions" className="text-sm font-medium text-foreground">
            Extra instructions <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <Textarea
            id="instructions"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="e.g. highlight the sea-facing unit, mention the festive discount…"
          />
        </div>
        <div>
          <Button
            disabled={!customerId || loading}
            onClick={() =>
              generate({
                type: 'proposal',
                customer_id: customerId,
                deal_id: dealId || undefined,
                extra_instructions: instructions || undefined,
              })
            }
          >
            <FileSignature data-icon="inline-start" />
            Generate Proposal
          </Button>
        </div>
      </div>

      <AiResult output={output} loading={loading} error={error} loadingLabel="Drafting the proposal…" />
    </div>
  )
}
