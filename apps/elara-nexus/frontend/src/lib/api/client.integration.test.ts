import { afterEach, describe, expect, it, vi } from 'vitest'

import { ApiClient } from './client'

describe('ApiClient', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('sends auth header and parses response', async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      void input
      void init
      return new Response(JSON.stringify([{ id: 'b1', name: 'Board' }]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    })

    vi.stubGlobal('fetch', fetchMock)

    const client = new ApiClient({
      baseUrl: 'http://localhost:8000',
      token: 'token-123',
    })

    const boards = await client.listBoards()

    expect(boards).toHaveLength(1)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const firstCall = fetchMock.mock.calls[0]
    expect(firstCall).toBeDefined()
    if (!firstCall) {
      throw new Error('Expected fetch to be called once')
    }
    const requestInit = firstCall[1]
    expect(requestInit).toBeDefined()
    if (!requestInit || typeof requestInit !== 'object') {
      throw new Error('Expected request init object')
    }
    const headers = requestInit.headers as Record<string, string>
    expect(headers.Authorization).toBe('Bearer token-123')
  })
})
