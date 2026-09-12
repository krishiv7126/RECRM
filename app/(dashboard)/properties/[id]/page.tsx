import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PropertyDetail } from '@/components/properties/property-detail'
import { getPropertyById } from '@/lib/properties/get-properties-data'
import { getCurrentProfile } from '@/lib/supabase/current-user'

export const metadata: Metadata = { title: 'Property Details' }

export default async function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [property, profile] = await Promise.all([getPropertyById(id), getCurrentProfile()])
  if (!property) notFound()

  return <PropertyDetail property={property} orgId={profile?.org_id ?? property.org_id} />
}
