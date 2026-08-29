'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Bath,
  BedDouble,
  Check,
  Download,
  FileText,
  ImageOff,
  Loader2,
  Plus,
  Ruler,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { PageHeader } from '@/components/dashboard/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import type { PropertyWithRelations } from '@/lib/properties/get-properties-data'

function formatPrice(price: number | null, currency: string) {
  if (!price) return '—'
  return price >= 10000000 ? `${currency} ${(price / 10000000).toFixed(1)}Cr` : `${currency} ${Math.round(price / 100000)}L`
}

export function PropertyDetail({ property, orgId }: { property: PropertyWithRelations; orgId: string }) {
  const supabase = createClient()
  const imageInputRef = useRef<HTMLInputElement>(null)
  const brochureInputRef = useRef<HTMLInputElement>(null)

  const [images, setImages] = useState<string[]>(property.images ?? [])
  const [uploadingImages, setUploadingImages] = useState(false)
  const [description, setDescription] = useState(property.description ?? '')
  const [savingDescription, setSavingDescription] = useState(false)
  const [descriptionSaved, setDescriptionSaved] = useState(false)
  const [amenities, setAmenities] = useState<string[]>(property.amenities ?? [])
  const [amenityInput, setAmenityInput] = useState('')
  const [savingAmenities, setSavingAmenities] = useState(false)
  const [brochureUrl, setBrochureUrl] = useState(property.brochure_url)
  const [uploadingBrochure, setUploadingBrochure] = useState(false)
  const [downloadingBrochure, setDownloadingBrochure] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleUploadImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploadingImages(true)
    setError(null)

    const newUrls: string[] = []
    for (const file of Array.from(files)) {
      const path = `${orgId}/${property.id}/${crypto.randomUUID()}-${file.name}`
      const { error: uploadErr } = await supabase.storage.from('property-images').upload(path, file)
      if (uploadErr) {
        setError(uploadErr.message)
        continue
      }
      const { data } = supabase.storage.from('property-images').getPublicUrl(path)
      newUrls.push(data.publicUrl)
    }

    if (newUrls.length > 0) {
      const nextImages = [...images, ...newUrls]
      const { error: updateErr } = await supabase.from('properties').update({ images: nextImages }).eq('id', property.id)
      if (updateErr) {
        setError(updateErr.message)
      } else {
        setImages(nextImages)
      }
    }

    setUploadingImages(false)
    if (imageInputRef.current) imageInputRef.current.value = ''
  }

  async function handleDeleteImage(url: string) {
    const path = url.split('/property-images/')[1]
    const nextImages = images.filter((i) => i !== url)
    setImages(nextImages)
    const { error: updateErr } = await supabase.from('properties').update({ images: nextImages }).eq('id', property.id)
    if (updateErr) {
      setError(updateErr.message)
      setImages(images)
      return
    }
    if (path) await supabase.storage.from('property-images').remove([path])
  }

  async function handleSaveDescription() {
    setSavingDescription(true)
    const { error: updateErr } = await supabase
      .from('properties')
      .update({ description: description.trim() || null })
      .eq('id', property.id)
    setSavingDescription(false)
    if (updateErr) {
      setError(updateErr.message)
      return
    }
    setDescriptionSaved(true)
    setTimeout(() => setDescriptionSaved(false), 1500)
  }

  async function saveAmenities(next: string[]) {
    setAmenities(next)
    setSavingAmenities(true)
    const { error: updateErr } = await supabase.from('properties').update({ amenities: next }).eq('id', property.id)
    setSavingAmenities(false)
    if (updateErr) setError(updateErr.message)
  }

  function handleAddAmenity() {
    const value = amenityInput.trim()
    if (!value || amenities.includes(value)) return
    saveAmenities([...amenities, value])
    setAmenityInput('')
  }

  function handleRemoveAmenity(value: string) {
    saveAmenities(amenities.filter((a) => a !== value))
  }

  async function handleUploadBrochure(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingBrochure(true)
    setError(null)

    const path = `${orgId}/${property.id}/brochure-${Date.now()}-${file.name}`
    const { error: uploadErr } = await supabase.storage.from('brochures').upload(path, file)
    if (uploadErr) {
      setError(uploadErr.message)
      setUploadingBrochure(false)
      return
    }

    const { error: updateErr } = await supabase.from('properties').update({ brochure_url: path }).eq('id', property.id)
    setUploadingBrochure(false)
    if (updateErr) {
      setError(updateErr.message)
      return
    }
    setBrochureUrl(path)
    if (brochureInputRef.current) brochureInputRef.current.value = ''
  }

  async function handleDownloadBrochure() {
    if (!brochureUrl) return
    setDownloadingBrochure(true)
    const { data, error: signErr } = await supabase.storage.from('brochures').createSignedUrl(brochureUrl, 300)
    setDownloadingBrochure(false)
    if (signErr || !data) {
      setError(signErr?.message ?? 'Could not generate a download link.')
      return
    }
    window.open(data.signedUrl, '_blank', 'noreferrer')
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/properties" className="mb-3 flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" />
          All properties
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <PageHeader
            crumbs={[{ label: 'Inventory' }, { label: 'Properties', href: '/properties' }, { label: property.title }]}
            title={property.title}
          />
          <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
            {property.city && <span>{property.city}</span>}
            <span className="font-heading text-base font-bold text-foreground">{formatPrice(property.price, property.currency)}</span>
          </div>
        </div>
      </div>

      {error && <p className="text-[13px] text-destructive">{error}</p>}

      {/* Image gallery */}
      <Card className="rounded-2xl border-border shadow-sm">
        <CardContent className="flex flex-col gap-3 p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-sm font-bold text-foreground">Photos</h2>
            <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUploadImages} />
            <Button variant="outline" size="sm" disabled={uploadingImages} onClick={() => imageInputRef.current?.click()}>
              {uploadingImages ? <Loader2 className="animate-spin" /> : <Upload data-icon="inline-start" />}
              Upload photos
            </Button>
          </div>

          {images.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-xl bg-muted/40 text-muted-foreground">
              <ImageOff className="size-6" />
              <span className="text-[13px]">No photos yet</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {images.map((url) => (
                <div key={url} className="group relative aspect-square overflow-hidden rounded-xl bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={property.title} className="size-full object-cover" />
                  <button
                    type="button"
                    aria-label="Remove photo"
                    onClick={() => handleDeleteImage(url)}
                    className="absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-full bg-background/90 text-foreground opacity-0 shadow transition-opacity group-hover:opacity-100"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Core details */}
      <Card className="rounded-2xl border-border shadow-sm">
        <CardContent className="flex flex-wrap items-center gap-5 p-5 text-[13px] text-foreground/80">
          <span className="flex items-center gap-1.5">
            <Ruler className="size-4 text-muted-foreground" />
            {property.size_sqft ? `${property.size_sqft} sqft` : '—'}
          </span>
          <span className="flex items-center gap-1.5">
            <BedDouble className="size-4 text-muted-foreground" />
            {property.bedrooms ?? '—'} beds
          </span>
          <span className="flex items-center gap-1.5">
            <Bath className="size-4 text-muted-foreground" />
            {property.bathrooms ?? '—'} baths
          </span>
          <span>{property.address ?? '—'}</span>
          {property.project?.name && <Badge variant="outline">{property.project.name}</Badge>}
        </CardContent>
      </Card>

      {/* Description */}
      <Card className="rounded-2xl border-border shadow-sm">
        <CardContent className="flex flex-col gap-3 p-5">
          <h2 className="font-heading text-sm font-bold text-foreground">Description</h2>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe this property for buyers…"
            className="min-h-24"
          />
          <div>
            <Button size="sm" disabled={savingDescription} onClick={handleSaveDescription}>
              {savingDescription ? <Loader2 className="animate-spin" /> : descriptionSaved ? <Check data-icon="inline-start" /> : null}
              {descriptionSaved ? 'Saved' : 'Save description'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Amenities */}
      <Card className="rounded-2xl border-border shadow-sm">
        <CardContent className="flex flex-col gap-3 p-5">
          <h2 className="font-heading text-sm font-bold text-foreground">Amenities</h2>
          <div className="flex flex-wrap gap-2">
            {amenities.map((a) => (
              <Badge key={a} variant="outline" className="flex items-center gap-1 rounded-full py-1 pl-2.5 pr-1.5">
                {a}
                <button type="button" aria-label={`Remove ${a}`} onClick={() => handleRemoveAmenity(a)}>
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
            {amenities.length === 0 && <span className="text-[13px] text-muted-foreground">No amenities added yet.</span>}
          </div>
          <div className="flex items-center gap-2">
            <Input
              value={amenityInput}
              onChange={(e) => setAmenityInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddAmenity()
                }
              }}
              placeholder="e.g. Swimming pool, Gym, Clubhouse"
              className="max-w-xs"
            />
            <Button variant="outline" size="sm" disabled={savingAmenities || !amenityInput.trim()} onClick={handleAddAmenity}>
              <Plus data-icon="inline-start" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Brochure */}
      <Card className="rounded-2xl border-border shadow-sm">
        <CardContent className="flex flex-col gap-3 p-5">
          <h2 className="font-heading text-sm font-bold text-foreground">Brochure</h2>
          <input ref={brochureInputRef} type="file" accept="application/pdf" className="hidden" onChange={handleUploadBrochure} />
          {brochureUrl ? (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={downloadingBrochure} onClick={handleDownloadBrochure}>
                {downloadingBrochure ? <Loader2 className="animate-spin" /> : <Download data-icon="inline-start" />}
                Download brochure
              </Button>
              <Button variant="ghost" size="sm" disabled={uploadingBrochure} onClick={() => brochureInputRef.current?.click()}>
                {uploadingBrochure ? <Loader2 className="animate-spin" /> : <Upload data-icon="inline-start" />}
                Replace
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                <FileText className="size-4" />
                No brochure uploaded
              </div>
              <Button variant="outline" size="sm" disabled={uploadingBrochure} onClick={() => brochureInputRef.current?.click()}>
                {uploadingBrochure ? <Loader2 className="animate-spin" /> : <Upload data-icon="inline-start" />}
                Upload PDF
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
