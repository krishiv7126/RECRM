import { AIOrb } from '@/components/ai/ai-motion'

/**
 * Shown instantly on navigation while the next page's server data loads.
 * Without this, Next.js holds the old page on screen until the new one is
 * ready, which reads as "nothing happened" for the first second after a click.
 */
export default function DashboardLoading() {
  return (
    <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center">
      <AIOrb size={36} phase="thinking" />
    </div>
  )
}
