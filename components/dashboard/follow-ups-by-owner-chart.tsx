'use client'

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'

const chartConfig: ChartConfig = {
  overdue: { label: 'Overdue', color: 'var(--destructive)' },
  pending: { label: 'Pending', color: '#d97706' },
  done: { label: 'Completed', color: 'var(--chart-1)' },
}

interface OwnerRow {
  owner: string
  overdue: number
  pending: number
  done: number
}

export function FollowUpsByOwnerChart({ data }: { data: OwnerRow[] }) {
  return (
    <Card className="rounded-2xl border-border shadow-sm">
      <CardHeader>
        <CardTitle className="font-heading text-base font-bold">Follow-ups by Owner</CardTitle>
        <p className="text-[13px] text-muted-foreground">Overdue, pending and completed follow-ups per team member</p>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="py-16 text-center text-[13px] text-muted-foreground">No follow-ups yet.</p>
        ) : (
          <ChartContainer config={chartConfig} className="aspect-auto h-72 w-full">
            <BarChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="owner" tickLine={false} axisLine={false} tickMargin={10} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12} allowDecimals={false} width={32} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="overdue" stackId="f" fill="var(--color-overdue)" maxBarSize={48} />
              <Bar dataKey="pending" stackId="f" fill="var(--color-pending)" maxBarSize={48} />
              <Bar dataKey="done" stackId="f" fill="var(--color-done)" radius={[6, 6, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
