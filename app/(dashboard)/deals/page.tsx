import { MoreHorizontal, Plus, Table2, User } from 'lucide-react'
import { PageHeader } from '@/components/dashboard/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

type DealStage = 'new' | 'qualified' | 'proposal' | 'negotiation' | 'contract' | 'booked' | 'lost'

interface DealCard {
  id: string
  code: string
  property_title: string
  customer_name: string
  value: number
  expected_close_date: string
  owner_full_name: string
  stage: DealStage
}

const deals: DealCard[] = [
  { id: 'deal_1', code: 'D-201', property_title: '3BHK Skyline Residency, Powai', customer_name: 'Nikhil Bhatia', value: 11500000, expected_close_date: 'Sep 12', owner_full_name: 'Meera Iyer', stage: 'new' },
  { id: 'deal_2', code: 'D-202', property_title: '1BHK Studio, Jubilee Hills', customer_name: 'Manish Tiwari', value: 4600000, expected_close_date: 'Sep 20', owner_full_name: 'Karan Shetty', stage: 'new' },
  { id: 'deal_3', code: 'D-203', property_title: 'Villa Devanahalli Greens', customer_name: 'Rahul Menon', value: 16800000, expected_close_date: 'Sep 18', owner_full_name: 'Priya Nair', stage: 'qualified' },
  { id: 'deal_4', code: 'D-204', property_title: '3BHK Andheri West Heights', customer_name: 'Pooja Agarwal', value: 17500000, expected_close_date: 'Sep 25', owner_full_name: 'Aditya Rao', stage: 'qualified' },
  { id: 'deal_5', code: 'D-205', property_title: '3BHK Jubilee Hills Enclave', customer_name: 'Divya Prakash', value: 12200000, expected_close_date: 'Oct 02', owner_full_name: 'Meera Iyer', stage: 'proposal' },
  { id: 'deal_6', code: 'D-206', property_title: '2BHK Baner Riverside', customer_name: 'Ananya Deshpande', value: 6800000, expected_close_date: 'Sep 28', owner_full_name: 'Karan Shetty', stage: 'proposal' },
  { id: 'deal_7', code: 'D-207', property_title: '2BHK DLF Phase 3', customer_name: 'Aditi Chauhan', value: 7200000, expected_close_date: 'Sep 30', owner_full_name: 'Meera Iyer', stage: 'proposal' },
  { id: 'deal_8', code: 'D-208', property_title: '2BHK Sector 62 Residency', customer_name: 'Vikram Malhotra', value: 8400000, expected_close_date: 'Oct 05', owner_full_name: 'Aditya Rao', stage: 'negotiation' },
  { id: 'deal_9', code: 'D-209', property_title: '3BHK Whitefield Grand', customer_name: 'Meghana Rao', value: 15200000, expected_close_date: 'Oct 08', owner_full_name: 'Priya Nair', stage: 'negotiation' },
  { id: 'deal_10', code: 'D-210', property_title: '2BHK Wakad Meadows', customer_name: 'Kavya Subramaniam', value: 5900000, expected_close_date: 'Oct 10', owner_full_name: 'Priya Nair', stage: 'contract' },
  { id: 'deal_11', code: 'D-211', property_title: 'Luxury Villa ECR', customer_name: 'Arjun Reddy', value: 22500000, expected_close_date: 'Aug 30', owner_full_name: 'Karan Shetty', stage: 'booked' },
  { id: 'deal_12', code: 'D-212', property_title: '3BHK Powai Crest', customer_name: 'Nandini Kapoor', value: 17800000, expected_close_date: 'Sep 05', owner_full_name: 'Aditya Rao', stage: 'booked' },
]

const stageOrder: DealStage[] = ['new', 'qualified', 'proposal', 'negotiation', 'contract', 'booked']

const stageMeta: Record<DealStage, { label: string; dot: string }> = {
  new: { label: 'New', dot: 'bg-muted-foreground' },
  qualified: { label: 'Qualified', dot: 'bg-chart-2' },
  proposal: { label: 'Proposal', dot: 'bg-primary' },
  negotiation: { label: 'Negotiation', dot: 'bg-chart-4' },
  contract: { label: 'Contract', dot: 'bg-chart-5' },
  booked: { label: 'Booked', dot: 'bg-success' },
  lost: { label: 'Lost', dot: 'bg-destructive' },
}

function formatCr(amount: number) {
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

export default function DealsPage() {
  const totalValue = deals.reduce((sum, deal) => sum + deal.value, 0)

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          crumbs={[{ label: 'Sales' }, { label: 'Pipeline' }, { label: 'Deals' }]}
          title="Deals Pipeline"
          description={`Drag deals across stages · ${formatCr(totalValue)} in play`}
        />
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" size="sm">
            <Table2 data-icon="inline-start" />
            Table view
          </Button>
          <Button size="sm" className="bg-foreground text-background hover:bg-foreground/85">
            <Plus data-icon="inline-start" />
            New Deal
          </Button>
        </div>
      </div>

      <div className="-mx-1 flex flex-1 gap-4 overflow-x-auto px-1 pb-2">
        {stageOrder.map((stage) => {
          const stageDeals = deals.filter((deal) => deal.stage === stage)
          const stageValue = stageDeals.reduce((sum, deal) => sum + deal.value, 0)
          const meta = stageMeta[stage]

          return (
            <div key={stage} className="flex w-72 shrink-0 flex-col gap-3">
              <div className="flex items-center justify-between rounded-xl bg-card px-3 py-2.5 ring-1 ring-border">
                <div className="flex items-center gap-2">
                  <span className={cn('size-2 shrink-0 rounded-full', meta.dot)} />
                  <span className="text-[13px] font-semibold text-foreground">{meta.label}</span>
                  <Badge variant="outline" className="rounded-full bg-muted px-1.5 text-[11px] text-muted-foreground">
                    {stageDeals.length}
                  </Badge>
                </div>
                <span className="text-[12px] font-medium text-muted-foreground">{formatCr(stageValue)}</span>
              </div>

              <div className="flex flex-col gap-2.5">
                {stageDeals.map((deal) => (
                  <div
                    key={deal.id}
                    className="group flex cursor-grab flex-col gap-3 rounded-xl bg-card p-3.5 ring-1 ring-border transition-all hover:-translate-y-0.5 hover:shadow-md active:cursor-grabbing"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {deal.code}
                      </span>
                      <button
                        type="button"
                        aria-label={`More actions for ${deal.code}`}
                        className="flex size-6 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-accent hover:text-foreground group-hover:opacity-100"
                      >
                        <MoreHorizontal className="size-3.5" />
                      </button>
                    </div>

                    <p className="text-[13px] font-semibold leading-snug text-foreground text-pretty">
                      {deal.property_title}
                    </p>

                    <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                      <User className="size-3.5 shrink-0" />
                      <span className="truncate">{deal.customer_name}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="font-heading text-[15px] font-bold text-foreground">
                        {formatCr(deal.value)}
                      </span>
                      <span className="text-[12px] text-muted-foreground">{deal.expected_close_date}</span>
                    </div>

                    <div className="flex items-center gap-2 border-t border-border/70 pt-2.5">
                      <Avatar size="sm">
                        <AvatarFallback>{getInitials(deal.owner_full_name)}</AvatarFallback>
                      </Avatar>
                      <span className="truncate text-[12px] text-foreground/80">{deal.owner_full_name}</span>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-border py-2.5 text-[12px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                >
                  <Plus className="size-3.5" />
                  Add deal
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
