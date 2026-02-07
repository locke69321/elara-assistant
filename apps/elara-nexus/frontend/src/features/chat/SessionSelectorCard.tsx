import type { ChatSession } from '@/lib/api/types'

interface SessionSelectorCardProps {
  sessions: ChatSession[]
  activeSessionId: string | null
  creating: boolean
  error?: string
  onSelectSession: (sessionId: string) => void
  onCreateSession: () => void
}

export function SessionSelectorCard({
  sessions,
  activeSessionId,
  creating,
  error,
  onSelectSession,
  onCreateSession,
}: SessionSelectorCardProps) {
  return (
    <section className="card" data-animate="rise" data-delay="3">
      <div className="card-header">
        <div>
          <p className="panel-kicker">Conversations</p>
          <h2 className="section-title">Sessions</h2>
        </div>
        <span className="badge">{sessions.length}</span>
      </div>

      {error ? <p className="error-message" role="alert">{error}</p> : null}

      <div className="grid gap-2">
        <label className="label">
          <span className="label-text">Session</span>
          <select
            className="input"
            aria-label="Session selection"
            value={activeSessionId ?? ''}
            onChange={(event) => onSelectSession(event.target.value)}
            disabled={sessions.length === 0 || creating}
          >
            {sessions.length === 0 ? <option value="">No sessions yet</option> : null}
            {sessions.map((session) => (
              <option key={session.id} value={session.id}>{session.title}</option>
            ))}
          </select>
        </label>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={onCreateSession}
          disabled={creating}
        >
          {creating ? 'Creating…' : 'New Session'}
        </button>
      </div>
    </section>
  )
}
