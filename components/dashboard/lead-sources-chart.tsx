'use client'

import { Cell, Pie, PieChart } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'

interface SourceItem {
  source: string
  slug: string
  count: number
}

export function LeadSourcesChart({ data, totalLeads }: { data: SourceItem[]; totalLeads: number }) {
  const palette = [
    'var(--chart-1)',
    'var(--chart-2)',
    'var(--chart-3)',
    'var(--chart-4)',
    'var(--chart-5)',
    'var(--chart-6)',
    'var(--chart-7)',
  ]

  const chartConfig: ChartConfig = data.reduce((acc, item, i) => {
    acc[item.slug] = { label: item.source, color: palette[i % palette.length] }
    return acc
  }, {} as ChartConfig)

  return (
    <Card className="rounded-2xl border-border shadow-sm">
      <CardHeader>
        <CardTitle className="font-heading text-base font-bold">Lead Sources</CardTitle>
        <p className="text-[13px] text-muted-foreground">Where your {totalLeads} leads originated</p>
      </CardHeader>
      <CardContent className="flex min-w-0 flex-col items-center gap-5 sm:flex-row sm:items-center sm:justify-between">
        {data.length === 0 ? (
          <p className="w-full py-8 text-center text-[13px] text-muted-foreground">No leads yet.</p>
        ) : (
          <>
            <ChartContainer config={chartConfig} className="aspect-square h-44 w-44 shrink-0">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="source" />} />
                <Pie
                  data={data}
                  dataKey="count"
                  nameKey="source"
                  innerRadius={48}
                  outerRadius={72}
                  strokeWidth={3}
                  stroke="var(--card)"
                >
                  {data.map((entry) => (
                    <Cell key={entry.slug} fill={`var(--color-${entry.slug})`} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>

            <ul className="flex w-full min-w-0 flex-1 flex-col gap-2.5">
              {data.map((item) => (
                <li key={item.slug} className="flex items-center justify-between gap-3 text-[13px]">
                  <span className="flex min-w-0 items-center gap-2 text-foreground/80">
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: `var(--color-${item.slug})` }}
                    />
                    <span className="truncate">{item.source}</span>
                  </span>
                  <span className="shrink-0 font-heading font-semibold text-foreground">{item.count}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  )
}
