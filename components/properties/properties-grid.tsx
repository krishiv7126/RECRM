'use client'

import { useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bath,
  BedDouble,
  Download,
  Filter,
  Loader2,
  MapPin,
  MoreHorizontal,
  Plus,
  Ruler,
  Search,
  Upload,
  X,
} from 'lucide-react'
import { PageHeader } from '@/components/dashboard/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PropertyDialog } from '@/components/properties/property-dialog'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { Database } from '@/lib/supabase/types'
import type { PropertyWithRelations } from '@/lib/properties/get-properties-data'

type PropertyStatus = Database['public']['Enums']['property_status']

const statusMeta: Record<PropertyStatus, { label: string; dot: string; badge: string }> = {
  available: { label: 'Available', dot: 'bg-success', badge: 'bg-success/15 text-success' },
  on_hold: { label: 'On Hold', dot: 'bg-chart-4', badge: 'bg-chart-4/15 text-chart-4' },
  sold: { label: 'Sold', dot: 'bg-muted-foreground', badge: 'bg-muted text-muted-foreground' },
  rented: { label: 'Rented', dot: 'bg-chart-2', badge: 'bg-chart-2/15 text-chart-2' },
}

const typeLabels: Record<string, string> = {
  apartment: 'Apartment',
  villa: 'Villa',
  plot: 'Plot',
  commercial: 'Commercial',
  office: 'Office',
  other: 'Other',
}

function formatPrice(amount: number) {
  return amount >= 10000000 ? `₹${(amount / 10000000).toFixed(1)}Cr` : `₹${Math.round(amount / 100000)}L`
}

function getInitials(name: string) {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
}

type FilterTab = 'all' | PropertyStatus

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, '').toLowerCase())
  return lines.slice(1).map((line) => {
    const cells = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''))
    const row: Record<string, string> = {}
    headers.forEach((h, i) => {
      row[h] = cells[i] ?? ''
    })
    return row
  })
}

