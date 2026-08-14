import { AiDailyBrief } from '@/components/dashboard/ai-daily-brief'
import { GreetingHeader } from '@/components/dashboard/greeting-header'
import { KpiCards } from '@/components/dashboard/kpi-cards'
import { LeadSourcesChart } from '@/components/dashboard/lead-sources-chart'
import { RevenueChart } from '@/components/dashboard/revenue-chart'

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <GreetingHeader />
      <AiDailyBrief />
      <KpiCards />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <RevenueChart />
        </div>
        <div className="lg:col-span-2">
          <LeadSourcesChart />
        </div>
      </div>
    </div>
  )
}
