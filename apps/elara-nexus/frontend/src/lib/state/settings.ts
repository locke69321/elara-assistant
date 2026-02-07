export interface AppSettings {
  apiBaseUrl: string
  apiToken: string
}

const SETTINGS_KEY = 'elara_nexus_settings'

export function defaultSettings(): AppSettings {
  return {
    apiBaseUrl: 'http://localhost:8000',
    apiToken: 'local-dev-token',
  }
}

export function loadSettings(): AppSettings {
  if (typeof window === 'undefined') {
    return defaultSettings()
  }

  const raw = window.localStorage.getItem(SETTINGS_KEY)
  if (!raw) {
    return defaultSettings()
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AppSettings>
    return {
      apiBaseUrl: parsed.apiBaseUrl ?? defaultSettings().apiBaseUrl,
      apiToken: parsed.apiToken ?? defaultSettings().apiToken,
    }
  } catch {
    return defaultSettings()
  }
}

export function saveSettings(settings: AppSettings): void {
  if (typeof window === 'undefined') {
    return
  }
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}
