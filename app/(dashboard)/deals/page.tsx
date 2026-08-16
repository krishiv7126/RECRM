import { DealsBoard } from '@/components/deals/deals-board'
import { getDealFormOptions, getDealsData } from '@/lib/deals/get-deals-data'

export default async function DealsPage() {
  const [deals, formOptions] = await Promise.all([getDealsData(), getDealFormOptions()])

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col gap-6">
      <DealsBoard initialDeals={deals} customers={formOptions.customers} properties={formOptions.properties} />
    </div>
  )
}
