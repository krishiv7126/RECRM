'use client'

import { useState } from 'react'
import { Mail } from 'lucide-react'
import { PageHeader } from '@/components/dashboard/page-header'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { SelectField } from '@/components/ai-workspace/select-field'
import { AiResult } from '@/components/ai-workspace/ai-result'
import { useAiGenerate } from '@/lib/ai-workspace/use-ai-generate'
import { useCustomers } from '@/lib/ai-workspace/use-pickable'

export default function EmailGeneratorPage() {
  const { customers, loading: loadingCustomers } = useCustomers()
  const [customerId, setCustomerId] = useState('')
  const [instructions, setInstructions] = useState('')
  const { output, loading, error, generate } = useAiGenerate()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        crumbs={[
          { label: 'Intelligence' },
          { label: 'AI Workspace', href: '/ai-workspace' },
          { label: 'AI Email Generator' },
        ]}
        title="AI Email Generator"
        description="Draft a personalized follow-up email for a customer in seconds."
      />

      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
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
        <div className="flex flex-col gap-1.5">
          <label htmlFor="instructions" className="text-sm font-medium text-foreground">
            Extra instructions <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <Textarea
            id="instructions"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="e.g. mention the new payment plan, keep it under 120 words…"
          />
        </div>
        <div>
          <Button
            disabled={!customerId || loading}
            onClick={() => generate({ type: 'email_draft', customer_id: customerId, extra_instructions: instructions || undefined })}
          >
            <Mail data-icon="inline-start" />
            Generate Email
          </Button>
        </div>
      </div>

      <AiResult output={output} loading={loading} error={error} loadingLabel="Drafting the email…" />
    </div>
  )
}
