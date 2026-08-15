import { notFound } from 'next/navigation'
import { CustomerDetail } from '@/components/customers/customer-detail'
import { getCustomerById } from '@/lib/customers/get-customers-data'

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const customer = await getCustomerById(id)
  if (!customer) notFound()

  return <CustomerDetail customer={customer} />
}
