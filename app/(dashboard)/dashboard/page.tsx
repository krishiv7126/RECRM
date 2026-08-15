import { AiDailyBrief } from '@/components/dashboard/ai-daily-brief'
import { GreetingHeader } from '@/components/dashboard/greeting-header'
import { KpiCards } from '@/components/dashboard/kpi-cards'
import { LeadSourcesChart } from '@/components/dashboard/lead-sources-chart'
import { RevenueChart } from '@/components/dashboard/revenue-chart'
import { getDashboardData } from '@/lib/dashboard/get-dashboard-data'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [{ data: me }, data] = await Promise.all([
    user
      ? supabase.from('platform_users').select('full_name').eq('auth_user_id', user.id).single()
      : Promise.resolve({ data: null }),
    getDashboardData(),
  ])

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
