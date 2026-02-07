import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { ApiClient } from '@/lib/api/client'

import { AgentStatusPanel } from './AgentStatusPanel'

describe('AgentStatusPanel', () => {
  it('shows idle when backend is healthy and activity is idle', async () => {
    const client = {
      getReady: vi.fn(async () => ({ status: 'ready' })),
    } as unknown as ApiClient

    render(<AgentStatusPanel client={client} activityState="idle" />)

    await waitFor(() => {
      expect(screen.getByText('Idle')).toBeTruthy()
    })
  })

  it('shows offline when backend probe fails regardless of activity', async () => {
    const client = {
      getReady: vi.fn(async () => {
        throw new Error('offline')
      }),
    } as unknown as ApiClient

    render(<AgentStatusPanel client={client} activityState="working" />)

    await waitFor(() => {
      expect(screen.getByText('Offline')).toBeTruthy()
    })
  })

  it('renders subagent badges when subagents are provided', async () => {
    const client = {
      getReady: vi.fn(async () => ({ status: 'ready' })),
    } as unknown as ApiClient

    render(<AgentStatusPanel client={client} activityState="working" subagents={['planner', 'research']} />)

    await waitFor(() => {
      expect(screen.getByText('Active')).toBeTruthy()
      expect(screen.getByText('Subagents')).toBeTruthy()
      expect(screen.getByText('planner')).toBeTruthy()
      expect(screen.getByText('research')).toBeTruthy()
    })
  })
})
