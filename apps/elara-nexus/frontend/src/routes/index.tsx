import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

import { AgentStatusPanel } from '@/features/agent/AgentStatusPanel'
import { KanbanBoard } from '@/features/kanban/KanbanBoard'
import { TaskComposerCard } from '@/features/kanban/TaskComposerCard'
import { useAppClient } from '@/lib/state/useAppClient'

export const Route = createFileRoute('/')({ component: HomePage })

export function HomePage() {
  const { client } = useAppClient()
  const activityState = 'idle' as const
  const [refreshNonce, setRefreshNonce] = useState(0)

  return (
    <div className="dashboard-flow dashboard-flow--wide">
      <div className="workspace-main-layout" data-animate="rise">
        <aside className="workspace-main-layout__status">
          <AgentStatusPanel client={client} activityState={activityState} />
          <TaskComposerCard
            client={client}
            onTaskCreated={() => {
              setRefreshNonce((prev) => prev + 1)
            }}
          />
        </aside>
        <div className="workspace-main-layout__kanban">
          <KanbanBoard client={client} showTaskComposer={false} refreshNonce={refreshNonce} />
        </div>
      </div>
    </div>
  )
}
