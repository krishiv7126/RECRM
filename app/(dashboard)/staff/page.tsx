import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { StaffView } from '@/components/staff/staff-view'
import { getStaffData } from '@/lib/staff/get-staff-data'
import { getCurrentProfile } from '@/lib/supabase/current-user'

export const metadata: Metadata = { title: 'Staff' }

export default async function StaffPage() {
  const profile = await getCurrentProfile()
  const role = profile?.role

  if (role !== 'admin' && role !== 'super_admin') {
    redirect('/dashboard')
  }

  const { staff } = await getStaffData()
  return <StaffView staff={staff} />
}
