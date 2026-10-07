import type { Metadata } from 'next'
import { SettingsView } from '@/components/settings/settings-view'
import { getSettingsData } from '@/lib/settings/get-settings-data'

export const metadata: Metadata = { title: 'Settings' }

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const [data, { tab }] = await Promise.all([getSettingsData(), searchParams])

  if (!data) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center text-muted-foreground">
        Could not load your account.
      </div>
    )
  }

  return <SettingsView data={data} initialTab={tab} />
}
