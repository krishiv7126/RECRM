import type { Metadata } from 'next'
import { AutomationManager } from '@/components/automation/automation-manager'
import { getAutomationData } from '@/lib/automation/get-automation-data'

export const metadata: Metadata = { title: 'Automation' }

export default async function AutomationPage() {
  const { rules, logs, owners } = await getAutomationData()

  return <AutomationManager initialRules={rules} initialLogs={logs} owners={owners} />
}
