'use client'

import { Download, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CreateLeadDialog } from '@/components/leads/create-lead-dialog'

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

interface ExportData {
  totalLeads: number
  activeDeals: number
  revenueMtd: number
  visitsToday: number
  monthlyRevenueSeries: { month: string; revenue: number; target: number }[]
}

function exportKpisAsCsv(data: ExportData) {
  const rows = [
    ['Metric', 'Value'],
    ['Total Leads', data.totalLeads.toString()],
    ['Active Deals', data.activeDeals.toString()],
    ['Revenue MTD (Cr)', (data.revenueMtd / 10000000).toFixed(2)],
    ['Visits Today', data.visitsToday.toString()],
    [],
    ['Month', 'Revenue (Cr)', 'Target (Cr)'],
    ...data.monthlyRevenueSeries.map((m) => [m.month, m.revenue.toString(), m.target.toString()]),
  ]
  const csv = rows.map((r) => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `dashboard-export-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function GreetingHeader({ fullName, exportData }: { fullName: string; exportData: ExportData }) {
  const firstName = fullName.split(' ')[0] || fullName

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-heading text-2xl font-extrabold text-foreground text-balance sm:text-[28px]">
          {getGreeting()}, {firstName} 👋
        </h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Here&apos;s what&apos;s happening across your portfolio today.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" className="rounded-full bg-card" onClick={() => exportKpisAsCsv(exportData)}>
          <Download data-icon="inline-start" />
          Export
        </Button>
        <CreateLeadDialog
          trigger={
            <Button className="rounded-full">
              <Plus data-icon="inline-start" />
              Create
            </Button>
          }
        />
      </div>
    </div>
  )
}
