import { act, render, screen, waitFor } from '@testing-library/react'
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

  it('polls backend readiness on interval', async () => {
    vi.useFakeTimers()
    try {
      const getReady = vi.fn(async () => ({ status: 'ready' }))
      const client = { getReady } as unknown as ApiClient

      render(<AgentStatusPanel client={client} activityState="idle" />)

      await act(async () => {
        await Promise.resolve()
      })
      expect(getReady).toHaveBeenCalledTimes(1)

      await act(async () => {
        await vi.advanceTimersByTimeAsync(15000)
      })
      expect(getReady).toHaveBeenCalledTimes(2)
    } finally {
      vi.useRealTimers()
    }
  })

  it('ignores late readiness result after unmount', async () => {
    let resolveReady: ((value: { status: string }) => void) | undefined
    const getReady = vi.fn(
      () =>
        new Promise<{ status: string }>((resolve) => {
          resolveReady = resolve
        }),
    )
    const client = { getReady } as unknown as ApiClient

    const view = render(<AgentStatusPanel client={client} activityState="idle" />)
    view.unmount()
    resolveReady?.({ status: 'ready' })
    await Promise.resolve()

    expect(getReady).toHaveBeenCalledTimes(1)
  })

  it('ignores late readiness error after unmount', async () => {
    let rejectReady: ((reason: unknown) => void) | undefined
    const getReady = vi.fn(
      () =>
        new Promise<{ status: string }>((_resolve, reject) => {
          rejectReady = reject
        }),
    )
    const client = { getReady } as unknown as ApiClient

    const view = render(<AgentStatusPanel client={client} activityState="idle" />)
    view.unmount()
    rejectReady?.(new Error('offline'))
    await Promise.resolve()

    expect(getReady).toHaveBeenCalledTimes(1)
  })
})
