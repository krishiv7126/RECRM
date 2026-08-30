'use client'

import { useMemo, useState } from 'react'
import { MessageCircle, Save, Trash2, Users } from 'lucide-react'
import { PageHeader } from '@/components/dashboard/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { WhatsappCampaign } from '@/lib/whatsapp/get-whatsapp-data'

interface AudienceMember {
  id: string
  full_name: string
  phone: string | null
  city: string | null
  tags: string[] | null
}

type AudienceType = 'leads' | 'customers'

function personalize(message: string, name: string) {
  return message.replace(/\{\{\s*name\s*\}\}/gi, name)
}

export function WhatsappBroadcastView({
  leads,
  customers,
  initialCampaigns,
}: {
  leads: AudienceMember[]
  customers: AudienceMember[]
  initialCampaigns: WhatsappCampaign[]
}) {
  const [audienceType, setAudienceType] = useState<AudienceType>('leads')
  const [cityFilter, setCityFilter] = useState('')
  const [tagFilter, setTagFilter] = useState('')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [campaigns, setCampaigns] = useState(initialCampaigns)

  const pool = audienceType === 'leads' ? leads : customers

  const cities = useMemo(() => Array.from(new Set(pool.map((p) => p.city).filter(Boolean))) as string[], [pool])
  const tags = useMemo(() => Array.from(new Set(pool.flatMap((p) => p.tags ?? []))).sort(), [pool])

  const recipients = useMemo(() => {
    return pool.filter((p) => {
      if (!p.phone) return false
      if (cityFilter && p.city !== cityFilter) return false
      if (tagFilter && !(p.tags ?? []).includes(tagFilter)) return false
      return true
    })
  }, [pool, cityFilter, tagFilter])

  function resetAudienceFilters(nextType: AudienceType) {
    setAudienceType(nextType)
    setCityFilter('')
    setTagFilter('')
  }

  async function handleSaveCampaign() {
    if (!title.trim()) {
      setError('Give this campaign a name.')
      return
    }
    if (!message.trim()) {
      setError('Write a message.')
      return
    }
    if (recipients.length === 0) {
      setError('No recipients match this audience — widen your filters.')
      return
    }

    setSaving(true)
    setError(null)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setError('Not signed in.')
      setSaving(false)
      return
    }
    const { data: me } = await supabase.from('platform_users').select('id, org_id').eq('auth_user_id', user.id).single()
    if (!me?.org_id) {
      setError('Could not resolve your organization.')
      setSaving(false)
      return
    }

    const { data: inserted, error: insertErr } = await supabase
      .from('whatsapp_campaigns')
      .insert({
        org_id: me.org_id,
        created_by: me.id,
        title: title.trim(),
        message: message.trim(),
        audience_type: audienceType,
        filters: { city: cityFilter || null, tag: tagFilter || null },
        recipients: recipients.map((r) => ({ id: r.id, name: r.full_name, phone: r.phone })),
        recipient_count: recipients.length,
        status: 'draft',
      })
      .select('*, created_by_user:platform_users!whatsapp_campaigns_created_by_fkey(full_name)')
      .single()

    setSaving(false)
    if (insertErr || !inserted) {
      setError(insertErr?.message ?? 'Failed to save campaign.')
      return
    }

    setCampaigns((prev) => [inserted as WhatsappCampaign, ...prev])
    setTitle('')
    setMessage('')
  }

  async function handleDeleteCampaign(id: string) {
    if (!window.confirm('Delete this campaign?')) return
    const supabase = createClient()
    const { error: deleteErr } = await supabase.from('whatsapp_campaigns').delete().eq('id', id)
    if (deleteErr) {
      window.alert(deleteErr.message)
      return
    }
    setCampaigns((prev) => prev.filter((c) => c.id !== id))
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        crumbs={[{ label: 'Intelligence' }, { label: 'WhatsApp Broadcast' }]}
        title="WhatsApp Broadcast"
        description="Build an audience, write a message, and message people one tap at a time."
      />

      <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-4 py-3 text-[13px] text-muted-foreground">
        No auto-send yet — this saves the campaign and audience, and gives you a WhatsApp button per contact to send manually.
        Real bulk sending can plug in here once a WhatsApp Business API provider is connected.
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="rounded-2xl border-border shadow-sm">
          <CardContent className="flex flex-col gap-4 p-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Audience</label>
              <div className="flex gap-1.5">
                {(['leads', 'customers'] as AudienceType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => resetAudienceFilters(t)}
                    className={cn(
                      'rounded-full px-3 py-1.5 text-[13px] font-medium capitalize transition-colors',
                      audienceType === t
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card text-muted-foreground ring-1 ring-border hover:text-foreground',
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">City</label>
                <select
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none dark:bg-input/30"
                >
                  <option value="">Any</option>
                  {cities.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Tag</label>
                <select
                  value={tagFilter}
                  onChange={(e) => setTagFilter(e.target.value)}
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none dark:bg-input/30"
                >
                  <option value="">Any</option>
                  {tags.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="wa_title" className="text-sm font-medium text-foreground">
                Campaign name
              </label>
              <Input id="wa_title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Diwali offer — Mumbai leads" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="wa_message" className="text-sm font-medium text-foreground">
                Message
              </label>
              <Textarea
                id="wa_message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={'Hi {{name}}, we have a new project launching near you...'}
                className="min-h-28"
              />
              <p className="text-[11px] text-muted-foreground">Use {'{{name}}'} to personalize each message.</p>
            </div>

            {error && <p className="text-[13px] text-destructive">{error}</p>}

            <div>
              <Button size="sm" disabled={saving} onClick={handleSaveCampaign}>
                <Save data-icon="inline-start" />
                Save Campaign
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border shadow-sm">
          <CardContent className="flex flex-col gap-3 p-5">
            <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
              <Users className="size-4 text-muted-foreground" />
              {recipients.length} recipient{recipients.length === 1 ? '' : 's'} match
            </div>
            <div className="flex max-h-[420px] flex-col gap-1 overflow-y-auto">
              {recipients.map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-accent/40">
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-[13px] font-medium text-foreground">{r.full_name}</span>
                    <span className="truncate text-[12px] text-muted-foreground">{r.phone}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    aria-label={`Message ${r.full_name} on WhatsApp`}
                    render={
                      <a
                        href={`https://wa.me/${(r.phone ?? '').replace(/\D/g, '')}?text=${encodeURIComponent(personalize(message || 'Hi {{name}},', r.full_name))}`}
                        target="_blank"
                        rel="noreferrer"
                      />
                    }
                    nativeButton={false}
                  >
                    <MessageCircle className="size-3.5" />
                  </Button>
                </div>
              ))}
              {recipients.length === 0 && <p className="px-2 py-4 text-center text-[13px] text-muted-foreground">No matches for these filters.</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="font-heading text-sm font-bold uppercase tracking-wide text-muted-foreground">Past Campaigns</h2>
        <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-border">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-border text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3">Campaign</th>
                  <th className="px-4 py-3">Audience</th>
                  <th className="px-4 py-3">Recipients</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created by</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c.id} className="border-b border-border/70 transition-colors last:border-b-0 hover:bg-accent/40">
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{c.title}</span>
                        <span className="line-clamp-1 text-[12px] text-muted-foreground">{c.message}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 capitalize text-foreground/80">{c.audience_type}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-foreground/80">{c.recipient_count}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <Badge variant="outline" className="rounded-full bg-muted text-muted-foreground capitalize">
                        {c.status}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-foreground/80">{c.created_by_user?.full_name ?? '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="icon-sm" aria-label={`Delete ${c.title}`} onClick={() => handleDeleteCampaign(c.id)}>
                        <Trash2 className="size-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {campaigns.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                      No campaigns yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
