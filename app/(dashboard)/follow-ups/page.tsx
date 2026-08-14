'use client'

import { useMemo, useState } from 'react'
import {
  Calendar,
  Clock,
  Filter,
  Mail,
  MessageCircle,
  MoreHorizontal,
  Phone,
  Plus,
  Search,
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

type FollowUpType = 'call' | 'whatsapp' | 'email' | 'meeting'
type FollowUpStatus = 'pending' | 'done' | 'missed'

interface FollowUpRow {
  id: string
  type: FollowUpType
  linked_record: string
  notes: string
  due_at: string
  due_label: string
  overdue: boolean
  status: FollowUpStatus
  owner_full_name: string
}

const followUpRows: FollowUpRow[] = [
  { id: 'fu_101', type: 'call', linked_record: 'Nikhil Bhatia', notes: 'Confirm budget flexibility before sending revised proposal.', due_at: '2026-08-12T10:00:00', due_label: 'Today, 10:00 AM', overdue: true, status: 'pending', owner_full_name: 'Meera Iyer' },
  { id: 'fu_102', type: 'whatsapp', linked_record: 'Ananya Deshpande', notes: 'Share Baner site visit photos and floor plan PDF.', due_at: '2026-08-12T09:30:00', due_label: 'Today, 9:30 AM', overdue: true, status: 'pending', owner_full_name: 'Karan Shetty' },
  { id: 'fu_103', type: 'email', linked_record: 'Kabir Malhotra', notes: 'Send NRI documentation checklist and payment plan options.', due_at: '2026-08-12T14:00:00', due_label: 'Today, 2:00 PM', overdue: false, status: 'pending', owner_full_name: 'Priya Nair' },
  { id: 'fu_104', type: 'meeting', linked_record: 'D-204 · Devansh Oberoi', notes: 'Site walkthrough for Sector 62 commercial unit with architect.', due_at: '2026-08-12T16:30:00', due_label: 'Today, 4:30 PM', overdue: false, status: 'pending', owner_full_name: 'Aditya Rao' },
  { id: 'fu_105', type: 'call', linked_record: 'Rahul Menon', notes: 'Discuss loan pre-approval status before villa negotiation.', due_at: '2026-08-11T11:00:00', due_label: 'Yesterday, 11:00 AM', overdue: true, status: 'missed', owner_full_name: 'Priya Nair' },
  { id: 'fu_106', type: 'whatsapp', linked_record: 'Sneha Kulkarni', notes: 'Follow up on 1BHK investment shortlist sent last week.', due_at: '2026-08-13T09:00:00', due_label: 'Tomorrow, 9:00 AM', overdue: false, status: 'pending', owner_full_name: 'Rohan Verma' },
  { id: 'fu_107', type: 'email', linked_record: 'Riya Saxena', notes: 'Send referral thank-you note and loyalty program details.', due_at: '2026-08-10T15:00:00', due_label: 'Mon, 3:00 PM', overdue: false, status: 'done', owner_full_name: 'Meera Iyer' },
  { id: 'fu_108', type: 'call', linked_record: 'Vikram Malhotra', notes: 'Qualify budget range and preferred possession timeline.', due_at: '2026-08-12T12:00:00', due_label: 'Today, 12:00 PM', overdue: true, status: 'pending', owner_full_name: 'Aditya Rao' },
  { id: 'fu_109', type: 'meeting', linked_record: 'D-207 · Ishita Bose', notes: 'Contract signing walkthrough at Noida sales office.', due_at: '2026-08-14T11:30:00', due_label: 'Fri, 11:30 AM', overdue: false, status: 'pending', owner_full_name: 'Rohan Verma' },
  { id: 'fu_110', type: 'whatsapp', linked_record: 'Divya Prakash', notes: 'Send updated Jubilee Hills proposal with revised pricing.', due_at: '2026-08-09T17:00:00', due_label: 'Sun, 5:00 PM', overdue: false, status: 'done', owner_full_name: 'Meera Iyer' },
]

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

const typeConfig: Record<FollowUpType, { icon: typeof Phone; className: string; label: string }> = {
  call: { icon: Phone, className: 'bg-primary/15 text-primary', label: 'Call' },
  whatsapp: { icon: MessageCircle, className: 'bg-success/15 text-success', label: 'WhatsApp' },
  email: { icon: Mail, className: 'bg-secondary text-secondary-foreground', label: 'Email' },
  meeting: { icon: Calendar, className: 'border border-primary/40 bg-transparent text-primary', label: 'Meeting' },
}

const statusStyles: Record<FollowUpStatus, string> = {
  pending: 'bg-muted text-muted-foreground',
  done: 'bg-success/15 text-success',
  missed: 'bg-destructive/10 text-destructive',
}

const statusLabels: Record<FollowUpStatus, string> = {
  pending: 'Pending',
  done: 'Done',
  missed: 'Missed',
}

type FilterTab = 'all' | 'pending' | 'overdue' | 'done'

export default function FollowUpsPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [query, setQuery] = useState('')

  const counts = useMemo(
    () => ({
      all: followUpRows.length,
      pending: followUpRows.filter((f) => f.status === 'pending').length,
      overdue: followUpRows.filter((f) => f.overdue && f.status !== 'done').length,
      done: followUpRows.filter((f) => f.status === 'done').length,
    }),
    [],
  )

  const filteredFollowUps = useMemo(() => {
    return followUpRows.filter((followUp) => {
      const matchesTab =
        activeTab === 'all' ||
        (activeTab === 'pending' && followUp.status === 'pending') ||
        (activeTab === 'overdue' && followUp.overdue && followUp.status !== 'done') ||
        (activeTab === 'done' && followUp.status === 'done')

      const matchesQuery =
        query.trim().length === 0 ||
        followUp.linked_record.toLowerCase().includes(query.toLowerCase()) ||
        followUp.notes.toLowerCase().includes(query.toLowerCase())

      return matchesTab && matchesQuery
    })
  }, [activeTab, query])

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: counts.all },
    { key: 'pending', label: 'Pending', count: counts.pending },
    { key: 'overdue', label: 'Overdue', count: counts.overdue },
    { key: 'done', label: 'Done', count: counts.done },
  ]

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          crumbs={[{ label: 'Sales' }, { label: 'Pipeline' }, { label: 'Follow-ups' }]}
          title="Follow-ups"
          description={`${counts.pending} pending · ${counts.overdue} overdue today`}
        />
        <div className="flex shrink-0 items-center gap-2">
          <Button size="sm" className="bg-foreground text-background hover:bg-foreground/85">
            <Plus data-icon="inline-start" />
            New Follow-up
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
              placeholder="Search follow-ups…"
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

      <div className="flex flex-col gap-2">
        {filteredFollowUps.map((followUp) => {
          const TypeIcon = typeConfig[followUp.type].icon
          const isOverdue = followUp.overdue && followUp.status !== 'done'
          return (
            <div
              key={followUp.id}
              className="flex items-center gap-4 rounded-2xl bg-card px-4 py-3.5 ring-1 ring-border transition-colors hover:bg-accent/40"
            >
              <div
                className={cn(
                  'flex size-9 shrink-0 items-center justify-center rounded-full',
                  typeConfig[followUp.type].className,
                )}
              >
                <TypeIcon className="size-4" />
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate font-medium text-foreground">{followUp.linked_record}</span>
                <span className="truncate text-[12px] text-muted-foreground">{followUp.notes}</span>
              </div>

              <div
                className={cn(
                  'flex shrink-0 items-center gap-1.5 text-[12px]',
                  isOverdue ? 'font-semibold text-destructive' : 'text-muted-foreground',
                )}
              >
                <Clock className="size-3.5" />
                {followUp.due_label}
              </div>

              <div className="hidden shrink-0 items-center gap-2 sm:flex">
                <Avatar size="sm">
                  <AvatarFallback>{getInitials(followUp.owner_full_name)}</AvatarFallback>
                </Avatar>
                <span className="text-[13px] text-foreground/80">{followUp.owner_full_name}</span>
              </div>

              <Badge variant="outline" className={cn('shrink-0 rounded-full', statusStyles[followUp.status])}>
                {statusLabels[followUp.status]}
              </Badge>

              <div className="flex shrink-0 items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={followUp.status === 'done'}
                  className="text-[12px]"
                >
                  Mark done
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button variant="ghost" size="icon-sm" aria-label={`More actions for ${followUp.linked_record}`}>
                        <MoreHorizontal className="size-3.5" />
                      </Button>
                    }
                  />
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>View record</DropdownMenuItem>
                    <DropdownMenuItem>Reschedule</DropdownMenuItem>
                    <DropdownMenuItem>Reassign owner</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive">Delete follow-up</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )
        })}

        {filteredFollowUps.length === 0 && (
          <div className="rounded-2xl bg-card px-4 py-12 text-center text-muted-foreground ring-1 ring-border">
            No follow-ups match your filters.
          </div>
        )}
      </div>
    </div>
  )
}
