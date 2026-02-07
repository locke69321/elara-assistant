import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { HomePage } from './index'

describe('home page smoke', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('renders core dashboard sections', async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url
      const method = init?.method ?? 'GET'

      if (url.endsWith('/api/v1/boards') && method === 'GET') {
        return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } })
      }
      if (url.endsWith('/api/v1/boards') && method === 'POST') {
        return new Response(JSON.stringify({ id: 'board-1', name: 'Default Board' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      if (url.includes('/api/v1/boards/board-1/tasks') && method === 'GET') {
        return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } })
      }
      if (url.includes('/api/v1/boards/board-1') && method === 'GET') {
        return new Response(
          JSON.stringify({
            id: 'board-1',
            name: 'Default Board',
            columns: [
              { id: 'c1', key: 'todo', name: 'Todo', position: 1 },
              { id: 'c2', key: 'in_progress', name: 'In Progress', position: 2 },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      }
      if (url.endsWith('/api/v1/chat/sessions') && method === 'POST') {
        return new Response(JSON.stringify({ id: 'session-1', title: 'Primary Session', createdAt: new Date().toISOString() }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      if (url.includes('/api/v1/chat/sessions/session-1/messages') && method === 'GET') {
        return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } })
      }

      return new Response(JSON.stringify({ detail: 'not mocked' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    })

    vi.stubGlobal('fetch', fetchMock)

    render(<HomePage />)

    await waitFor(() => {
      expect(screen.getByText('Settings')).toBeTruthy()
      expect(screen.getByText('Kanban')).toBeTruthy()
      expect(screen.getByText('Chat Runtime')).toBeTruthy()
      expect(screen.getByText('Memory')).toBeTruthy()
    })

    expect(screen.getByRole('button', { name: 'Ingest Document' })).toBeTruthy()
    expect(screen.getByText('Search Memory')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Search' })).toBeTruthy()
    expect(screen.getByText('No messages yet')).toBeTruthy()

    expect(screen.getByPlaceholderText('Task title')).toBeTruthy()
    expect(screen.getByPlaceholderText('Message')).toBeTruthy()
    expect(screen.getByPlaceholderText('Document title')).toBeTruthy()
    expect(screen.getByPlaceholderText('Search memory')).toBeTruthy()

    expect(screen.getByText('Add Task')).toBeTruthy()
    expect(screen.getByText('Send')).toBeTruthy()

    fireEvent.change(screen.getByDisplayValue('http://localhost:8000'), {
      target: { value: 'http://localhost:9000' },
    })
    fireEvent.change(screen.getByDisplayValue('local-dev-token'), {
      target: { value: 'token-updated' },
    })
    fireEvent.click(screen.getByText('Save Settings'))
    expect(screen.getByText('Settings saved')).toBeTruthy()
  })

  it('renders accessible structure with correct ARIA attributes', async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url
      const method = init?.method ?? 'GET'

      if (url.endsWith('/api/v1/boards') && method === 'GET') {
        return new Response(JSON.stringify([{ id: 'b1', name: 'Board' }]), { status: 200, headers: { 'Content-Type': 'application/json' } })
      }
      if (url.includes('/api/v1/boards/b1/tasks')) {
        return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } })
      }
      if (url.includes('/api/v1/boards/b1')) {
        return new Response(
          JSON.stringify({
            id: 'b1',
            name: 'Board',
            columns: [{ id: 'c1', key: 'todo', name: 'Todo', position: 1 }],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      }
      if (url.endsWith('/api/v1/chat/sessions') && method === 'POST') {
        return new Response(JSON.stringify({ id: 's1', title: 'Chat', createdAt: new Date().toISOString() }), {
          status: 200, headers: { 'Content-Type': 'application/json' },
        })
      }
      if (url.includes('/api/v1/chat/sessions/s1/messages')) {
        return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } })
      }

      return new Response(JSON.stringify({}), { status: 500, headers: { 'Content-Type': 'application/json' } })
    })

    vi.stubGlobal('fetch', fetchMock)
    render(<HomePage />)

    await waitFor(() => {
      expect(screen.getByText('Kanban')).toBeTruthy()
    })

    expect(screen.getByRole('log')).toBeTruthy()
    expect(screen.getByLabelText('Message')).toBeTruthy()
    expect(screen.getByLabelText('Task title')).toBeTruthy()
    expect(screen.getByLabelText('Description')).toBeTruthy()
    expect(screen.getByLabelText('Priority')).toBeTruthy()
    expect(screen.getByLabelText('Document title')).toBeTruthy()
    expect(screen.getByLabelText('Document content')).toBeTruthy()
    expect(screen.getByLabelText('Search memory')).toBeTruthy()
  })
})
