import { notFound } from 'next/navigation'
import { CustomerDetail } from '@/components/customers/customer-detail'
import { getCustomerById, getCustomerDeals } from '@/lib/customers/get-customers-data'

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [customer, deals] = await Promise.all([getCustomerById(id), getCustomerDeals(id)])
  if (!customer) notFound()

  return <CustomerDetail customer={customer} deals={deals} />
}
