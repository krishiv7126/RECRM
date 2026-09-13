import type { Metadata } from 'next'
import { AiDailyBrief } from '@/components/dashboard/ai-daily-brief'
import { GreetingHeader } from '@/components/dashboard/greeting-header'
import { KpiCards } from '@/components/dashboard/kpi-cards'
import { LeadSourcesChart } from '@/components/dashboard/lead-sources-chart'
import { PriorityQueue } from '@/components/dashboard/priority-queue'
import { RevenueChart } from '@/components/dashboard/revenue-chart'
import { TeamPerformanceCard } from '@/components/dashboard/team-performance-card'
import { getDashboardData } from '@/lib/dashboard/get-dashboard-data'
import { getStaffData } from '@/lib/staff/get-staff-data'
import { getCurrentProfile } from '@/lib/supabase/current-user'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  // getCurrentProfile is request-cached and the layout already awaited it, so
  // this resolves without another trip to Supabase.
  const [me, data] = await Promise.all([getCurrentProfile(), getDashboardData()])
  const isAdmin = me?.role === 'admin' || me?.role === 'super_admin'
  const staffData = isAdmin ? await getStaffData() : null

  return (
    <div className="flex flex-col gap-6">
      <GreetingHeader fullName={me?.full_name ?? 'there'} />
      <AiDailyBrief
        topHotLead={data.topHotLead}
        biggestActiveDeal={data.biggestActiveDeal}
        hotLeadsCount={data.hotLeadsCount}
        activePipelineValue={data.activePipelineValue}
      />
      <KpiCards
        totalLeads={data.totalLeads}
        activeDeals={data.activeDeals}
        revenueMtd={data.revenueMtd}
        visitsToday={data.visitsToday}
        kpiDeltas={data.kpiDeltas}
      />
      <PriorityQueue data={data.priorityQueue} />
      {staffData && <TeamPerformanceCard staff={staffData.staff} />}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <RevenueChart data={data.monthlyRevenueSeries} />
        </div>
        <div className="lg:col-span-2">
          <LeadSourcesChart data={data.leadSourceBreakdown} totalLeads={data.totalLeads} />
        </div>
      </div>
    </div>
  )
}
