'use client'

import { useMemo, useState } from 'react'
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
import { cn } from '@/lib/utils'

interface CustomerRow {
  id: string
  full_name: string
  email: string
  phone: string
  city: string
  tags: string[]
  ai_summary: string
  open_deals: number
  owner_full_name: string
  added_rank: number
}

const customerRows: CustomerRow[] = [
  { id: 'cust_101', full_name: 'Arjun Reddy', email: 'arjun.reddy@hotmail.com', phone: '+91 98450 33221', city: 'Chennai', tags: ['Investor', 'Repeat Buyer'], ai_summary: 'Closed a luxury villa in ECR; actively scouting a second unit for rental yield near OMR.', open_deals: 1, owner_full_name: 'Karan Shetty', added_rank: 1 },
  { id: 'cust_102', full_name: 'Riya Saxena', email: 'riya.saxena@gmail.com', phone: '+91 97400 12309', city: 'Bengaluru', tags: ['Repeat Buyer'], ai_summary: 'Converted from a hot lead; happy with RR Nagar purchase and open to referrals from her circle.', open_deals: 0, owner_full_name: 'Meera Iyer', added_rank: 2 },
  { id: 'cust_103', full_name: 'Kabir Malhotra', email: 'kabir.malhotra@gmail.com', phone: '+91 90080 44112', city: 'Mumbai', tags: ['NRI', 'Investor'], ai_summary: 'NRI based in Dubai; prefers WhatsApp updates and wants ready-to-move 2BHK options in Andheri.', open_deals: 2, owner_full_name: 'Priya Nair', added_rank: 3 },
  { id: 'cust_104', full_name: 'Sanjana Iyer', email: 'sanjana.iyer@gmail.com', phone: '+91 99860 55231', city: 'Pune', tags: ['First-time Buyer'], ai_summary: 'First-time homebuyer, sensitive to loan EMI terms; wants clarity on possession timelines.', open_deals: 1, owner_full_name: 'Rohan Verma', added_rank: 4 },
  { id: 'cust_105', full_name: 'Devansh Oberoi', email: 'devansh.oberoi@gmail.com', phone: '+91 98220 90871', city: 'Gurgaon', tags: ['Investor'], ai_summary: 'Portfolio investor with 3 prior purchases; evaluating commercial spaces in Sector 62 next.', open_deals: 0, owner_full_name: 'Aditya Rao', added_rank: 5 },
  { id: 'cust_106', full_name: 'Meghana Rao', email: 'meghana.rao@gmail.com', phone: '+91 99860 44201', city: 'Bengaluru', tags: ['Repeat Buyer', 'NRI'], ai_summary: 'Recently relocated from Singapore; finalizing paperwork for a premium villa in Whitefield.', open_deals: 1, owner_full_name: 'Priya Nair', added_rank: 6 },
  { id: 'cust_107', full_name: 'Farhan Sheikh', email: 'farhan.sheikh@gmail.com', phone: '+91 96630 77654', city: 'Hyderabad', tags: ['First-time Buyer'], ai_summary: 'Budget-conscious buyer in Jubilee Hills; responds fastest to calls over email.', open_deals: 0, owner_full_name: 'Karan Shetty', added_rank: 7 },
  { id: 'cust_108', full_name: 'Ishita Bose', email: 'ishita.bose@gmail.com', phone: '+91 90190 22876', city: 'Noida', tags: ['Investor', 'Repeat Buyer'], ai_summary: 'Long-term client with 4 units across Noida; prioritizes rental-yield micro-markets.', open_deals: 2, owner_full_name: 'Rohan Verma', added_rank: 8 },
  { id: 'cust_109', full_name: 'Aarav Chandran', email: 'aarav.chandran@gmail.com', phone: '+91 98330 11298', city: 'Chennai', tags: ['NRI'], ai_summary: 'Based in Singapore, prefers video walkthroughs; targeting a 3BHK for parents in ECR.', open_deals: 1, owner_full_name: 'Meera Iyer', added_rank: 9 },
  { id: 'cust_110', full_name: 'Nandini Kapoor', email: 'nandini.kapoor@gmail.com', phone: '+91 90350 66542', city: 'Mumbai', tags: ['Repeat Buyer'], ai_summary: 'Upgrading from a 2BHK to a 3BHK in Powai; strong relationship, low price sensitivity.', open_deals: 1, owner_full_name: 'Aditya Rao', added_rank: 10 },
]

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

