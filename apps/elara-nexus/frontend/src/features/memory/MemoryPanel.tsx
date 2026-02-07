import { useState } from 'react'

import type { ApiClient } from '@/lib/api/client'
import type { MemorySearchResult } from '@/lib/api/types'

interface MemoryPanelProps {
  client: ApiClient
}

export function MemoryPanel({ client }: MemoryPanelProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<MemorySearchResult[]>([])
  const [error, setError] = useState('')

  const ingest = async () => {
    if (!title.trim() || !content.trim()) {
      return
    }
    try {
      setError('')
      await client.ingestMemory({ title: title.trim(), content: content.trim(), sourceRef: 'ui' })
      setTitle('')
      setContent('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to ingest memory')
    }
  }

  const search = async () => {
    if (!query.trim()) {
      return
    }
    try {
      setError('')
      setResults(await client.searchMemory(query.trim(), 5))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search memory')
    }
  }

  return (
    <section className="card">
      <h2 className="section-title">Memory</h2>
      {error ? <p className="error-message">{error}</p> : null}

      <div className="mt-3 grid gap-2">
        <input
          className="input"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Document title"
        />
        <textarea
          className="input"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Document content"
          rows={3}
        />
        <button
          type="button"
          className="btn btn-primary w-fit"
          onClick={() => {
            void ingest()
          }}
        >
          Ingest Document
        </button>
      </div>

      <div className="mt-4 flex gap-2">
        <input
          className="input flex-1"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search memory"
        />
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            void search()
          }}
        >
          Search
        </button>
      </div>

      <ul className="mt-3 space-y-2">
        {results.map((result) => (
          <li key={result.chunkId} className="rounded-md border border-border-subtle bg-surface-raised p-2 text-sm">
            <p className="font-medium text-text-primary">score: {result.score.toFixed(3)}</p>
            <p className="text-text-secondary">{result.snippet}</p>
            <p className="text-xs text-text-muted">{result.sourceRef || 'source: n/a'}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
