import type { Metadata } from 'next'
import { CustomersTable } from '@/components/customers/customers-table'
import { getCustomersData } from '@/lib/customers/get-customers-data'

export const metadata: Metadata = { title: 'Members' }

export default async function CustomersPage() {
  const customers = await getCustomersData()
  return <CustomersTable initialCustomers={customers} />
}
