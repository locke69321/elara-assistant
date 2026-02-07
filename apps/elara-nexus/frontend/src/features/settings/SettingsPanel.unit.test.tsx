import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { SettingsPanel } from './SettingsPanel'

describe('SettingsPanel', () => {
  it('edits and saves settings', () => {
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
  })
})
