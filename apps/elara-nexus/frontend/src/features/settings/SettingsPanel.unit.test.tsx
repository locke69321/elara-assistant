import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { SettingsPanel } from './SettingsPanel'

describe('SettingsPanel', () => {
  it('edits and saves settings with success feedback', () => {
    const onSave = vi.fn()
    render(
      <SettingsPanel
        settings={{ apiBaseUrl: 'http://localhost:8000', apiToken: 'token' }}
        onSave={onSave}
      />,
    )

    fireEvent.change(screen.getByDisplayValue('http://localhost:8000'), {
      target: { value: 'http://localhost:9000' },
    })
    fireEvent.change(screen.getByDisplayValue('token'), {
      target: { value: 'new-token' },
    })
    fireEvent.click(screen.getByText('Save Settings'))

    expect(onSave).toHaveBeenCalledWith({
      apiBaseUrl: 'http://localhost:9000',
      apiToken: 'new-token',
    })
    expect(screen.getByText('Settings saved')).toBeTruthy()
  })

  it('clears success message when editing after save', () => {
    const onSave = vi.fn()
    render(
      <SettingsPanel
        settings={{ apiBaseUrl: 'http://localhost:8000', apiToken: 'token' }}
        onSave={onSave}
      />,
    )

    fireEvent.click(screen.getByText('Save Settings'))
    expect(screen.getByText('Settings saved')).toBeTruthy()

    fireEvent.change(screen.getByDisplayValue('http://localhost:8000'), {
      target: { value: 'http://localhost:9000' },
    })
    expect(screen.queryByText('Settings saved')).toBeNull()
  })
})
