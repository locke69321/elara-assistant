import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { SessionSelectorCard } from './SessionSelectorCard'

describe('SessionSelectorCard', () => {
  it('renders sessions and handles selection and creation', () => {
    const onSelectSession = vi.fn()
    const onCreateSession = vi.fn()

    render(
      <SessionSelectorCard
        sessions={[
          { id: 's1', title: 'Session 1', createdAt: '2026-01-01T00:00:00.000Z' },
          { id: 's2', title: 'Session 2', createdAt: '2026-01-01T00:00:01.000Z' },
        ]}
        activeSessionId="s1"
        creating={false}
        onSelectSession={onSelectSession}
        onCreateSession={onCreateSession}
      />,
    )

    fireEvent.change(screen.getByLabelText('Session selection'), { target: { value: 's2' } })
    expect(onSelectSession).toHaveBeenCalledWith('s2')

    fireEvent.click(screen.getByRole('button', { name: 'New Session' }))
    expect(onCreateSession).toHaveBeenCalled()
  })

  it('shows empty state and disables controls while creating', () => {
    render(
      <SessionSelectorCard
        sessions={[]}
        activeSessionId={null}
        creating
        error="failed"
        onSelectSession={vi.fn()}
        onCreateSession={vi.fn()}
      />,
    )

    expect(screen.getByText('No sessions yet')).toBeTruthy()
    expect(screen.getByText('failed')).toBeTruthy()
    expect(screen.getByLabelText('Session selection')).toHaveProperty('disabled', true)
    expect(screen.getByRole('button', { name: 'Creating…' })).toHaveProperty('disabled', true)
  })
})
