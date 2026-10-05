import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CustomerDetail } from '@/components/customers/customer-detail'
import { getCustomerBookedBy, getCustomerById, getCustomerDeals } from '@/lib/customers/get-customers-data'

export const metadata: Metadata = { title: 'Member Details' }

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [customer, deals, bookedBy] = await Promise.all([getCustomerById(id), getCustomerDeals(id), getCustomerBookedBy(id)])
  if (!customer) notFound()

  return <CustomerDetail customer={customer} deals={deals} bookedBy={bookedBy ?? customer.owner?.full_name ?? null} />
}
