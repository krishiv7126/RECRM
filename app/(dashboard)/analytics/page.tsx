import { AnalyticsView } from '@/components/analytics/analytics-view'
import { getAnalyticsData, type RangeKey } from '@/lib/analytics/get-analytics-data'

const validRanges: RangeKey[] = ['7d', '30d', '90d', 'ytd']

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>
}) {
  const { range: rangeParam } = await searchParams
  const range = validRanges.includes(rangeParam as RangeKey) ? (rangeParam as RangeKey) : '30d'
  const data = await getAnalyticsData(range)

  return <AnalyticsView data={data} range={range} />
}
