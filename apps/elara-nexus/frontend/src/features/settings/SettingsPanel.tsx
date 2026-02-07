import { useState } from 'react'

import type { AppSettings } from '@/lib/state/settings'

interface SettingsPanelProps {
  settings: AppSettings
  onSave: (settings: AppSettings) => void
}

export function SettingsPanel({ settings, onSave }: SettingsPanelProps) {
  const [next, setNext] = useState<AppSettings>(settings)

  return (
    <section className="rounded-lg border border-slate-300 bg-white p-4">
      <h2 className="text-lg font-semibold text-slate-900">Settings</h2>
      <p className="mt-1 text-sm text-slate-600">Configure API base URL and bearer token.</p>

      <div className="mt-4 grid gap-3">
        <label className="grid gap-1 text-sm">
          <span className="font-medium text-slate-700">API Base URL</span>
          <input
            className="rounded border border-slate-300 px-2 py-1"
            value={next.apiBaseUrl}
            onChange={(event) =>
              setNext((prev) => ({
                ...prev,
                apiBaseUrl: event.target.value,
              }))
            }
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="font-medium text-slate-700">Bearer Token</span>
          <input
            type="password"
            className="rounded border border-slate-300 px-2 py-1"
            value={next.apiToken}
            onChange={(event) =>
              setNext((prev) => ({
                ...prev,
                apiToken: event.target.value,
              }))
            }
          />
        </label>
      </div>

      <button
        type="button"
        className="mt-4 rounded bg-slate-900 px-3 py-2 text-sm font-medium text-white"
        onClick={() => onSave(next)}
      >
        Save Settings
      </button>
    </section>
  )
}
