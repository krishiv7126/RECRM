import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { InquiriesView } from '@/components/inquiries/inquiries-view'
import { getInquiriesData } from '@/lib/inquiries/get-inquiries-data'
import { getCurrentProfile } from '@/lib/supabase/current-user'

export const metadata: Metadata = { title: 'Inquiries' }

export default async function InquiriesPage() {
  const profile = await getCurrentProfile()
  const role = profile?.role

  // Only admins and receptionists see the inquiries dashboard — everyone
  // else logs inquiries via /inquiries/new but doesn't get the roll-up view.
  if (role !== 'admin' && role !== 'super_admin' && role !== 'receptionist') {
    redirect('/dashboard')
  }

  const inquiries = await getInquiriesData()
  return <InquiriesView initialInquiries={inquiries} />
}
