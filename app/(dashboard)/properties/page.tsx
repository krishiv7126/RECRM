'use client'

import { useMemo, useState } from 'react'
import { Bath, BedDouble, Download, Filter, MapPin, Plus, Ruler, Search, Upload } from 'lucide-react'
import { PageHeader } from '@/components/dashboard/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { cn } from '@/lib/utils'

type PropertyStatus = 'available' | 'on_hold' | 'sold' | 'rented'
type PropertyType = 'Apartment' | 'Villa' | 'Plot' | 'Commercial' | 'Office'

interface PropertyCard {
  id: string
  title: string
  property_type: PropertyType
  address: string
  city: string
  size_sqft: number
  bedrooms: number | null
  bathrooms: number | null
  price: number
  project_name: string | null
  status: PropertyStatus
  owner_full_name: string
}

const properties: PropertyCard[] = [
  { id: 'prop_1', title: 'Skyline Residency 3BHK', property_type: 'Apartment', address: 'Powai', city: 'Mumbai', size_sqft: 1450, bedrooms: 3, bathrooms: 3, price: 11500000, project_name: 'Skyline Residency', status: 'available', owner_full_name: 'Meera Iyer' },
  { id: 'prop_2', title: 'Devanahalli Greens Villa', property_type: 'Villa', address: 'Devanahalli', city: 'Bengaluru', size_sqft: 3200, bedrooms: 4, bathrooms: 5, price: 16800000, project_name: 'Devanahalli Greens', status: 'available', owner_full_name: 'Priya Nair' },
  { id: 'prop_3', title: 'Baner Riverside 2BHK', property_type: 'Apartment', address: 'Baner', city: 'Pune', size_sqft: 1080, bedrooms: 2, bathrooms: 2, price: 6800000, project_name: 'Baner Riverside', status: 'on_hold', owner_full_name: 'Karan Shetty' },
  { id: 'prop_4', title: 'Sector 62 Corner Plot', property_type: 'Plot', address: 'Sector 62', city: 'Noida', size_sqft: 2400, bedrooms: null, bathrooms: null, price: 8400000, project_name: null, status: 'available', owner_full_name: 'Rohan Verma' },
  { id: 'prop_5', title: 'Cyber Towers Office Suite', property_type: 'Office', address: 'HITEC City', city: 'Hyderabad', size_sqft: 1800, bedrooms: null, bathrooms: 2, price: 14200000, project_name: 'Cyber Towers', status: 'rented', owner_full_name: 'Divya Prakash' },
  { id: 'prop_6', title: 'DLF Phase 3 2BHK', property_type: 'Apartment', address: 'DLF Phase 3', city: 'Gurgaon', size_sqft: 1150, bedrooms: 2, bathrooms: 2, price: 7200000, project_name: 'DLF Crest', status: 'sold', owner_full_name: 'Aditya Rao' },
  { id: 'prop_7', title: 'Whitefield Grand 3BHK', property_type: 'Apartment', address: 'Whitefield', city: 'Bengaluru', size_sqft: 1620, bedrooms: 3, bathrooms: 3, price: 15200000, project_name: 'Whitefield Grand', status: 'available', owner_full_name: 'Priya Nair' },
  { id: 'prop_8', title: 'Jubilee Hills Retail Space', property_type: 'Commercial', address: 'Jubilee Hills', city: 'Hyderabad', size_sqft: 2200, bedrooms: null, bathrooms: 1, price: 19500000, project_name: null, status: 'on_hold', owner_full_name: 'Karan Shetty' },
  { id: 'prop_9', title: 'Andheri West Heights 3BHK', property_type: 'Apartment', address: 'Andheri West', city: 'Mumbai', size_sqft: 1520, bedrooms: 3, bathrooms: 3, price: 17500000, project_name: 'Andheri West Heights', status: 'rented', owner_full_name: 'Meera Iyer' },
]

const statusMeta: Record<PropertyStatus, { label: string; dot: string; badge: string }> = {
  available: { label: 'Available', dot: 'bg-success', badge: 'bg-success/15 text-success' },
  on_hold: { label: 'On Hold', dot: 'bg-chart-4', badge: 'bg-chart-4/15 text-chart-4' },
  sold: { label: 'Sold', dot: 'bg-muted-foreground', badge: 'bg-muted text-muted-foreground' },
  rented: { label: 'Rented', dot: 'bg-chart-2', badge: 'bg-chart-2/15 text-chart-2' },
}

