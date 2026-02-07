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
})
