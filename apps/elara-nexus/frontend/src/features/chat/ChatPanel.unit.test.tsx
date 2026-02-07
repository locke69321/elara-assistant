import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { ApiClient } from '@/lib/api/client'
import type { ChatMessage } from '@/lib/api/types'

import { ChatPanel } from './ChatPanel'

describe('ChatPanel', () => {
  it('creates a session and sends messages', async () => {
    const createChatSession = vi.fn(async () => ({
      id: 's1',
      title: 'Primary Session',
      createdAt: '2026-01-01T00:00:00.000Z',
    }))
    let listCalls = 0
    const listChatMessages = vi.fn(async (): Promise<ChatMessage[]> => {
      listCalls += 1
      if (listCalls === 1) {
        return []
      }
      return [
        {
          id: 'm1',
          sessionId: 's1',
          role: 'user',
          content: 'hello',
          createdAt: '2026-01-01T00:00:00.000Z',
          run: null,
        },
      ]
    })
    const sendChatMessage = vi.fn(async () => ({
      id: 'm1',
      sessionId: 's1',
      role: 'user' as const,
      content: 'hello',
      createdAt: '2026-01-01T00:00:00.000Z',
      run: null,
    }))
    const client = {
      createChatSession,
      listChatMessages,
      sendChatMessage,
    } as unknown as ApiClient

    render(<ChatPanel client={client} />)
    await waitFor(() => {
      expect(createChatSession).toHaveBeenCalled()
    })

    fireEvent.change(screen.getByPlaceholderText('Message'), { target: { value: 'hello' } })
    fireEvent.click(screen.getByText('Send'))

    await waitFor(() => {
      expect(sendChatMessage).toHaveBeenCalledWith('s1', 'hello')
      expect(screen.getByText('hello')).toBeTruthy()
    })
  })

  it('shows initialization errors', async () => {
    const client = {
      createChatSession: vi.fn(async () => {
        throw new Error('chat unavailable')
      }),
    } as unknown as ApiClient

    render(<ChatPanel client={client} />)
    await waitFor(() => {
      expect(screen.getByText('chat unavailable')).toBeTruthy()
    })
  })

  it('handles send failures and ignores empty input', async () => {
    const sendChatMessage = vi.fn(async () => {
      throw new Error('send failed')
    })
    const client = {
      createChatSession: vi.fn(async () => ({
        id: 's1',
        title: 'Primary Session',
        createdAt: '2026-01-01T00:00:00.000Z',
      })),
      listChatMessages: vi.fn(async () => []),
      sendChatMessage,
    } as unknown as ApiClient

    render(<ChatPanel client={client} />)
    await waitFor(() => {
      expect(screen.getByText('Chat Runtime')).toBeTruthy()
    })

    fireEvent.click(screen.getByText('Send'))
    expect(sendChatMessage).not.toHaveBeenCalled()

    fireEvent.change(screen.getByPlaceholderText('Message'), { target: { value: 'hello' } })
    fireEvent.click(screen.getByText('Send'))

    await waitFor(() => {
      expect(screen.getByText('send failed')).toBeTruthy()
    })
  })

  it('shows error messages from thrown errors', async () => {
    const initFailureClient = {
      createChatSession: vi.fn(async () => {
        throw new Error('bad')
      }),
    } as unknown as ApiClient

    const first = render(<ChatPanel client={initFailureClient} />)
    await waitFor(() => {
      expect(screen.getByText('bad')).toBeTruthy()
    })
    first.unmount()

    const sendFailureClient = {
      createChatSession: vi.fn(async () => ({
        id: 's1',
        title: 'Primary Session',
        createdAt: '2026-01-01T00:00:00.000Z',
      })),
      listChatMessages: vi.fn(async () => []),
      sendChatMessage: vi.fn(async () => {
        throw new Error('bad')
      }),
    } as unknown as ApiClient

    render(<ChatPanel client={sendFailureClient} />)
    await waitFor(() => {
      expect(screen.getByText('Chat Runtime')).toBeTruthy()
    })

    fireEvent.change(screen.getByPlaceholderText('Message'), { target: { value: 'x' } })
    fireEvent.click(screen.getByText('Send'))
    await waitFor(() => {
      expect(screen.getByText('bad')).toBeTruthy()
    })
  })

  it('shows empty state when no messages exist', async () => {
    const client = {
      createChatSession: vi.fn(async () => ({
        id: 's1',
        title: 'Primary Session',
        createdAt: '2026-01-01T00:00:00.000Z',
      })),
      listChatMessages: vi.fn(async () => []),
    } as unknown as ApiClient

    render(<ChatPanel client={client} />)
    await waitFor(() => {
      expect(screen.getByText('No messages yet')).toBeTruthy()
    })
  })

  it('sends message on Enter key press', async () => {
    const sendChatMessage = vi.fn(async () => ({
      id: 'm1',
      sessionId: 's1',
      role: 'user' as const,
      content: 'hello',
      createdAt: '2026-01-01T00:00:00.000Z',
      run: null,
    }))
    const client = {
      createChatSession: vi.fn(async () => ({
        id: 's1',
        title: 'Primary Session',
        createdAt: '2026-01-01T00:00:00.000Z',
      })),
      listChatMessages: vi.fn(async (): Promise<ChatMessage[]> => []),
      sendChatMessage,
    } as unknown as ApiClient

    render(<ChatPanel client={client} />)
    await waitFor(() => {
      expect(screen.getByText('Chat Runtime')).toBeTruthy()
    })

    const messageInput = screen.getByPlaceholderText('Message')
    fireEvent.change(messageInput, { target: { value: 'hello' } })
    fireEvent.keyDown(messageInput, { key: 'Enter' })

    await waitFor(() => {
      expect(sendChatMessage).toHaveBeenCalledWith('s1', 'hello')
    })
  })

  it('does not send on Shift+Enter', async () => {
    const sendChatMessage = vi.fn()
    const client = {
      createChatSession: vi.fn(async () => ({
        id: 's1',
        title: 'Primary Session',
        createdAt: '2026-01-01T00:00:00.000Z',
      })),
      listChatMessages: vi.fn(async () => []),
      sendChatMessage,
    } as unknown as ApiClient

    render(<ChatPanel client={client} />)
    await waitFor(() => {
      expect(screen.getByText('Chat Runtime')).toBeTruthy()
    })

    const messageInput = screen.getByPlaceholderText('Message')
    fireEvent.change(messageInput, { target: { value: 'hello' } })
    fireEvent.keyDown(messageInput, { key: 'Enter', shiftKey: true })

    expect(sendChatMessage).not.toHaveBeenCalled()
  })

  it('uses fallback error messages for non-Error failures', async () => {
    const initFailureClient = {
      createChatSession: vi.fn(() => Promise.reject('bad')),
    } as unknown as ApiClient

    const first = render(<ChatPanel client={initFailureClient} />)
    await waitFor(() => {
      expect(screen.getByText('Failed to initialize chat')).toBeTruthy()
    })
    first.unmount()

    const sendFailureClient = {
      createChatSession: vi.fn(async () => ({
        id: 's1',
        title: 'Primary Session',
        createdAt: '2026-01-01T00:00:00.000Z',
      })),
      listChatMessages: vi.fn(async () => []),
      sendChatMessage: vi.fn(() => Promise.reject('bad')),
    } as unknown as ApiClient

    render(<ChatPanel client={sendFailureClient} />)
    await waitFor(() => {
      expect(screen.getByText('Chat Runtime')).toBeTruthy()
    })

    fireEvent.change(screen.getByPlaceholderText('Message'), { target: { value: 'x' } })
    fireEvent.click(screen.getByText('Send'))
    await waitFor(() => {
      expect(screen.getByText('Failed to send message')).toBeTruthy()
    })
  })

  it('loads messages for externally selected session and does not auto-create', async () => {
    const createChatSession = vi.fn(async () => ({
      id: 'created',
      title: 'Created',
      createdAt: '2026-01-01T00:00:00.000Z',
    }))
    const listChatMessages = vi.fn(async (): Promise<ChatMessage[]> => [
      {
        id: 'm1',
        sessionId: 's-external',
        role: 'assistant',
        content: 'external',
        createdAt: '2026-01-01T00:00:00.000Z',
        run: null,
      },
    ])
    const client = {
      createChatSession,
      listChatMessages,
      sendChatMessage: vi.fn(async () => ({
        id: 'm2',
        sessionId: 's-external',
        role: 'user' as const,
        content: 'ping',
        createdAt: '2026-01-01T00:00:00.000Z',
        run: null,
      })),
    } as unknown as ApiClient

    render(<ChatPanel client={client} sessionId="s-external" autoCreateSession={false} />)

    await waitFor(() => {
      expect(listChatMessages).toHaveBeenCalledWith('s-external')
      expect(createChatSession).not.toHaveBeenCalled()
      expect(screen.getByText('external')).toBeTruthy()
    })
  })

  it('does not initialize a session when auto-create is disabled without a selected session', async () => {
    const createChatSession = vi.fn(async () => ({
      id: 'created',
      title: 'Created',
      createdAt: '2026-01-01T00:00:00.000Z',
    }))
    const client = {
      createChatSession,
      listChatMessages: vi.fn(async () => []),
      sendChatMessage: vi.fn(async () => ({
        id: 'm2',
        sessionId: 'created',
        role: 'user' as const,
        content: 'ping',
        createdAt: '2026-01-01T00:00:00.000Z',
        run: null,
      })),
    } as unknown as ApiClient

    render(<ChatPanel client={client} autoCreateSession={false} />)

    await waitFor(() => {
      expect(createChatSession).not.toHaveBeenCalled()
      expect(screen.getByText('Select a session to begin')).toBeTruthy()
    })

    expect(screen.getByPlaceholderText('Message')).toHaveProperty('disabled', true)
  })

  it('ignores late auto-created session resolution after unmount', async () => {
    let resolveSession: ((value: { id: string; title: string; createdAt: string }) => void) | undefined
    const createChatSession = vi.fn(
      () =>
        new Promise<{ id: string; title: string; createdAt: string }>((resolve) => {
          resolveSession = resolve
        }),
    )
    const client = {
      createChatSession,
      listChatMessages: vi.fn(async () => []),
    } as unknown as ApiClient

    const view = render(<ChatPanel client={client} />)
    view.unmount()
    resolveSession?.({ id: 's1', title: 'late', createdAt: '2026-01-01T00:00:00.000Z' })
    await Promise.resolve()

    expect(createChatSession).toHaveBeenCalledTimes(1)
  })

  it('ignores late external session message resolution after unmount', async () => {
    let resolveMessages: ((value: ChatMessage[]) => void) | undefined
    const listChatMessages = vi.fn(
      () =>
        new Promise<ChatMessage[]>((resolve) => {
          resolveMessages = resolve
        }),
    )
    const client = {
      listChatMessages,
      createChatSession: vi.fn(async () => ({
        id: 'unused',
        title: 'unused',
        createdAt: '2026-01-01T00:00:00.000Z',
      })),
    } as unknown as ApiClient

    const view = render(<ChatPanel client={client} sessionId="s-external" autoCreateSession={false} />)
    view.unmount()

    resolveMessages?.([
      {
        id: 'm1',
        sessionId: 's-external',
        role: 'assistant',
        content: 'late',
        createdAt: '2026-01-01T00:00:00.000Z',
        run: null,
      },
    ])
    await Promise.resolve()

    expect(listChatMessages).toHaveBeenCalledWith('s-external')
  })

  it('ignores late message listing after session creation when unmounted', async () => {
    let resolveMessages: ((value: ChatMessage[]) => void) | undefined
    const listChatMessages = vi.fn(
      () =>
        new Promise<ChatMessage[]>((resolve) => {
          resolveMessages = resolve
        }),
    )
    const createChatSession = vi.fn(async () => ({
      id: 's1',
      title: 'Primary Session',
      createdAt: '2026-01-01T00:00:00.000Z',
    }))
    const client = {
      createChatSession,
      listChatMessages,
    } as unknown as ApiClient

    const view = render(<ChatPanel client={client} />)

    await waitFor(() => {
      expect(createChatSession).toHaveBeenCalledTimes(1)
      expect(listChatMessages).toHaveBeenCalledWith('s1')
    })

    view.unmount()
    resolveMessages?.([])
    await Promise.resolve()

    expect(listChatMessages).toHaveBeenCalledTimes(1)
  })
})
