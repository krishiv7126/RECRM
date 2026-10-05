import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { InquiriesView } from '@/components/inquiries/inquiries-view'
import { getInquiriesData } from '@/lib/inquiries/get-inquiries-data'
import { getCurrentProfile } from '@/lib/supabase/current-user'

export const metadata: Metadata = { title: 'Logged Leads' }

export default async function InquiriesPage() {
  const profile = await getCurrentProfile()
  const role = profile?.role

  // The Inquiries module is gone for everyone but the front desk; other roles
  // see these leads on the Leads page like any other.
  if (role !== 'receptionist') redirect('/leads')

  const inquiries = await getInquiriesData()
  return <InquiriesView initialInquiries={inquiries} />
}
