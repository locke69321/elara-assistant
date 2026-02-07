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
    <section className="rounded-lg border border-slate-300 bg-white p-4">
      <h2 className="text-lg font-semibold text-slate-900">Memory</h2>
      {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}

      <div className="mt-3 grid gap-2">
        <input
          className="rounded border border-slate-300 px-2 py-1"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Document title"
        />
        <textarea
          className="rounded border border-slate-300 px-2 py-1"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Document content"
          rows={3}
        />
        <button
          type="button"
          className="w-fit rounded bg-slate-900 px-3 py-1 text-white"
          onClick={() => {
            void ingest()
          }}
        >
          Ingest Document
        </button>
      </div>

      <div className="mt-4 flex gap-2">
        <input
          className="flex-1 rounded border border-slate-300 px-2 py-1"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search memory"
        />
        <button
          type="button"
          className="rounded bg-slate-700 px-3 py-1 text-white"
          onClick={() => {
            void search()
          }}
        >
          Search
        </button>
      </div>

      <ul className="mt-3 space-y-2">
        {results.map((result) => (
          <li key={result.chunkId} className="rounded border border-slate-200 bg-slate-50 p-2 text-sm">
            <p className="font-medium text-slate-900">score: {result.score.toFixed(3)}</p>
            <p className="text-slate-700">{result.snippet}</p>
            <p className="text-xs text-slate-500">{result.sourceRef || 'source: n/a'}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