function formatPrice(amount: number) {
  return amount >= 10000000 ? `₹${(amount / 10000000).toFixed(1)}Cr` : `₹${Math.round(amount / 100000)}L`
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

type FilterTab = 'all' | PropertyStatus

export default function PropertiesPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [query, setQuery] = useState('')

  const counts = useMemo(
    () => ({
      all: properties.length,
      available: properties.filter((p) => p.status === 'available').length,
      on_hold: properties.filter((p) => p.status === 'on_hold').length,
      sold: properties.filter((p) => p.status === 'sold').length,
      rented: properties.filter((p) => p.status === 'rented').length,
    }),
    [],
  )

  const filteredProperties = useMemo(() => {
    return properties.filter((property) => {
      const matchesTab = activeTab === 'all' || property.status === activeTab
      const matchesQuery =
        query.trim().length === 0 ||
        property.title.toLowerCase().includes(query.toLowerCase()) ||
        property.address.toLowerCase().includes(query.toLowerCase()) ||
        property.city.toLowerCase().includes(query.toLowerCase())
      return matchesTab && matchesQuery
    })
  }, [activeTab, query])

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: counts.all },
    { key: 'available', label: 'Available', count: counts.available },
    { key: 'on_hold', label: 'On Hold', count: counts.on_hold },
    { key: 'sold', label: 'Sold', count: counts.sold },
    { key: 'rented', label: 'Rented', count: counts.rented },
  ]

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          crumbs={[{ label: 'Sales' }, { label: 'Inventory' }, { label: 'Properties' }]}
          title="Properties"
          description={`${properties.length} total · ${counts.available} available`}
        />
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" size="sm">
            <Upload data-icon="inline-start" />
            Import
          </Button>
          <Button variant="outline" size="sm">
            <Download data-icon="inline-start" />
            Export
          </Button>
          <Button size="sm" className="bg-foreground text-background hover:bg-foreground/85">
            <Plus data-icon="inline-start" />
            New Property
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors',
                activeTab === tab.key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-muted-foreground ring-1 ring-border hover:text-foreground',
              )}
            >
              {tab.label}
              <span
                className={cn(
                  'flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-semibold',
                  activeTab === tab.key ? 'bg-primary-foreground/20' : 'bg-muted text-muted-foreground',
                )}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <InputGroup className="w-56">
            <InputGroupAddon>
              <Search className="size-4" />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Search properties…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </InputGroup>
          <Button variant="outline" size="sm">
            <Filter data-icon="inline-start" />
            Filter
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredProperties.map((property) => {
          const meta = statusMeta[property.status]
          return (
            <div
              key={property.id}
              className="flex flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-border transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="relative h-36 w-full bg-gradient-to-br from-primary/25 via-accent to-secondary/60">
                <Badge variant="outline" className={cn('absolute right-3 top-3 gap-1.5 rounded-full border-0', meta.badge)}>
                  <span className={cn('size-1.5 shrink-0 rounded-full', meta.dot)} />
                  {meta.label}
                </Badge>
              </div>

              <div className="flex flex-1 flex-col gap-3 p-4">
                <div className="flex flex-col gap-1.5">
                  <Badge variant="outline" className="w-fit rounded-full text-[11px] text-muted-foreground">
                    {property.property_type}
                  </Badge>
                  <h3 className="font-heading text-[15px] font-bold leading-snug text-foreground text-pretty">
                    {property.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                    <MapPin className="size-3.5 shrink-0" />
                    <span className="truncate">
                      {property.address}, {property.city}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-[12px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Ruler className="size-3.5 shrink-0" />
                    {property.size_sqft.toLocaleString('en-IN')} sqft
                  </span>
                  {property.bedrooms !== null && (
                    <span className="flex items-center gap-1">
                      <BedDouble className="size-3.5 shrink-0" />
                      {property.bedrooms}
                    </span>
                  )}
                  {property.bathrooms !== null && (
                    <span className="flex items-center gap-1">
                      <Bath className="size-3.5 shrink-0" />
                      {property.bathrooms}
                    </span>
                  )}
                </div>

                <div className="flex items-baseline justify-between">
                  <span className="font-heading text-lg font-extrabold text-foreground">
                    {formatPrice(property.price)}
                  </span>
                  {property.project_name && (
                    <span className="truncate text-[12px] text-muted-foreground">{property.project_name}</span>
                  )}
                </div>

                <div className="mt-auto flex items-center justify-between border-t border-border/70 pt-3">
                  <div className="flex items-center gap-2">
                    <Avatar size="sm">
                      <AvatarFallback>{getInitials(property.owner_full_name)}</AvatarFallback>
                    </Avatar>
                    <span className="truncate text-[12px] text-foreground/80">{property.owner_full_name}</span>
                  </div>
                  <Button variant="outline" size="sm">
                    View
                  </Button>
                </div>
              </div>
            </div>
          )
        })}

        {filteredProperties.length === 0 && (
          <div className="col-span-full flex items-center justify-center rounded-2xl bg-card py-12 text-muted-foreground ring-1 ring-border">
            No properties match your filters.
          </div>
        )}
      </div>
    </div>
  )
}
