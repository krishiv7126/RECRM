'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'

type PropertyType = Database['public']['Enums']['property_type']
type PropertyStatus = Database['public']['Enums']['property_status']

const typeLabels: Record<PropertyType, string> = {
  apartment: 'Apartment',
  villa: 'Villa',
  plot: 'Plot',
  commercial: 'Commercial',
  office: 'Office',
  other: 'Other',
}

const statusLabels: Record<PropertyStatus, string> = {
  available: 'Available',
  on_hold: 'On Hold',
  sold: 'Sold',
  rented: 'Rented',
}

interface EditableProperty {
  id: string
  title: string
  property_type: PropertyType
  status: PropertyStatus
  address: string | null
  city: string | null
  size_sqft: number | null
  bedrooms: number | null
  bathrooms: number | null
  price: number | null
  project_id: string | null
}

export function PropertyDialog({
  trigger,
  open: openProp,
  onOpenChange: onOpenChangeProp,
  projects,
  property,
}: {
  trigger?: React.ReactElement
  open?: boolean
  onOpenChange?: (open: boolean) => void
  projects: { id: string; name: string }[]
  property?: EditableProperty
}) {
  const router = useRouter()
  const [openState, setOpenState] = useState(false)
  const open = openProp ?? openState
  const setOpen = onOpenChangeProp ?? setOpenState

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [propertyType, setPropertyType] = useState<PropertyType>('apartment')
  const [status, setStatus] = useState<PropertyStatus>('available')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [sizeSqft, setSizeSqft] = useState('')
  const [bedrooms, setBedrooms] = useState('')
  const [bathrooms, setBathrooms] = useState('')
  const [price, setPrice] = useState('')
  const [projectId, setProjectId] = useState('')

  useEffect(() => {
    if (!open) return
    setTitle(property?.title ?? '')
    setPropertyType(property?.property_type ?? 'apartment')
    setStatus(property?.status ?? 'available')
    setAddress(property?.address ?? '')
    setCity(property?.city ?? '')
    setSizeSqft(property?.size_sqft?.toString() ?? '')
    setBedrooms(property?.bedrooms?.toString() ?? '')
    setBathrooms(property?.bathrooms?.toString() ?? '')
    setPrice(property?.price?.toString() ?? '')
    setProjectId(property?.project_id ?? '')
    setError(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, property?.id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      setError('Title is required.')
      return
    }
    setSubmitting(true)
    setError(null)

    const supabase = createClient()
    const fields = {
      title: title.trim(),
      property_type: propertyType,
      status,
      address: address.trim() || null,
      city: city.trim() || null,
      size_sqft: sizeSqft ? Number(sizeSqft) : null,
      bedrooms: bedrooms ? Number(bedrooms) : null,
      bathrooms: bathrooms ? Number(bathrooms) : null,
      price: price ? Number(price) : null,
      project_id: projectId || null,
    }

    if (property) {
      const { error: updateErr } = await supabase.from('properties').update(fields).eq('id', property.id)
      setSubmitting(false)
      if (updateErr) {
        setError(updateErr.message)
        return
      }
    } else {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setError('Not signed in.')
        setSubmitting(false)
        return
      }
      const { data: me } = await supabase
        .from('platform_users')
        .select('id, org_id')
        .eq('auth_user_id', user.id)
        .single()
      if (!me?.org_id) {
        setError('Could not resolve your organization.')
        setSubmitting(false)
        return
      }

      const { error: insertErr } = await supabase.from('properties').insert({
        org_id: me.org_id,
        owner_id: me.id,
        ...fields,
      })

      setSubmitting(false)
      if (insertErr) {
        setError(insertErr.message)
        return
      }
    }

    setOpen(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger render={trigger} />}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{property ? 'Edit Property' : 'New Property'}</DialogTitle>
          <DialogDescription>{property ? 'Update this listing.' : 'Add a new property listing.'}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex max-h-[70vh] flex-col gap-3 overflow-y-auto pr-1">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="prop_title" className="text-sm font-medium text-foreground">
              Title <span className="text-destructive">*</span>
            </label>
            <Input id="prop_title" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Skyline Residency 3BHK" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="prop_type" className="text-sm font-medium text-foreground">
                Type
              </label>
              <select
                id="prop_type"
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value as PropertyType)}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              >
                {Object.entries(typeLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="prop_status" className="text-sm font-medium text-foreground">
                Status
              </label>
              <select
                id="prop_status"
                value={status}
                onChange={(e) => setStatus(e.target.value as PropertyStatus)}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              >
                {Object.entries(statusLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="prop_address" className="text-sm font-medium text-foreground">
                Address
              </label>
              <Input id="prop_address" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="prop_city" className="text-sm font-medium text-foreground">
                City
              </label>
              <Input id="prop_city" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="prop_size" className="text-sm font-medium text-foreground">
                Size (sqft)
              </label>
              <Input id="prop_size" type="number" value={sizeSqft} onChange={(e) => setSizeSqft(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="prop_bedrooms" className="text-sm font-medium text-foreground">
                Bedrooms
              </label>
              <Input id="prop_bedrooms" type="number" value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="prop_bathrooms" className="text-sm font-medium text-foreground">
                Bathrooms
              </label>
              <Input id="prop_bathrooms" type="number" value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="prop_price" className="text-sm font-medium text-foreground">
                Price (₹)
              </label>
              <Input id="prop_price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="prop_project" className="text-sm font-medium text-foreground">
                Project
              </label>
              <select
                id="prop_project"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              >
                <option value="">None</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && <p className="text-[13px] text-destructive">{error}</p>}

          <div className="mt-1 flex justify-end gap-2">
            <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="animate-spin" /> : <Plus data-icon="inline-start" />}
              {property ? 'Save Changes' : 'Create Property'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
