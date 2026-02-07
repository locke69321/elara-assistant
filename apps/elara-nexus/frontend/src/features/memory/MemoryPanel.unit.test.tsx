import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { ApiClient } from '@/lib/api/client'

import { MemoryPanel } from './MemoryPanel'

describe('MemoryPanel', () => {
  it('ingests documents and searches memory', async () => {
    const ingestMemory = vi.fn(async () => ({ id: 'd1', title: 'Spec', chunkCount: 1 }))
    const searchMemory = vi.fn(async () => [
      {
        chunkId: 'c1',
        documentId: 'd1',
        score: 0.99,
        snippet: 'agent platform',
        sourceRef: '',
      },
    ])
    const client = { ingestMemory, searchMemory } as unknown as ApiClient

    render(<MemoryPanel client={client} />)

    fireEvent.change(screen.getByPlaceholderText('Document title'), { target: { value: 'Spec' } })
    fireEvent.change(screen.getByPlaceholderText('Document content'), {
      target: { value: 'agent platform' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Ingest Document' }))

    await waitFor(() => {
      expect(ingestMemory).toHaveBeenCalled()
    })

    fireEvent.change(screen.getByPlaceholderText('Search memory'), { target: { value: 'agent' } })
    fireEvent.click(screen.getByText('Search'))

    await waitFor(() => {
      expect(searchMemory).toHaveBeenCalledWith('agent', 5)
      expect(screen.getByText('agent platform')).toBeTruthy()
      expect(screen.getByText('99%')).toBeTruthy()
      expect(screen.getByText('source: n/a')).toBeTruthy()
    })
  })

  it('shows search errors', async () => {
    const client = {
      ingestMemory: vi.fn(async () => ({ id: 'd1', title: 'Spec', chunkCount: 1 })),
      searchMemory: vi.fn(async () => {
        throw new Error('search failed')
      }),
    } as unknown as ApiClient

    render(<MemoryPanel client={client} />)
    fireEvent.change(screen.getByPlaceholderText('Search memory'), { target: { value: 'agent' } })
    fireEvent.click(screen.getByText('Search'))

    await waitFor(() => {
      expect(screen.getByText('search failed')).toBeTruthy()
    })
  })

  it('handles empty inputs and ingest failures', async () => {
    const ingestMemory = vi.fn(async () => {
      throw new Error('bad')
    })
    const searchMemory = vi.fn(async () => [])
    const client = {
      ingestMemory,
      searchMemory,
    } as unknown as ApiClient

    render(<MemoryPanel client={client} />)

    fireEvent.click(screen.getByRole('button', { name: 'Ingest Document' }))
    expect(ingestMemory).not.toHaveBeenCalled()

    fireEvent.change(screen.getByPlaceholderText('Document title'), { target: { value: 'Spec' } })
    fireEvent.change(screen.getByPlaceholderText('Document content'), {
      target: { value: 'content' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Ingest Document' }))

    await waitFor(() => {
      expect(screen.getByText('bad')).toBeTruthy()
    })

    fireEvent.click(screen.getByText('Search'))
    expect(searchMemory).not.toHaveBeenCalled()
  })

  it('shows search error messages', async () => {
    const client = {
      ingestMemory: vi.fn(async () => ({ id: 'd1', title: 'Spec', chunkCount: 1 })),
      searchMemory: vi.fn(async () => {
        throw new Error('bad')
      }),
    } as unknown as ApiClient

    render(<MemoryPanel client={client} />)
    fireEvent.change(screen.getByPlaceholderText('Search memory'), { target: { value: 'agent' } })
    fireEvent.click(screen.getByText('Search'))

    await waitFor(() => {
      expect(screen.getByText('bad')).toBeTruthy()
    })
  })

  it('uses fallback messages for non-Error failures', async () => {
    const ingestMemory = vi.fn(() => Promise.reject('bad'))
    const searchMemory = vi.fn(() => Promise.reject('bad'))
    const client = {
      ingestMemory,
      searchMemory,
    } as unknown as ApiClient

    render(<MemoryPanel client={client} />)
    fireEvent.change(screen.getByPlaceholderText('Document title'), { target: { value: 'Spec' } })
    fireEvent.change(screen.getByPlaceholderText('Document content'), {
      target: { value: 'content' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Ingest Document' }))

    await waitFor(() => {
      expect(screen.getByText('Failed to ingest memory')).toBeTruthy()
    })

    fireEvent.change(screen.getByPlaceholderText('Search memory'), { target: { value: 'agent' } })
    fireEvent.click(screen.getByText('Search'))
    await waitFor(() => {
      expect(screen.getByText('Failed to search memory')).toBeTruthy()
    })
  })

  it('shows empty results state after search', async () => {
    const client = {
      ingestMemory: vi.fn(async () => ({ id: 'd1', title: 'Spec', chunkCount: 1 })),
      searchMemory: vi.fn(async () => []),
    } as unknown as ApiClient

    render(<MemoryPanel client={client} />)
    fireEvent.change(screen.getByPlaceholderText('Search memory'), { target: { value: 'nothing' } })
    fireEvent.click(screen.getByText('Search'))

    await waitFor(() => {
      expect(screen.getByText('No results found')).toBeTruthy()
    })
  })

  it('searches on Enter key press', async () => {
    const searchMemory = vi.fn(async () => [
      {
        chunkId: 'c1',
        documentId: 'd1',
        score: 0.85,
        snippet: 'found it',
        sourceRef: 'test',
      },
    ])
    const client = {
      ingestMemory: vi.fn(async () => ({ id: 'd1', title: 'Spec', chunkCount: 1 })),
      searchMemory,
    } as unknown as ApiClient

    render(<MemoryPanel client={client} />)
    const searchInput = screen.getByPlaceholderText('Search memory')
    fireEvent.change(searchInput, { target: { value: 'query' } })
    fireEvent.keyDown(searchInput, { key: 'a' })
    expect(searchMemory).not.toHaveBeenCalled()
    fireEvent.keyDown(searchInput, { key: 'Enter' })

    await waitFor(() => {
      expect(searchMemory).toHaveBeenCalledWith('query', 5)
      expect(screen.getByText('found it')).toBeTruthy()
      expect(screen.getByText('85%')).toBeTruthy()
      expect(screen.getByText('test')).toBeTruthy()
    })
  })
})
