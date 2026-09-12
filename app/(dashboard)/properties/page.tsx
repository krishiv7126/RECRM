import type { Metadata } from 'next'
import { PropertiesGrid } from '@/components/properties/properties-grid'
import { getPropertiesData, getPropertyFormOptions } from '@/lib/properties/get-properties-data'

export const metadata: Metadata = { title: 'Properties' }

export default async function PropertiesPage() {
  const [properties, formOptions] = await Promise.all([getPropertiesData(), getPropertyFormOptions()])

  return <PropertiesGrid initialProperties={properties} projects={formOptions.projects} />
}
