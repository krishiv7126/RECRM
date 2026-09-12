import type { Metadata } from 'next'
import { LeadsTable } from '@/components/leads/leads-table'
import { getLeadsData } from '@/lib/leads/get-leads-data'

export const metadata: Metadata = { title: 'Leads' }

export default async function LeadsPage() {
  const leads = await getLeadsData()

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col gap-6">
      <LeadsTable initialLeads={leads} />
    </div>
  )
}
