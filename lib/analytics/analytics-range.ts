// Client-safe: imported by both the server data layer and the client view.
// Keep free of anything that touches next/headers.

export type RangeKey = '7d' | '30d' | '90d' | 'ytd'

export const rangeOptions: { key: RangeKey; label: string }[] = [
  { key: '7d', label: 'Last 7 days' },
  { key: '30d', label: 'Last 30 days' },
  { key: '90d', label: 'Last 90 days' },
  { key: 'ytd', label: 'This year' },
]

export function rangeLabel(key: RangeKey) {
  return rangeOptions.find((r) => r.key === key)?.label ?? 'Last 30 days'
}
