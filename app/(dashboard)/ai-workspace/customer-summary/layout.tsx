import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Customer Summary' }

export default function CustomerSummaryLayout({ children }: { children: React.ReactNode }) {
  return children
}
