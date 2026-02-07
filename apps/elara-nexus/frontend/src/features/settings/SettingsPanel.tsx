import { useState } from 'react'

import type { AppSettings } from '@/lib/state/settings'

interface SettingsPanelProps {
  settings: AppSettings
  onSave: (settings: AppSettings) => void
}

export function SettingsPanel({ settings, onSave }: SettingsPanelProps) {
  const [next, setNext] = useState<AppSettings>(settings)

  return (
    <section className="card">
      <h2 className="section-title">Settings</h2>
      <p className="section-subtitle">Configure API base URL and bearer token.</p>

      <div className="mt-4 grid gap-3">
        <label className="label">
          <span className="label-text">API Base URL</span>
          <input
            className="input"
            value={next.apiBaseUrl}
            onChange={(event) =>
              setNext((prev) => ({
                ...prev,
                apiBaseUrl: event.target.value,
              }))
            }
          />
        </label>

        <label className="label">
          <span className="label-text">Bearer Token</span>
          <input
            type="password"
            className="input"
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
        className="btn btn-primary mt-4 px-4 py-2"
        onClick={() => onSave(next)}
      >
        Save Settings
      </button>
    </section>
  )
}
