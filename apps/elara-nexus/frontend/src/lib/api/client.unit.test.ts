import { describe, expect, it, vi } from 'vitest'

import { ApiClient, ApiError } from './client'

describe('ApiClient methods', () => {
  it('calls all endpoints with expected paths', async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url
      const method = init?.method ?? 'GET'

      if (url.endsWith('/api/v1/me')) {
        return Promise.resolve(
          new Response(JSON.stringify({ id: 'u1', email: 'e', name: 'n' }), { status: 200 }),
        )
      }
      if (url.endsWith('/api/v1/boards') && method === 'GET') {
        return Promise.resolve(new Response(JSON.stringify([{ id: 'b1', name: 'Board' }]), { status: 200 }))
      }
      if (url.endsWith('/api/v1/boards') && method === 'POST') {
        return Promise.resolve(new Response(JSON.stringify({ id: 'b2', name: 'New' }), { status: 200 }))
      }
      if (url.endsWith('/api/v1/boards/b1')) {
        return Promise.resolve(
          new Response(JSON.stringify({ id: 'b1', name: 'Board', columns: [] }), { status: 200 }),
        )
      }
      if (url.endsWith('/api/v1/boards/b1/tasks')) {
        return Promise.resolve(new Response(JSON.stringify([]), { status: 200 }))
      }
      if (url.endsWith('/api/v1/tasks') && method === 'POST') {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              id: 't1',
              boardId: 'b1',
              columnId: 'c1',
              title: 'task',
              description: '',
              priority: 'p2',
              status: 'todo',
              createdAt: '2026-01-01T00:00:00.000Z',
              updatedAt: '2026-01-01T00:00:00.000Z',
            }),
            { status: 200 },
          ),
        )
      }
      if (url.endsWith('/api/v1/tasks/t1/move')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              id: 't1',
              boardId: 'b1',
              columnId: 'c2',
              title: 'task',
              description: '',
              priority: 'p2',
              status: 'in_progress',
              createdAt: '2026-01-01T00:00:00.000Z',
              updatedAt: '2026-01-01T00:00:01.000Z',
            }),
            { status: 200 },
          ),
        )
      }
      if (url.endsWith('/api/v1/tasks/t1/history')) {
        return Promise.resolve(new Response(JSON.stringify([]), { status: 200 }))
      }
      if (url.endsWith('/api/v1/chat/sessions')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({ id: 's1', title: 'Chat', createdAt: '2026-01-01T00:00:00.000Z' }),
            { status: 200 },
          ),
        )
      }
      if (url.endsWith('/api/v1/chat/sessions/s1/messages') && method === 'POST') {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              id: 'm1',
              sessionId: 's1',
              role: 'user',
              content: 'hello',
              createdAt: '2026-01-01T00:00:00.000Z',
              run: null,
            }),
            { status: 200 },
          ),
        )
      }
      if (url.endsWith('/api/v1/chat/sessions/s1/messages') && method === 'GET') {
        return Promise.resolve(new Response(JSON.stringify([]), { status: 200 }))
      }
      if (url.endsWith('/api/v1/memory/documents') && method === 'POST') {
        return Promise.resolve(new Response(JSON.stringify({ id: 'd1', title: 'Doc', chunkCount: 1 }), { status: 200 }))
      }
      if (url.endsWith('/api/v1/memory/search')) {
        return Promise.resolve(new Response(JSON.stringify([]), { status: 200 }))
      }
      if (url.endsWith('/api/v1/memory/documents/d1')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              id: 'd1',
              title: 'Doc',
              content: 'x',
              sourceRef: 'src',
              createdAt: '2026-01-01T00:00:00.000Z',
            }),
            { status: 200 },
          ),
        )
      }

      return Promise.resolve(new Response(JSON.stringify({ detail: 'unexpected path' }), { status: 500 }))
    })

    vi.stubGlobal('fetch', fetchMock)
    const client = new ApiClient({ baseUrl: 'http://localhost:8000/', token: 'token' })

    await client.getMe()
    await client.listBoards()
    await client.createBoard('New')
    await client.getBoard('b1')
    await client.listTasks('b1')
    await client.createTask({
      boardId: 'b1',
      columnId: 'c1',
      title: 'task',
      description: '',
      priority: 'p2',
      status: 'todo',
    })
    await client.moveTask('t1', { columnId: 'c2', status: 'in_progress' })
    await client.taskHistory('t1')
    await client.createChatSession('Chat')
    await client.sendChatMessage('s1', 'hello')
    await client.listChatMessages('s1')
    await client.ingestMemory({ title: 'Doc', content: 'x', sourceRef: 'src' })
    await client.searchMemory('query', 3)
    await client.getMemoryDocument('d1')

    expect(fetchMock).toHaveBeenCalled()
  })

  it('throws ApiError on non-2xx responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response('bad request', { status: 400, statusText: 'Bad Request' }))),
    )
    const client = new ApiClient({ baseUrl: 'http://localhost:8000', token: 'token' })

    await expect(client.listBoards()).rejects.toBeInstanceOf(ApiError)
    await expect(client.listBoards()).rejects.toMatchObject({ status: 400 })
  })
})
