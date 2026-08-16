import { SiteVisitsList } from '@/components/site-visits/site-visits-list'
import { getSiteVisitFormOptions, getSiteVisitsData } from '@/lib/site-visits/get-site-visits-data'

export default async function SiteVisitsPage() {
  const [visits, formOptions] = await Promise.all([getSiteVisitsData(), getSiteVisitFormOptions()])

  return (
    <SiteVisitsList
      initialVisits={visits}
      leads={formOptions.leads}
      customers={formOptions.customers}
      properties={formOptions.properties}
      owners={formOptions.owners}
    />
  )
}
