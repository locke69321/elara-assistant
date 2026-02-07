import { useMemo, useState } from 'react'

import { ApiClient } from '@/lib/api/client'

import { loadSettings, saveSettings, type AppSettings } from './settings'

interface UseAppClientResult {
  settings: AppSettings
  client: ApiClient
  saveAppSettings: (next: AppSettings) => void
}

export function useAppClient(): UseAppClientResult {
  const [settings, setSettings] = useState(loadSettings)

  const client = useMemo(
    () =>
      new ApiClient({
        baseUrl: settings.apiBaseUrl,
        token: settings.apiToken,
      }),
    [settings.apiBaseUrl, settings.apiToken],
  )

  const saveAppSettings = (next: AppSettings) => {
    saveSettings(next)
    setSettings(next)
  }

  return {
    settings,
    client,
    saveAppSettings,
  }
}