export function PropertiesGrid({
  initialProperties,
  projects,
}: {
  initialProperties: PropertyWithRelations[]
  projects: { id: string; name: string }[]
}) {
  const router = useRouter()
  const [properties, setProperties] = useState(initialProperties)
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [query, setQuery] = useState('')
  const [showFilter, setShowFilter] = useState(false)
  const [typeFilter, setTypeFilter] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [editingProperty, setEditingProperty] = useState<PropertyWithRelations | null>(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const types = useMemo(() => Array.from(new Set(properties.map((p) => p.property_type))), [properties])
  const cities = useMemo(
    () => Array.from(new Set(properties.map((p) => p.city).filter(Boolean))) as string[],
    [properties],
  )

  const counts = useMemo(
    () => ({
      all: properties.length,
      available: properties.filter((p) => p.status === 'available').length,
      on_hold: properties.filter((p) => p.status === 'on_hold').length,
      sold: properties.filter((p) => p.status === 'sold').length,
      rented: properties.filter((p) => p.status === 'rented').length,
    }),
    [properties],
  )

  const filteredProperties = useMemo(() => {
    return properties.filter((property) => {
      const matchesTab = activeTab === 'all' || property.status === activeTab
      const q = query.trim().toLowerCase()
      const matchesQuery =
        q.length === 0 ||
        property.title.toLowerCase().includes(q) ||
        (property.address ?? '').toLowerCase().includes(q) ||
        (property.city ?? '').toLowerCase().includes(q)
      const matchesType = !typeFilter || property.property_type === typeFilter
      const matchesCity = !cityFilter || property.city === cityFilter
      return matchesTab && matchesQuery && matchesType && matchesCity
    })
  }, [properties, activeTab, query, typeFilter, cityFilter])

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: counts.all },
    { key: 'available', label: 'Available', count: counts.available },
    { key: 'on_hold', label: 'On Hold', count: counts.on_hold },
    { key: 'sold', label: 'Sold', count: counts.sold },
    { key: 'rented', label: 'Rented', count: counts.rented },
  ]

  const activeFilterCount = [typeFilter, cityFilter].filter(Boolean).length

  async function handleDelete(property: PropertyWithRelations) {
    if (!window.confirm(`Delete "${property.title}"? This cannot be undone.`)) return
    const supabase = createClient()
    const { error } = await supabase.from('properties').delete().eq('id', property.id)
    if (error) {
      window.alert(error.message)
      return
    }
    setProperties((prev) => prev.filter((p) => p.id !== property.id))
  }

  function handleExport() {
    const rows = [
      ['Title', 'Type', 'Address', 'City', 'Size (sqft)', 'Bedrooms', 'Bathrooms', 'Price', 'Status', 'Project', 'Owner'],
      ...filteredProperties.map((p) => [
        p.title,
        p.property_type,
        p.address ?? '',
        p.city ?? '',
        p.size_sqft?.toString() ?? '',
        p.bedrooms?.toString() ?? '',
        p.bathrooms?.toString() ?? '',
        p.price?.toString() ?? '',
        p.status,
        p.project?.name ?? '',
        p.owner?.full_name ?? '',
      ]),
    ]
    const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `properties-export-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setImportResult(null)

    const text = await file.text()
    const rows = parseCsv(text)
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setImporting(false)
      setImportResult('Not signed in.')
      return
    }
    const { data: me } = await supabase.from('platform_users').select('id, org_id').eq('auth_user_id', user.id).single()
    if (!me?.org_id) {
      setImporting(false)
      setImportResult('Could not resolve your organization.')
      return
    }

    const validTypes = new Set(['apartment', 'villa', 'plot', 'commercial', 'office', 'other'])
    const validStatuses = new Set(['available', 'on_hold', 'sold', 'rented'])
    const orgId = me.org_id
    const ownerId = me.id

    const inserts = rows
      .filter((r) => r.title)
      .map((r) => {
        const type = r.type?.toLowerCase()
        const status = r.status?.toLowerCase()
        return {
          org_id: orgId,
          owner_id: ownerId,
          title: r.title,
          property_type: (validTypes.has(type) ? type : 'other') as Database['public']['Enums']['property_type'],
          status: (validStatuses.has(status) ? status : 'available') as Database['public']['Enums']['property_status'],
          address: r.address || null,
          city: r.city || null,
          size_sqft: r['size (sqft)'] || r.size_sqft ? Number(r['size (sqft)'] || r.size_sqft) : null,
          bedrooms: r.bedrooms ? Number(r.bedrooms) : null,
          bathrooms: r.bathrooms ? Number(r.bathrooms) : null,
          price: r.price ? Number(r.price) : null,
        }
      })

    if (inserts.length === 0) {
      setImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
      setImportResult('No valid rows found in CSV.')
      return
    }

    const { error } = await supabase.from('properties').insert(inserts)

    setImporting(false)
    if (fileInputRef.current) fileInputRef.current.value = ''

    if (error) {
      setImportResult(error.message)
      return
    }
    setImportResult(`Imported ${inserts.length} properties.`)
    router.refresh()
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          crumbs={[{ label: 'Sales' }, { label: 'Inventory' }, { label: 'Properties' }]}
          title="Properties"
          description={`${counts.all} total · ${counts.available} available`}
        />
        <div className="flex shrink-0 items-center gap-2">
          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleImportFile} />
          <Button variant="outline" size="sm" disabled={importing} onClick={() => fileInputRef.current?.click()}>
            {importing ? <Loader2 className="animate-spin" /> : <Upload data-icon="inline-start" />}
            Import
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download data-icon="inline-start" />
            Export
          </Button>
          <PropertyDialog
            trigger={
              <Button size="sm" className="bg-foreground text-background hover:bg-foreground/85">
                <Plus data-icon="inline-start" />
                New Property
              </Button>
            }
            projects={projects}
          />
        </div>
      </div>

      <PropertyDialog
        open={!!editingProperty}
        onOpenChange={(next) => {
          if (!next) setEditingProperty(null)
        }}
        projects={projects}
        property={editingProperty ?? undefined}
      />

      {importResult && (
        <div className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2 text-[13px] text-foreground">
          {importResult}
          <button type="button" onClick={() => setImportResult(null)} aria-label="Dismiss">
            <X className="size-3.5 text-muted-foreground" />
          </button>
        </div>
      )}

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

        <div className="relative flex items-center gap-2">
          <InputGroup className="w-56">
            <InputGroupAddon>
              <Search className="size-4" />
            </InputGroupAddon>
            <InputGroupInput placeholder="Search properties…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </InputGroup>
          <Button variant="outline" size="sm" onClick={() => setShowFilter((v) => !v)}>
            <Filter data-icon="inline-start" />
            Filter
            {activeFilterCount > 0 && (
              <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                {activeFilterCount}
              </span>
            )}
          </Button>

          {showFilter && (
            <div className="absolute top-full right-0 z-30 mt-1.5 w-64 rounded-xl border border-border bg-card p-4 shadow-lg">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-foreground/80">Type</label>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-[13px] outline-none dark:bg-input/30"
                  >
                    <option value="">Any</option>
                    {types.map((t) => (
                      <option key={t} value={t}>
                        {typeLabels[t] ?? t}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-foreground/80">City</label>
                  <select
                    value={cityFilter}
                    onChange={(e) => setCityFilter(e.target.value)}
                    className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-[13px] outline-none dark:bg-input/30"
                  >
                    <option value="">Any</option>
                    {cities.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setTypeFilter('')
                      setCityFilter('')
                    }}
                  >
                    Clear
                  </Button>
                  <Button size="sm" onClick={() => setShowFilter(false)}>
                    Apply
                  </Button>
                </div>
              </div>
            </div>
          )}
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
                <div className="absolute left-3 top-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <button
                          type="button"
                          aria-label={`More actions for ${property.title}`}
                          className="flex size-7 items-center justify-center rounded-full bg-card/90 text-foreground/80 backdrop-blur transition-colors hover:bg-card"
                        >
                          <MoreHorizontal className="size-3.5" />
                        </button>
                      }
                    />
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem onClick={() => setEditingProperty(property)}>Edit property</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="destructive" onClick={() => handleDelete(property)}>
                        Delete property
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="flex flex-1 flex-col gap-3 p-4">
                <div className="flex flex-col gap-1.5">
                  <Badge variant="outline" className="w-fit rounded-full text-[11px] text-muted-foreground">
                    {typeLabels[property.property_type] ?? property.property_type}
                  </Badge>
                  <h3 className="font-heading text-[15px] font-bold leading-snug text-foreground text-pretty">
                    {property.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                    <MapPin className="size-3.5 shrink-0" />
                    <span className="truncate">
                      {property.address ?? '—'}
                      {property.city ? `, ${property.city}` : ''}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-[12px] text-muted-foreground">
                  {property.size_sqft !== null && (
                    <span className="flex items-center gap-1">
                      <Ruler className="size-3.5 shrink-0" />
                      {property.size_sqft.toLocaleString('en-IN')} sqft
                    </span>
                  )}
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
                    {property.price !== null ? formatPrice(property.price) : '—'}
                  </span>
                  {property.project?.name && (
                    <span className="truncate text-[12px] text-muted-foreground">{property.project.name}</span>
                  )}
                </div>

                <div className="mt-auto flex items-center justify-between border-t border-border/70 pt-3">
                  <div className="flex items-center gap-2">
                    <Avatar size="sm">
                      <AvatarFallback>{getInitials(property.owner?.full_name ?? '?')}</AvatarFallback>
                    </Avatar>
                    <span className="truncate text-[12px] text-foreground/80">{property.owner?.full_name ?? '—'}</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setEditingProperty(property)}>
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
