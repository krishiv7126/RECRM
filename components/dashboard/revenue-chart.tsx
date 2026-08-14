'use client'

import { Area, AreaChart, CartesianGrid, Line, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { monthlyRevenueSeries } from '@/lib/dashboard-metrics'

const chartConfig: ChartConfig = {
  revenue: {
    label: 'Revenue',
    color: 'var(--chart-1)',
  },
  target: {
    label: 'Target',
    color: 'var(--chart-2)',
  },
}

export function RevenueChart() {
  return (
    <Card className="rounded-2xl border-border shadow-sm">
      <CardHeader>
        <CardTitle className="font-heading text-base font-bold">Monthly Revenue</CardTitle>
        <p className="text-[13px] text-muted-foreground">
          Booked deal value vs. revenue target, last 8 months
        </p>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-auto h-72 w-full">
          <AreaChart data={monthlyRevenueSeries} margin={{ left: 4, right: 8, top: 8 }}>
            <defs>
              <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-revenue)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--color-revenue)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              fontSize={12}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={12}
              tickFormatter={(value) => `₹${Number(value).toFixed(1)}Cr`}
              width={68}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => [
                    `₹${value} Cr`,
                    name === 'revenue' ? 'Revenue' : 'Target',
                  ]}
                />
              }
            />
            <Area
              dataKey="revenue"
              type="monotone"
              stroke="var(--color-revenue)"
              strokeWidth={2.5}
              fill="url(#revenueFill)"
            />
            <Line
              dataKey="target"
              type="monotone"
              stroke="var(--color-target)"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
