'use client'

import { useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Download,
  Filter,
  Flame,
  Loader2,
  Mail,
  MessageCircle,
  MoreHorizontal,
  Phone,
  Plus,
  Search,
  Upload,
  X,
} from 'lucide-react'
import { PageHeader } from '@/components/dashboard/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { CreateLeadDialog } from '@/components/leads/create-lead-dialog'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { Database } from '@/lib/supabase/types'

type LeadStage = Database['public']['Enums']['lead_stage']
type LeadTemperature = Database['public']['Enums']['lead_temperature']

interface LeadRow {
  id: string
  full_name: string
  email: string | null
  phone: string | null
  requirement: string | null
  budget_min: number | null
  budget_max: number | null
  source: string | null
  stage: LeadStage
  temperature: LeadTemperature
  ai_score: number | null
  created_at: string
  owner: { full_name: string } | null
}

function formatCr(amount: number) {
  return amount >= 10000000 ? `₹${(amount / 10000000).toFixed(1)}Cr` : `₹${Math.round(amount / 100000)}L`
}

function formatBudgetRange(min: number | null, max: number | null) {
  if (!min && !max) return '—'
  if (min && max) return `${formatCr(min)} – ${formatCr(max)}`
  return formatCr(min ?? max ?? 0)
}

function getInitials(name: string) {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
}

const stageLabels: Record<LeadStage, string> = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  proposal: 'Proposal',
  site_visit: 'Site Visit',
  won: 'Won',
  lost: 'Lost',
  archive: 'Archived',
}

const stageStyles: Record<LeadStage, string> = {
  new: 'bg-muted text-muted-foreground',
  contacted: 'bg-accent text-accent-foreground',
  qualified: 'bg-secondary text-secondary-foreground',
  proposal: 'bg-primary/15 text-primary',
  site_visit: 'border border-primary/40 bg-transparent text-primary',
  won: 'bg-success/15 text-success',
  lost: 'bg-destructive/10 text-destructive',
  archive: 'bg-muted text-muted-foreground',
}

const temperatureStyles: Record<LeadTemperature, string> = {
  hot: 'border-destructive/30 bg-destructive/10 text-destructive',
  warm: 'border-primary/30 bg-primary/10 text-primary',
  cold: 'border-border bg-muted text-muted-foreground',
}

type FilterTab = 'all' | 'hot' | 'new' | 'won'

function isToday(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
}

