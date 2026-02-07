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
  const [success, setSuccess] = useState('')
  const [ingesting, setIngesting] = useState(false)
  const [searching, setSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const ingest = async () => {
    if (!title.trim() || !content.trim()) {
      return
    }
    setIngesting(true)
    try {
      setError('')
      setSuccess('')
      await client.ingestMemory({ title: title.trim(), content: content.trim(), sourceRef: 'ui' })
      setTitle('')
      setContent('')
      setSuccess('Document ingested')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to ingest memory')
    } finally {
      setIngesting(false)
    }
  }

  const search = async () => {
    if (!query.trim()) {
      return
    }
    setSearching(true)
    try {
      setError('')
      setResults(await client.searchMemory(query.trim(), 5))
      setHasSearched(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search memory')
    } finally {
      setSearching(false)
    }
  }

  const handleSearchKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      void search()
    }
  }

  return (
    <section className="card" data-animate="rise" data-delay="2">
      <div className="card-header">
        <div>
          <p className="panel-kicker">Knowledge</p>
          <h2 className="section-title">Memory</h2>
        </div>
      </div>
      {error ? <p className="error-message" role="alert">{error}</p> : null}
      {success ? <p className="success-message" role="status">{success}</p> : null}

      <div className="soft-panel mt-4">
        <h3 className="text-sm font-semibold text-text-primary mb-3">Ingest Document</h3>
        <div className="grid gap-2">
          <input
            className="input"
            aria-label="Document title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Document title"
            disabled={ingesting}
          />
          <textarea
            className="input"
            aria-label="Document content"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Document content"
            rows={3}
            disabled={ingesting}
          />
          <button
            type="button"
            className="btn btn-primary w-fit"
            disabled={ingesting}
            onClick={() => {
              void ingest()
            }}
          >
            Ingest Document
          </button>
        </div>
      </div>

      <div className="soft-panel mt-4">
        <h3 className="text-sm font-semibold text-text-primary mb-3">Search Memory</h3>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            className="input flex-1"
            aria-label="Search memory"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search memory"
            disabled={searching}
          />
          <button
            type="button"
            className="btn btn-secondary"
            disabled={searching}
            onClick={() => {
              void search()
            }}
          >
            Search
          </button>
        </div>

        {hasSearched && results.length === 0 ? (
          <p className="mt-3 text-center text-sm text-text-muted">No results found</p>
        ) : null}

        {results.length > 0 ? (
          <ul className="memory-results">
            {results.map((result) => (
              <li key={result.chunkId} className="memory-result">
                <div className="flex items-start justify-between gap-2">
                  <p className="flex-1 text-sm text-text-primary">{result.snippet}</p>
                  <span className="badge shrink-0">{Math.round(result.score * 100)}%</span>
                </div>
                <p className="mt-1 text-xs text-text-muted">{result.sourceRef || 'source: n/a'}</p>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  )
}
