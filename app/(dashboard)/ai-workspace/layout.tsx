import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { default: 'AI Workspace', template: '%s · Vardaan ERP' },
}

export default function AiWorkspaceLayout({ children }: { children: React.ReactNode }) {
  return children
}
