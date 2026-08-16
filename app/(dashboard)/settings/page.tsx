import { SettingsView } from '@/components/settings/settings-view'
import { getSettingsData } from '@/lib/settings/get-settings-data'

export default async function SettingsPage() {
  const data = await getSettingsData()

  if (!data) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center text-muted-foreground">
        Could not load your account.
      </div>
    )
  }

  return <SettingsView data={data} />
}
