import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useEffect, useState } from 'react'

import { AgentStatusPanel } from '@/features/agent/AgentStatusPanel'
import { ChatPanel } from '@/features/chat/ChatPanel'
import { SessionSelectorCard } from '@/features/chat/SessionSelectorCard'
import type { ChatSession } from '@/lib/api/types'
import { useAppClient } from '@/lib/state/useAppClient'

export const Route = createFileRoute('/chat')({ component: ChatPage })

export function ChatPage() {
  const { client } = useAppClient()
  const [activityState, setActivityState] = useState<'idle' | 'working'>('idle')
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [sessionError, setSessionError] = useState('')
  const [creatingSession, setCreatingSession] = useState(false)

  const createSession = useCallback(async () => {
    setCreatingSession(true)
    setSessionError('')
    try {
      const nextIndex = sessions.length + 1
      const created = await client.createChatSession(`Session ${nextIndex}`)
      setSessions((prev) => [created, ...prev])
      setActiveSessionId(created.id)
    } catch (err) {
      setSessionError(err instanceof Error ? err.message : 'Failed to create session')
    } finally {
      setCreatingSession(false)
    }
  }, [client, sessions.length])

  const loadSessions = useCallback(async () => {
    setSessionError('')
    try {
      const existing = await client.listChatSessions()
      setSessions(existing)

      if (existing.length > 0) {
        setActiveSessionId(existing[0]?.id ?? null)
        return
      }

      const created = await client.createChatSession('Session 1')
      setSessions([created])
      setActiveSessionId(created.id)
    } catch (err) {
      setSessionError(err instanceof Error ? err.message : 'Failed to load sessions')
    }
  }, [client])

  useEffect(() => {
    void loadSessions()
  }, [loadSessions])

  return (
    <div className="dashboard-flow dashboard-flow--wide">
      <div className="workspace-main-layout" data-animate="rise">
        <aside className="workspace-main-layout__status">
          <AgentStatusPanel client={client} activityState={activityState} />
          <SessionSelectorCard
            sessions={sessions}
            activeSessionId={activeSessionId}
            creating={creatingSession}
            error={sessionError}
            onSelectSession={setActiveSessionId}
            onCreateSession={() => {
              void createSession()
            }}
          />
        </aside>
        <div className="workspace-main-layout__kanban">
          <ChatPanel
            client={client}
            sessionId={activeSessionId}
            autoCreateSession={false}
            onActivityStateChange={setActivityState}
          />
        </div>
      </div>
    </div>
  )
}
