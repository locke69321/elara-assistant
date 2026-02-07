import { useEffect, useState } from 'react'

import type { ApiClient } from '@/lib/api/client'

interface AgentStatusPanelProps {
  client: ApiClient
  activityState: 'idle' | 'working'
  subagents?: string[]
}

type BackendState = 'checking' | 'ready' | 'offline'

export function AgentStatusPanel({ client, activityState, subagents = [] }: AgentStatusPanelProps) {
  const [backendState, setBackendState] = useState<BackendState>('checking')
  const [lastHeartbeat, setLastHeartbeat] = useState<string>('Pending')

  useEffect(() => {
    let active = true

    const probe = async () => {
      try {
        const ready = await client.getReady()
        if (!active) {
          return
        }
        setBackendState(ready.status === 'ready' ? 'ready' : 'offline')
      } catch {
        if (!active) {
          return
        }
        setBackendState('offline')
      } finally {
        if (active) {
          setLastHeartbeat(
            new Date().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
          )
        }
      }
    }

    void probe()
    const interval = window.setInterval(() => {
      void probe()
    }, 15000)

    return () => {
      active = false
      window.clearInterval(interval)
    }
  }, [client])

  const isOffline = backendState === 'offline'
  const activityLabel = isOffline ? 'Offline' : activityState === 'working' ? 'Active' : 'Idle'
  const statusClass = activityState === 'working' ? 'status-pill--live' : ''

  return (
    <section className="card" data-animate="rise" data-delay="2" aria-live="polite">
      <div className="card-header">
        <div>
          <p className="panel-kicker">Agent</p>
          <h2 className="section-title">Runtime Status</h2>
        </div>
      </div>

      <div className="grid gap-2">
        <div className="soft-panel flex items-center justify-between gap-2">
          <span className="text-sm text-text-secondary">Agent status</span>
          <span className={`status-pill ${statusClass}`}>{activityLabel}</span>
        </div>
      </div>

      {subagents.length > 0 ? (
        <div className="soft-panel mt-2">
          <p className="text-xs text-text-muted">Subagents</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {subagents.map((agent) => (
              <span key={agent} className="badge">{agent}</span>
            ))}
          </div>
        </div>
      ) : null}

      <p className="mt-3 text-xs text-text-muted">Heartbeat: {lastHeartbeat}</p>
    </section>
  )
}
