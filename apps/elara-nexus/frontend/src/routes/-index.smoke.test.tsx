import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ChatPage } from './chat'
import { HomePage } from './index'
import { MemoryPage } from './memory'
import { SettingsPage } from './settings'

describe('route smoke coverage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('renders a kanban-first dashboard with side status', async () => {
    let createdTask = false

    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url
      const method = init?.method ?? 'GET'

      if (url.endsWith('/api/v1/ready')) {
        return new Response(JSON.stringify({ status: 'ready' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }
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
        return new Response(
          JSON.stringify(
            createdTask
              ? [
                  {
                    id: 'task-1',
                    boardId: 'board-1',
                    columnId: 'c1',
                    title: 'Composer task',
                    description: 'from composer',
                    priority: 'p2',
                    status: 'todo',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  },
                ]
              : [],
          ),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      }
      if (url.endsWith('/api/v1/tasks') && method === 'POST') {
        createdTask = true
        return new Response(
          JSON.stringify({
            id: 'task-1',
            boardId: 'board-1',
            columnId: 'c1',
            title: 'Composer task',
            description: 'from composer',
            priority: 'p2',
            status: 'todo',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
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
      expect(screen.getByText('Kanban')).toBeTruthy()
      expect(screen.getByText('Runtime Status')).toBeTruthy()
      expect(screen.getByText('Idle')).toBeTruthy()
    })

    expect(screen.queryByText('Settings')).toBeNull()
    expect(screen.queryByText('Memory')).toBeNull()
    expect(screen.getByText('Runtime Status')).toBeTruthy()
    expect(screen.getByPlaceholderText('Task title')).toBeTruthy()

    fireEvent.change(screen.getByPlaceholderText('Task title'), { target: { value: 'Composer task' } })
    fireEvent.change(screen.getByPlaceholderText('Description'), { target: { value: 'from composer' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add Task' }))

    await waitFor(() => {
      expect(screen.getByText('Composer task')).toBeTruthy()
    })
  })

  it('renders settings route and saves config', () => {
    render(<SettingsPage />)

    expect(screen.getByText('Settings')).toBeTruthy()

    fireEvent.change(screen.getByDisplayValue('http://localhost:8000'), {
      target: { value: 'http://localhost:9000' },
    })
    fireEvent.change(screen.getByDisplayValue('local-dev-token'), {
      target: { value: 'token-updated' },
    })

    fireEvent.click(screen.getByText('Save Settings'))
    expect(screen.getByText('Settings saved')).toBeTruthy()
  })

  it('renders memory route controls', () => {
    const fetchMock = vi.fn(() =>
      new Response(JSON.stringify({}), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    render(<MemoryPage />)

    expect(screen.getByText('Memory')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Ingest Document' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Search' })).toBeTruthy()
    expect(screen.getByPlaceholderText('Document title')).toBeTruthy()
    expect(screen.getByPlaceholderText('Search memory')).toBeTruthy()
  })

  it('renders dedicated chat route with status', async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url
      const method = init?.method ?? 'GET'

      if (url.endsWith('/api/v1/ready')) {
        return new Response(JSON.stringify({ status: 'ready' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      if (url.endsWith('/api/v1/chat/sessions') && method === 'GET') {
        return new Response(JSON.stringify([]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
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

    render(<ChatPage />)

    await waitFor(() => {
      expect(screen.getByText('Chat Runtime')).toBeTruthy()
      expect(screen.getByText('Runtime Status')).toBeTruthy()
      expect(screen.getByText('Idle')).toBeTruthy()
    })
  })
})
