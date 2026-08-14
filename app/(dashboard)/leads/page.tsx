'use client'

import { useMemo, useState } from 'react'
import {
  Download,
  Filter,
  Flame,
  Mail,
  MessageCircle,
  MoreHorizontal,
  Phone,
  Plus,
  Search,
  Upload,
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
import { cn } from '@/lib/utils'

type LeadStage = 'new' | 'contacted' | 'qualified' | 'proposal' | 'site_visit' | 'won' | 'lost'
type LeadTemperature = 'hot' | 'warm' | 'cold'

interface LeadRow {
  id: string
  full_name: string
  email: string
  requirement: string
  budget_min: number
  budget_max: number
  city: string
  source: string
  stage: LeadStage
  temperature: LeadTemperature
  ai_score: number
  owner_full_name: string
}

const leadRows: LeadRow[] = [
  { id: 'lead_101', full_name: 'Nikhil Bhatia', email: 'nikhil.bhatia@gmail.com', requirement: '3BHK apartment in Powai', budget_min: 9500000, budget_max: 12000000, city: 'Mumbai', source: 'Meta Ads', stage: 'proposal', temperature: 'hot', ai_score: 92, owner_full_name: 'Meera Iyer' },
  { id: 'lead_102', full_name: 'Ananya Deshpande', email: 'ananya.d@outlook.com', requirement: '2BHK near Baner', budget_min: 6000000, budget_max: 7500000, city: 'Pune', source: 'Google', stage: 'site_visit', temperature: 'hot', ai_score: 88, owner_full_name: 'Karan Shetty' },
  { id: 'lead_103', full_name: 'Rahul Menon', email: 'rahul.menon@yahoo.com', requirement: 'Villa in Devanahalli', budget_min: 15000000, budget_max: 18000000, city: 'Bengaluru', source: 'Referral', stage: 'qualified', temperature: 'warm', ai_score: 74, owner_full_name: 'Priya Nair' },
  { id: 'lead_104', full_name: 'Sneha Kulkarni', email: 'sneha.k@gmail.com', requirement: '1BHK for investment', budget_min: 4500000, budget_max: 5500000, city: 'Noida', source: 'Website', stage: 'contacted', temperature: 'warm', ai_score: 61, owner_full_name: 'Rohan Verma' },
  { id: 'lead_105', full_name: 'Vikram Malhotra', email: 'vikram.malhotra@gmail.com', requirement: '2BHK in Sector 62', budget_min: 8000000, budget_max: 9000000, city: 'Gurgaon', source: '99acres', stage: 'new', temperature: 'cold', ai_score: 38, owner_full_name: 'Aditya Rao' },
  { id: 'lead_106', full_name: 'Divya Prakash', email: 'divya.prakash@gmail.com', requirement: '3BHK in Jubilee Hills', budget_min: 11000000, budget_max: 13500000, city: 'Hyderabad', source: 'Meta Ads', stage: 'proposal', temperature: 'hot', ai_score: 90, owner_full_name: 'Meera Iyer' },
  { id: 'lead_107', full_name: 'Arjun Reddy', email: 'arjun.reddy@hotmail.com', requirement: 'Luxury villa in ECR', budget_min: 20000000, budget_max: 24000000, city: 'Chennai', source: 'Walk-in', stage: 'won', temperature: 'hot', ai_score: 95, owner_full_name: 'Karan Shetty' },
  { id: 'lead_108', full_name: 'Kavya Subramaniam', email: 'kavya.s@gmail.com', requirement: '2BHK near Wakad', budget_min: 5000000, budget_max: 6200000, city: 'Pune', source: 'Google', stage: 'contacted', temperature: 'warm', ai_score: 55, owner_full_name: 'Priya Nair' },
  { id: 'lead_109', full_name: 'Siddharth Rao', email: 'siddharth.rao@gmail.com', requirement: '2BHK apartment resale', budget_min: 7000000, budget_max: 8500000, city: 'Noida', source: 'Referral', stage: 'lost', temperature: 'cold', ai_score: 22, owner_full_name: 'Rohan Verma' },
  { id: 'lead_110', full_name: 'Pooja Agarwal', email: 'pooja.agarwal@gmail.com', requirement: '3BHK in Andheri West', budget_min: 16000000, budget_max: 19000000, city: 'Mumbai', source: 'Website', stage: 'qualified', temperature: 'warm', ai_score: 68, owner_full_name: 'Aditya Rao' },
  { id: 'lead_111', full_name: 'Aditi Chauhan', email: 'aditi.chauhan@gmail.com', requirement: '2BHK in DLF Phase 3', budget_min: 6500000, budget_max: 8000000, city: 'Gurgaon', source: 'Meta Ads', stage: 'site_visit', temperature: 'hot', ai_score: 84, owner_full_name: 'Meera Iyer' },
  { id: 'lead_112', full_name: 'Manish Tiwari', email: 'manish.tiwari@gmail.com', requirement: '1BHK studio', budget_min: 4000000, budget_max: 4800000, city: 'Hyderabad', source: '99acres', stage: 'new', temperature: 'cold', ai_score: 30, owner_full_name: 'Karan Shetty' },
]

function formatCr(amount: number) {
  return amount >= 10000000 ? `₹${(amount / 10000000).toFixed(1)}Cr` : `₹${Math.round(amount / 100000)}L`
}

function formatBudgetRange(min: number, max: number) {
  return `${formatCr(min)} – ${formatCr(max)}`
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

const stageLabels: Record<LeadStage, string> = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  proposal: 'Proposal',
  site_visit: 'Site Visit',
  won: 'Won',
  lost: 'Lost',
}

const stageStyles: Record<LeadStage, string> = {
  new: 'bg-muted text-muted-foreground',
  contacted: 'bg-accent text-accent-foreground',
  qualified: 'bg-secondary text-secondary-foreground',
  proposal: 'bg-primary/15 text-primary',
  site_visit: 'border border-primary/40 bg-transparent text-primary',
  won: 'bg-success/15 text-success',
  lost: 'bg-destructive/10 text-destructive',
}

const temperatureStyles: Record<LeadTemperature, string> = {
  hot: 'border-destructive/30 bg-destructive/10 text-destructive',
  warm: 'border-primary/30 bg-primary/10 text-primary',
  cold: 'border-border bg-muted text-muted-foreground',
}

const temperatureLabels: Record<LeadTemperature, string> = {
  hot: 'Hot',
  warm: 'Warm',
  cold: 'Cold',
}

type FilterTab = 'all' | 'hot' | 'new' | 'won'

export default function LeadsPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [query, setQuery] = useState('')

  const counts = useMemo(
    () => ({
      all: leadRows.length,
      hot: leadRows.filter((lead) => lead.temperature === 'hot').length,
      new: leadRows.filter((lead) => lead.stage === 'new').length,
      won: leadRows.filter((lead) => lead.stage === 'won').length,
    }),
    [],
  )

  const filteredLeads = useMemo(() => {
    return leadRows.filter((lead) => {
      const matchesTab =
        activeTab === 'all' ||
        (activeTab === 'hot' && lead.temperature === 'hot') ||
        (activeTab === 'new' && lead.stage === 'new') ||
        (activeTab === 'won' && lead.stage === 'won')

      const matchesQuery =
        query.trim().length === 0 ||
        lead.full_name.toLowerCase().includes(query.toLowerCase()) ||
        lead.email.toLowerCase().includes(query.toLowerCase()) ||
        lead.city.toLowerCase().includes(query.toLowerCase())

      return matchesTab && matchesQuery
    })
  }, [activeTab, query])

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: counts.all },
    { key: 'hot', label: 'Hot 🔥', count: counts.hot },
    { key: 'new', label: 'New', count: counts.new },
    { key: 'won', label: 'Won', count: counts.won },
  ]

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          crumbs={[{ label: 'Sales' }, { label: 'Pipeline' }, { label: 'Leads' }]}
          title="Leads"
          description="1,284 total · 47 new today · 5 hot leads waiting"
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
            New Lead
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
              placeholder="Search leads…"
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

      <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-border">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-border text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">Lead</th>
                <th className="px-4 py-3">Interest</th>
                <th className="px-4 py-3">Budget</th>
                <th className="px-4 py-3">City</th>
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
                    <div className="flex items-center gap-2.5">
                      <Avatar size="sm">
                        <AvatarFallback>{getInitials(lead.full_name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate font-medium text-foreground">{lead.full_name}</span>
                        <span className="truncate text-[12px] text-muted-foreground">{lead.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="max-w-[220px] px-4 py-3 text-foreground/80">
                    <span className="line-clamp-2">{lead.requirement}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-foreground">
                    {formatBudgetRange(lead.budget_min, lead.budget_max)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-foreground/80">{lead.city}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-foreground/80">{lead.source}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <Badge className={cn('rounded-full', stageStyles[lead.stage])} variant="outline">
                      {stageLabels[lead.stage]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex w-16 flex-col gap-1">
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${lead.ai_score}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-semibold text-foreground">{lead.ai_score}</span>
                      </div>
                      <Badge variant="outline" className={cn('rounded-full', temperatureStyles[lead.temperature])}>
                        {lead.temperature === 'hot' && <Flame className="size-3" />}
                        {temperatureLabels[lead.temperature]}
                      </Badge>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-foreground/80">{lead.owner_full_name}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" aria-label={`Call ${lead.full_name}`}>
                        <Phone className="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" aria-label={`WhatsApp ${lead.full_name}`}>
                        <MessageCircle className="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" aria-label={`Email ${lead.full_name}`}>
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
                          <DropdownMenuItem>View profile</DropdownMenuItem>
                          <DropdownMenuItem>Edit lead</DropdownMenuItem>
                          <DropdownMenuItem>Move to deal</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem variant="destructive">Delete lead</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredLeads.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
                    No leads match your filters.
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