type SortMode = 'recent' | 'az'

export default function CustomersPage() {
  const [query, setQuery] = useState('')
  const [sortMode, setSortMode] = useState<SortMode>('recent')

  const convertedThisMonth = 6

  const filteredCustomers = useMemo(() => {
    const filtered = customerRows.filter((customer) => {
      if (query.trim().length === 0) return true
      const q = query.toLowerCase()
      return (
        customer.full_name.toLowerCase().includes(q) ||
        customer.email.toLowerCase().includes(q) ||
        customer.city.toLowerCase().includes(q) ||
        customer.tags.some((tag) => tag.toLowerCase().includes(q))
      )
    })

    const sorted = [...filtered]
    if (sortMode === 'az') {
      sorted.sort((a, b) => a.full_name.localeCompare(b.full_name))
    } else {
      sorted.sort((a, b) => a.added_rank - b.added_rank)
    }
    return sorted
  }, [query, sortMode])

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          crumbs={[{ label: 'Sales' }, { label: 'Customers' }]}
          title="Customers"
          description={`342 total customers · ${convertedThisMonth} converted this month`}
        />
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" size="sm">
            <Download data-icon="inline-start" />
            Export
          </Button>
          <Button size="sm" className="bg-foreground text-background hover:bg-foreground/85">
            <Plus data-icon="inline-start" />
            New Customer
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <InputGroup className="w-full sm:w-64">
          <InputGroupAddon>
            <Search className="size-4" />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Search customers…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </InputGroup>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" size="sm">
                  {sortMode === 'recent' ? (
                    <Clock data-icon="inline-start" />
                  ) : (
                    <ArrowDownAZ data-icon="inline-start" />
                  )}
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
          <Button variant="outline" size="sm">
            <Filter data-icon="inline-start" />
            Filter
          </Button>
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
                <tr
                  key={customer.id}
                  className="border-b border-border/70 transition-colors last:border-b-0 hover:bg-accent/50"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar size="sm">
                        <AvatarFallback>{getInitials(customer.full_name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate font-medium text-foreground">{customer.full_name}</span>
                        <span className="truncate text-[12px] text-muted-foreground">{customer.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-foreground/80">{customer.phone}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-foreground/80">{customer.city}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {customer.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="rounded-full bg-secondary text-secondary-foreground">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="max-w-[280px] px-4 py-3 text-foreground/80">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="size-3.5 shrink-0 text-primary" />
                      <span className="truncate">{customer.ai_summary}</span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <Badge
                      variant="outline"
                      className={cn(
                        'rounded-full',
                        customer.open_deals > 0
                          ? 'bg-primary/15 text-primary'
                          : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {customer.open_deals} active
                    </Badge>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-foreground/80">{customer.owner_full_name}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" aria-label={`Call ${customer.full_name}`}>
                        <Phone className="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" aria-label={`WhatsApp ${customer.full_name}`}>
                        <MessageCircle className="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" aria-label={`Email ${customer.full_name}`}>
                        <Mail className="size-3.5" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`More actions for ${customer.full_name}`}
                            >
                              <MoreHorizontal className="size-3.5" />
                            </Button>
                          }
                        />
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View profile</DropdownMenuItem>
                          <DropdownMenuItem>Edit customer</DropdownMenuItem>
                          <DropdownMenuItem>Start new deal</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem variant="destructive">Delete customer</DropdownMenuItem>
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
