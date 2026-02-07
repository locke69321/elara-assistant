import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'

import { ChatPanel } from '@/features/chat/ChatPanel'
import { KanbanBoard } from '@/features/kanban/KanbanBoard'
import { MemoryPanel } from '@/features/memory/MemoryPanel'
import { SettingsPanel } from '@/features/settings/SettingsPanel'
import { ApiClient } from '@/lib/api/client'
import { loadSettings, saveSettings } from '@/lib/state/settings'

export const Route = createFileRoute('/')({ component: HomePage })

export function HomePage() {
  const [settings, setSettings] = useState(loadSettings)

  const client = useMemo(
    () =>
      new ApiClient({
        baseUrl: settings.apiBaseUrl,
        token: settings.apiToken,
      }),
    [settings.apiBaseUrl, settings.apiToken],
  )

  return (
    <div className="grid gap-4">
      <SettingsPanel
        settings={settings}
        onSave={(next) => {
          saveSettings(next)
          setSettings(next)
        }}
      />
      <KanbanBoard client={client} />
      <ChatPanel client={client} />
      <MemoryPanel client={client} />
    </div>
  )
}