export function LeadsTable({ initialLeads }: { initialLeads: LeadRow[] }) {
  const router = useRouter()
  const [leads, setLeads] = useState(initialLeads)
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [query, setQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [sourceFilter, setSourceFilter] = useState('')
  const [stageFilter, setStageFilter] = useState('')
  const [tempFilter, setTempFilter] = useState('')
  const [budgetMinFilter, setBudgetMinFilter] = useState('')
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const sources = useMemo(() => Array.from(new Set(leads.map((l) => l.source).filter(Boolean))) as string[], [leads])

  const counts = useMemo(
    () => ({
      all: leads.length,
      hot: leads.filter((l) => l.temperature === 'hot').length,
      new: leads.filter((l) => l.stage === 'new').length,
      won: leads.filter((l) => l.stage === 'won').length,
    }),
    [leads],
  )

  const newToday = useMemo(() => leads.filter((l) => isToday(l.created_at)).length, [leads])

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesTab =
        activeTab === 'all' ||
        (activeTab === 'hot' && lead.temperature === 'hot') ||
        (activeTab === 'new' && lead.stage === 'new') ||
        (activeTab === 'won' && lead.stage === 'won')

      const q = query.trim().toLowerCase()
      const matchesQuery =
        q.length === 0 ||
        lead.full_name.toLowerCase().includes(q) ||
        (lead.email ?? '').toLowerCase().includes(q) ||
        (lead.requirement ?? '').toLowerCase().includes(q)

      const matchesSource = !sourceFilter || lead.source === sourceFilter
      const matchesStage = !stageFilter || lead.stage === stageFilter
      const matchesTemp = !tempFilter || lead.temperature === tempFilter
      const matchesBudget = !budgetMinFilter || (lead.budget_max ?? 0) >= Number(budgetMinFilter)

      return matchesTab && matchesQuery && matchesSource && matchesStage && matchesTemp && matchesBudget
    })
  }, [leads, activeTab, query, sourceFilter, stageFilter, tempFilter, budgetMinFilter])

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: counts.all },
    { key: 'hot', label: 'Hot 🔥', count: counts.hot },
    { key: 'new', label: 'New', count: counts.new },
    { key: 'won', label: 'Won', count: counts.won },
  ]

  const activeFilterCount = [sourceFilter, stageFilter, tempFilter, budgetMinFilter].filter(Boolean).length

  function clearFilters() {
    setSourceFilter('')
    setStageFilter('')
    setTempFilter('')
    setBudgetMinFilter('')
  }

  async function handleDelete(lead: LeadRow) {
    if (!window.confirm(`Delete ${lead.full_name}? This cannot be undone.`)) return
    const supabase = createClient()
    const { error } = await supabase.from('leads').delete().eq('id', lead.id)
    if (error) {
      window.alert(error.message)
      return
    }
    setLeads((prev) => prev.filter((l) => l.id !== lead.id))
  }

  async function handleConvert(lead: LeadRow) {
    if (!window.confirm(`Convert ${lead.full_name} to a customer?`)) return
    const supabase = createClient()
    const { error } = await supabase.rpc('fn_convert_lead_to_customer', { p_lead_id: lead.id })
    if (error) {
      window.alert(error.message)
      return
    }
    router.refresh()
  }

  function handleExport() {
    const rows = [
      ['Name', 'Email', 'Phone', 'Requirement', 'Budget Min', 'Budget Max', 'Source', 'Stage', 'Temperature', 'AI Score', 'Owner'],
      ...filteredLeads.map((l) => [
        l.full_name,
        l.email ?? '',
        l.phone ?? '',
        l.requirement ?? '',
        l.budget_min?.toString() ?? '',
        l.budget_max?.toString() ?? '',
        l.source ?? '',
        l.stage,
        l.temperature,
        l.ai_score?.toString() ?? '',
        l.owner?.full_name ?? '',
      ]),
    ]
    const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `leads-export-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setImportResult(null)

    const text = await file.text()
    const supabase = createClient()
    const { data, error } = await supabase.functions.invoke('import-leads-csv', { body: { csv: text } })

    setImporting(false)
    if (fileInputRef.current) fileInputRef.current.value = ''

    if (error || data?.error) {
      setImportResult(data?.error ?? 'Import failed.')
      return
    }
    setImportResult(`Imported ${data.inserted}/${data.total_rows} leads.`)
    router.refresh()
  }

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          crumbs={[{ label: 'Sales' }, { label: 'Pipeline' }, { label: 'Leads' }]}
          title="Leads"
          description={`${counts.all} total · ${newToday} new today · ${counts.hot} hot leads waiting`}
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
          <CreateLeadDialog
            trigger={
              <Button size="sm" className="bg-foreground text-background hover:bg-foreground/85">
                <Plus data-icon="inline-start" />
                New Lead
              </Button>
            }
          />
        </div>
      </div>

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
            <InputGroupInput placeholder="Search leads…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </InputGroup>
          <Button variant="outline" size="sm" onClick={() => setShowFilters((v) => !v)}>
            <Filter data-icon="inline-start" />
            Filter
            {activeFilterCount > 0 && (
              <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                {activeFilterCount}
              </span>
            )}
          </Button>

          {showFilters && (
            <div className="absolute top-full right-0 z-30 mt-1.5 w-72 rounded-xl border border-border bg-card p-4 shadow-lg">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-foreground/80">Source</label>
                  <select
                    value={sourceFilter}
                    onChange={(e) => setSourceFilter(e.target.value)}
                    className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-[13px] outline-none dark:bg-input/30"
                  >
                    <option value="">Any</option>
                    {sources.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-foreground/80">Stage</label>
                  <select
                    value={stageFilter}
                    onChange={(e) => setStageFilter(e.target.value)}
                    className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-[13px] outline-none dark:bg-input/30"
                  >
                    <option value="">Any</option>
                    {Object.entries(stageLabels).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-foreground/80">Temperature</label>
                  <select
                    value={tempFilter}
                    onChange={(e) => setTempFilter(e.target.value)}
                    className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-[13px] outline-none dark:bg-input/30"
                  >
                    <option value="">Any</option>
                    <option value="hot">Hot</option>
                    <option value="warm">Warm</option>
                    <option value="cold">Cold</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-foreground/80">Min budget (₹)</label>
                  <Input type="number" value={budgetMinFilter} onChange={(e) => setBudgetMinFilter(e.target.value)} placeholder="e.g. 5000000" />
                </div>
                <div className="flex justify-between">
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Clear
                  </Button>
                  <Button size="sm" onClick={() => setShowFilters(false)}>
                    Apply
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-border">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-border text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">Lead</th>
                <th className="px-4 py-3">Interest</th>
                <th className="px-4 py-3">Budget</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="border-b border-border/70 transition-colors last:border-b-0 hover:bg-accent/50">
                  <td className="px-4 py-3">
                    <Link href={`/leads/${lead.id}`} className="flex items-center gap-2.5">
                      <Avatar size="sm">
                        <AvatarFallback>{getInitials(lead.full_name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate font-medium text-foreground hover:underline">{lead.full_name}</span>
                        <span className="truncate text-[12px] text-muted-foreground">{lead.email ?? '—'}</span>
                      </div>
                    </Link>
                  </td>
                  <td className="max-w-[220px] px-4 py-3 text-foreground/80">
                    <span className="line-clamp-2">{lead.requirement ?? '—'}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-foreground">
                    {formatBudgetRange(lead.budget_min, lead.budget_max)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-foreground/80">{lead.source ?? '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <Badge className={cn('rounded-full', stageStyles[lead.stage])} variant="outline">
                      {stageLabels[lead.stage]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex w-16 flex-col gap-1">
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${lead.ai_score ?? 0}%` }} />
                        </div>
                        <span className="text-[11px] font-semibold text-foreground">{lead.ai_score ?? '—'}</span>
                      </div>
                      <Badge variant="outline" className={cn('rounded-full', temperatureStyles[lead.temperature])}>
                        {lead.temperature === 'hot' && <Flame className="size-3" />}
                        {lead.temperature}
                      </Badge>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-foreground/80">{lead.owner?.full_name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        disabled={!lead.phone}
                        aria-label={`Call ${lead.full_name}`}
                        render={<a href={lead.phone ? `tel:${lead.phone}` : undefined} />}
                        nativeButton={false}
                      >
                        <Phone className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        disabled={!lead.phone}
                        aria-label={`WhatsApp ${lead.full_name}`}
                        render={<a href={lead.phone ? `https://wa.me/${lead.phone.replace(/\D/g, '')}` : undefined} target="_blank" rel="noreferrer" />}
                        nativeButton={false}
                      >
                        <MessageCircle className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        disabled={!lead.email}
                        aria-label={`Email ${lead.full_name}`}
                        render={<a href={lead.email ? `mailto:${lead.email}` : undefined} />}
                        nativeButton={false}
                      >
                        <Mail className="size-3.5" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button variant="ghost" size="icon-sm" aria-label={`More actions for ${lead.full_name}`}>
                              <MoreHorizontal className="size-3.5" />
                            </Button>
                          }
                        />
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem render={<Link href={`/leads/${lead.id}`} />}>View profile</DropdownMenuItem>
                          <DropdownMenuItem render={<Link href={`/leads/${lead.id}`} />}>Edit lead</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleConvert(lead)}>Convert to customer</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem variant="destructive" onClick={() => handleDelete(lead)}>
                            Delete lead
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredLeads.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                    No leads match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
