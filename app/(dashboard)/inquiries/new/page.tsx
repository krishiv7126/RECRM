import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { InquiryForm } from '@/components/inquiries/inquiry-form'
import { getCurrentProfile } from '@/lib/supabase/current-user'

export const metadata: Metadata = { title: 'New Lead' }

export default async function NewInquiryPage() {
  // Only the front desk uses this form; everyone else adds leads from Leads.
  const profile = await getCurrentProfile()
  if (profile?.role !== 'receptionist') redirect('/leads')
  return <InquiryForm />
}
