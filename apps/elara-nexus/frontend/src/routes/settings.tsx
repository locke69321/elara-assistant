import { createFileRoute } from '@tanstack/react-router'

import { SettingsPanel } from '@/features/settings/SettingsPanel'
import { useAppClient } from '@/lib/state/useAppClient'

export const Route = createFileRoute('/settings')({ component: SettingsPage })

export function SettingsPage() {
  const { settings, saveAppSettings } = useAppClient()

  return (
    <div className="dashboard-flow">
      <div data-animate="rise">
        <SettingsPanel settings={settings} onSave={saveAppSettings} />
      </div>
    </div>
  )
}
