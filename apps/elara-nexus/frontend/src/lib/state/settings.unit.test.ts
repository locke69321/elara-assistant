import { afterEach, describe, expect, it } from 'vitest'

import { defaultSettings, loadSettings, saveSettings } from './settings'

describe('settings helpers', () => {
  afterEach(() => {
    window.localStorage.clear()
  })

  it('returns defaults when empty', () => {
    expect(loadSettings()).toEqual(defaultSettings())
  })

  it('persists and loads settings', () => {
    const input = {
      apiBaseUrl: 'http://localhost:9000',
      apiToken: 'abc123',
    }

    saveSettings(input)

    expect(loadSettings()).toEqual(input)
  })

  it('falls back to defaults on invalid JSON', () => {
    window.localStorage.setItem('elara_nexus_settings', '{')
    expect(loadSettings()).toEqual(defaultSettings())
  })

  it('fills missing fields from defaults', () => {
    window.localStorage.setItem(
      'elara_nexus_settings',
      JSON.stringify({ apiBaseUrl: 'http://localhost:9100' }),
    )
    expect(loadSettings()).toEqual({
      apiBaseUrl: 'http://localhost:9100',
      apiToken: defaultSettings().apiToken,
    })
  })

  it('handles non-browser environments', () => {
    const originalWindow = globalThis.window
    Object.defineProperty(globalThis, 'window', {
      value: undefined,
      configurable: true,
      writable: true,
    })

    try {
      expect(loadSettings()).toEqual(defaultSettings())
      saveSettings({ apiBaseUrl: 'http://x', apiToken: 'y' })
    } finally {
      Object.defineProperty(globalThis, 'window', {
        value: originalWindow,
        configurable: true,
        writable: true,
      })
    }
  })
})
