'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowDownAZ,
  Clock,
  Download,
  Filter,
  Mail,
  MessageCircle,
  MoreHorizontal,
  Phone,
  Plus,
  Search,
  Sparkles,
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
import { CreateCustomerDialog } from '@/components/customers/create-customer-dialog'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface CustomerRow {
  id: string
  full_name: string
  email: string | null
  phone: string | null
  city: string | null
  tags: string[] | null
  ai_summary: string | null
  owner: { full_name: string } | null
  open_deals: number
  created_at: string
}

function getInitials(name: string) {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
}

type SortMode = 'recent' | 'az'

export function CustomersTable({ initialCustomers }: { initialCustomers: CustomerRow[] }) {
  const router = useRouter()
  const [customers, setCustomers] = useState(initialCustomers)
  const [query, setQuery] = useState('')
  const [sortMode, setSortMode] = useState<SortMode>('recent')
  const [showFilters, setShowFilters] = useState(false)
  const [tagFilter, setTagFilter] = useState('')
  const [cityFilter, setCityFilter] = useState('')

  const allTags = useMemo(() => Array.from(new Set(customers.flatMap((c) => c.tags ?? []))), [customers])
  const allCities = useMemo(() => Array.from(new Set(customers.map((c) => c.city).filter(Boolean))) as string[], [customers])

  const convertedThisMonth = useMemo(() => {
    const now = new Date()
    return customers.filter((c) => {
      const d = new Date(c.created_at)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    }).length
  }, [customers])

  const activeFilterCount = [tagFilter, cityFilter].filter(Boolean).length

  const filteredCustomers = useMemo(() => {
    const filtered = customers.filter((c) => {
      const q = query.trim().toLowerCase()
      const matchesQuery =
        q.length === 0 ||
        c.full_name.toLowerCase().includes(q) ||
        (c.email ?? '').toLowerCase().includes(q) ||
        (c.city ?? '').toLowerCase().includes(q) ||
        (c.tags ?? []).some((t) => t.toLowerCase().includes(q))
      const matchesTag = !tagFilter || (c.tags ?? []).includes(tagFilter)
      const matchesCity = !cityFilter || c.city === cityFilter
      return matchesQuery && matchesTag && matchesCity
    })
    const sorted = [...filtered]
    if (sortMode === 'az') sorted.sort((a, b) => a.full_name.localeCompare(b.full_name))
    else sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    return sorted
  }, [customers, query, sortMode, tagFilter, cityFilter])

  async function handleDelete(customer: CustomerRow) {
    if (!window.confirm(`Delete ${customer.full_name}? This cannot be undone.`)) return
    const supabase = createClient()
    const { error } = await supabase.from('customers').delete().eq('id', customer.id)
    if (error) {
      window.alert(error.message)
      return
    }
    setCustomers((prev) => prev.filter((c) => c.id !== customer.id))
  }

  async function handleStartDeal(customer: CustomerRow) {
    const title = window.prompt(`Deal title for ${customer.full_name}:`, `${customer.full_name} — New Deal`)
    if (!title) return

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return
    const { data: me } = await supabase.from('platform_users').select('id, org_id').eq('auth_user_id', user.id).single()
    if (!me?.org_id) return

    const { error } = await supabase.from('deals').insert({
      org_id: me.org_id,
      owner_id: me.id,
      customer_id: customer.id,
      title,
    })
    if (error) {
      window.alert(error.message)
      return
    }
    router.push('/deals')
  }

  function handleExport() {
    const rows = [
      ['Name', 'Email', 'Phone', 'City', 'Tags', 'Open Deals', 'Owner'],
      ...filteredCustomers.map((c) => [
        c.full_name,
        c.email ?? '',
        c.phone ?? '',
        c.city ?? '',
        (c.tags ?? []).join('; '),
        c.open_deals.toString(),
        c.owner?.full_name ?? '',
      ]),
    ]
    const csv = rows.map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `customers-export-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          crumbs={[{ label: 'Sales' }, { label: 'Customers' }]}
          title="Customers"
          description={`${customers.length} total customers · ${convertedThisMonth} added this month`}
        />
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download data-icon="inline-start" />
            Export
          </Button>
          <CreateCustomerDialog
            trigger={
              <Button size="sm" className="bg-foreground text-background hover:bg-foreground/85">
                <Plus data-icon="inline-start" />
                New Customer
              </Button>
            }
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <InputGroup className="w-full sm:w-64">
          <InputGroupAddon>
            <Search className="size-4" />
          </InputGroupAddon>
          <InputGroupInput placeholder="Search customers…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </InputGroup>

        <div className="relative flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" size="sm">
                  {sortMode === 'recent' ? <Clock data-icon="inline-start" /> : <ArrowDownAZ data-icon="inline-start" />}
                  {sortMode === 'recent' ? 'Recently added' : 'Name A-Z'}
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSortMode('recent')}>
                <Clock className="size-3.5" />
                Recently added
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortMode('az')}>
                <ArrowDownAZ className="size-3.5" />
                Name A-Z
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
            <div className="absolute top-full right-0 z-30 mt-1.5 w-64 rounded-xl border border-border bg-card p-4 shadow-lg">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-foreground/80">Tag</label>
                  <select
                    value={tagFilter}
                    onChange={(e) => setTagFilter(e.target.value)}
                    className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-[13px] outline-none dark:bg-input/30"
                  >
                    <option value="">Any</option>
                    {allTags.map((t) => (
                      <option key={t} value={t}>
                        {t}
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
                    {allCities.map((c) => (
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
                      setTagFilter('')
                      setCityFilter('')
                    }}
                  >
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
          <table className="w-full min-w-[1180px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-border text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">City</th>
                <th className="px-4 py-3">Tags</th>
                <th className="px-4 py-3">AI Summary</th>
                <th className="px-4 py-3">Open Deals</th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="border-b border-border/70 transition-colors last:border-b-0 hover:bg-accent/50">
                  <td className="px-4 py-3">
                    <Link href={`/customers/${customer.id}`} className="flex items-center gap-2.5">
                      <Avatar size="sm">
                        <AvatarFallback>{getInitials(customer.full_name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate font-medium text-foreground hover:underline">{customer.full_name}</span>
                        <span className="truncate text-[12px] text-muted-foreground">{customer.email ?? '—'}</span>
                      </div>
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-foreground/80">{customer.phone ?? '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-foreground/80">{customer.city ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {(customer.tags ?? []).map((tag) => (
                        <Badge key={tag} variant="outline" className="rounded-full bg-secondary text-secondary-foreground">
                          {tag}
                        </Badge>
                      ))}
                      {(customer.tags ?? []).length === 0 && <span className="text-muted-foreground">—</span>}
                    </div>
                  </td>
                  <td className="max-w-[280px] px-4 py-3 text-foreground/80">
                    {customer.ai_summary ? (
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="size-3.5 shrink-0 text-primary" />
                        <span className="truncate">{customer.ai_summary}</span>
                      </div>
                    ) : (
                      <Link href="/ai-workspace/customer-summary" className="text-primary hover:underline">
                        Generate summary
                      </Link>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <Badge
                      variant="outline"
                      className={cn('rounded-full', customer.open_deals > 0 ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground')}
                    >
                      {customer.open_deals} active
                    </Badge>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-foreground/80">{customer.owner?.full_name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        disabled={!customer.phone}
                        aria-label={`Call ${customer.full_name}`}
                        render={<a href={customer.phone ? `tel:${customer.phone}` : undefined} />}
                        nativeButton={false}
                      >
                        <Phone className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        disabled={!customer.phone}
                        aria-label={`WhatsApp ${customer.full_name}`}
                        render={<a href={customer.phone ? `https://wa.me/${customer.phone.replace(/\D/g, '')}` : undefined} target="_blank" rel="noreferrer" />}
                        nativeButton={false}
                      >
                        <MessageCircle className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        disabled={!customer.email}
                        aria-label={`Email ${customer.full_name}`}
                        render={<a href={customer.email ? `mailto:${customer.email}` : undefined} />}
                        nativeButton={false}
                      >
                        <Mail className="size-3.5" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button variant="ghost" size="icon-sm" aria-label={`More actions for ${customer.full_name}`}>
                              <MoreHorizontal className="size-3.5" />
                            </Button>
                          }
                        />
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem render={<Link href={`/customers/${customer.id}`} />}>View profile</DropdownMenuItem>
                          <DropdownMenuItem render={<Link href={`/customers/${customer.id}`} />}>Edit customer</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStartDeal(customer)}>Start new deal</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem variant="destructive" onClick={() => handleDelete(customer)}>
                            Delete customer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                    No customers match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
