import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Call Summary' }

export default function CallSummaryLayout({ children }: { children: React.ReactNode }) {
  return children
}
