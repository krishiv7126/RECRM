import type { Metadata } from 'next'
import { FollowUpsList } from '@/components/follow-ups/follow-ups-list'
import { getFollowUpFormOptions, getFollowUpsData } from '@/lib/follow-ups/get-follow-ups-data'

export const metadata: Metadata = { title: 'Follow-ups' }

export default async function FollowUpsPage() {
  const [followUps, formOptions] = await Promise.all([getFollowUpsData(), getFollowUpFormOptions()])

  return (
    <FollowUpsList
      initialFollowUps={followUps}
      leads={formOptions.leads}
      customers={formOptions.customers}
      deals={formOptions.deals}
      owners={formOptions.owners}
    />
  )
}
