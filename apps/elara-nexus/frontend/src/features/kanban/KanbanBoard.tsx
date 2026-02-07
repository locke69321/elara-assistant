import { useEffect, useMemo, useState } from 'react'

import type { ApiClient } from '@/lib/api/client'
import type { BoardDetail, Task, TaskPriority, TaskStatus } from '@/lib/api/types'
import { TaskDetailDialog } from './TaskDetailDialog'

interface KanbanBoardProps {
  client: ApiClient
  showTaskComposer?: boolean
  refreshNonce?: number
}

type KanbanLaneId = 'backlog' | 'in_progress' | 'complete'
const laneIds: KanbanLaneId[] = ['backlog', 'in_progress', 'complete']

const laneLabels: Record<KanbanLaneId, string> = {
  backlog: 'Backlog',
  in_progress: 'In Progress',
  complete: 'Complete',
}

const laneStatusGroups: Record<KanbanLaneId, TaskStatus[]> = {
  backlog: ['backlog', 'todo'],
  in_progress: ['in_progress', 'blocked', 'review'],
  complete: ['done'],
}

const lanePreferredColumns: Record<KanbanLaneId, TaskStatus[]> = {
  backlog: ['todo', 'backlog'],
  in_progress: ['in_progress', 'blocked', 'review'],
  complete: ['done'],
}

const priorityLabels: Record<TaskPriority, string> = {
  p0: 'Critical',
  p1: 'High',
  p2: 'Medium',
  p3: 'Low',
}

function statusToLane(status: TaskStatus): KanbanLaneId {
  if (laneStatusGroups.complete.includes(status)) {
    return 'complete'
  }
  if (laneStatusGroups.in_progress.includes(status)) {
    return 'in_progress'
  }
  return 'backlog'
}

function resolveTargetForLane(board: BoardDetail, lane: KanbanLaneId): { columnId: string; status: TaskStatus } | null {
  for (const preferredStatus of lanePreferredColumns[lane]) {
    const targetColumn = board.columns.find((column) => column.key === preferredStatus)
    if (targetColumn) {
      return { columnId: targetColumn.id, status: preferredStatus }
    }
  }
  return null
}

function isKanbanLane(value: string): value is KanbanLaneId {
  return laneIds.includes(value as KanbanLaneId)
}

export function KanbanBoard({ client, showTaskComposer = true, refreshNonce = 0 }: KanbanBoardProps) {
  const [board, setBoard] = useState<BoardDetail | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'p2' as TaskPriority })
  const [error, setError] = useState<string>('')
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        setError('')
        const boards = await client.listBoards()
        const active = boards[0] ?? (await client.createBoard('Default Board'))
        const detail = await client.getBoard(active.id)
        const currentTasks = await client.listTasks(active.id)
        setBoard(detail)
        setTasks(currentTasks)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load board')
      }
    })()
  }, [client, refreshNonce])

  const tasksByLane = useMemo(() => {
    const map = new Map<KanbanLaneId, Task[]>()
    for (const lane of laneIds) {
      map.set(lane, [])
    }
    for (const task of tasks) {
      const lane = statusToLane(task.status)
      const existing = map.get(lane) ?? []
      map.set(lane, [...existing, task])
    }
    return map
  }, [tasks])

  const addTask = async () => {
    if (!board) {
      return
    }
    const target = resolveTargetForLane(board, 'backlog')
    if (!target) {
      setError('Cannot create task: backlog column mapping is missing.')
      return
    }
    if (!newTask.title.trim()) {
      return
    }

    try {
      const created = await client.createTask({
        boardId: board.id,
        columnId: target.columnId,
        title: newTask.title.trim(),
        description: newTask.description.trim(),
        priority: newTask.priority,
        status: target.status,
      })
      setTasks((prev) => [...prev, created])
      setNewTask({ title: '', description: '', priority: 'p2' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task')
    }
  }

  const moveTask = async (taskId: string, columnId: string, status: TaskStatus) => {
    try {
      const updated = await client.moveTask(taskId, { columnId, status })
      setTasks((prev) => prev.map((task) => (task.id === updated.id ? updated : task)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to move task')
    }
  }

  return (
    <section className="card" data-animate="rise">
      <div className="card-header">
        <div>
          <p className="panel-kicker">Execution</p>
          <h2 className="section-title">Kanban</h2>
        </div>
        <span className="badge">{tasks.length} total</span>
      </div>
      {error ? <p className="error-message" role="alert">{error}</p> : null}

      {showTaskComposer ? (
        <div className="mt-4 grid gap-2 lg:grid-cols-4">
          <input
            className="input"
            aria-label="Task title"
            placeholder="Task title"
            value={newTask.title}
            onChange={(event) => setNewTask((prev) => ({ ...prev, title: event.target.value }))}
          />
          <input
            className="input"
            aria-label="Description"
            placeholder="Description"
            value={newTask.description}
            onChange={(event) => setNewTask((prev) => ({ ...prev, description: event.target.value }))}
          />
          <select
            className="input"
            value={newTask.priority}
            aria-label="Priority"
            onChange={(event) => setNewTask((prev) => ({ ...prev, priority: event.target.value as TaskPriority }))}
          >
            {(Object.keys(priorityLabels) as TaskPriority[]).map((key) => (
              <option key={key} value={key}>{priorityLabels[key]}</option>
            ))}
          </select>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              void addTask()
            }}
          >
            Add Task
          </button>
        </div>
      ) : null}

      <div className="kanban-grid mt-4" style={{ gridTemplateColumns: 'repeat(3, minmax(220px, 1fr))' }}>
        {laneIds.map((laneId) => (
          <article key={laneId} className="column-card">
            <header className="mb-3 flex items-center justify-between border-b border-border-subtle pb-2">
              <h3 className="text-sm font-semibold text-text-primary">{laneLabels[laneId]}</h3>
              <span className="badge">{tasksByLane.get(laneId)?.length ?? 0}</span>
            </header>
            <ul className="space-y-2">
              {(tasksByLane.get(laneId) ?? []).map((task) => (
                <li key={task.id} className="task-card">
                  <div className="flex items-start gap-2">
                    <span className={`priority-dot mt-1.5 priority-${task.priority}`} title={priorityLabels[task.priority]} />
                    <div className="min-w-0 flex-1">
                      <button
                        type="button"
                        className="text-left text-sm font-medium text-text-primary hover:text-accent cursor-pointer bg-transparent border-none p-0"
                        onClick={() => setSelectedTask(task)}
                      >
                        {task.title}
                      </button>
                      {task.description ? (
                        <p className="mt-0.5 text-xs text-text-secondary line-clamp-2">{task.description}</p>
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2 border-t border-border-subtle pt-2">
                    <span className={`text-xs font-medium priority-label-${task.priority}`}>
                      {priorityLabels[task.priority]}
                    </span>
                    <div className="flex items-center gap-1">
                      <label className="text-xs text-text-muted" htmlFor={`status-${task.id}`}>
                        Move
                      </label>
                      <select
                        id={`status-${task.id}`}
                        className="input px-1 py-0.5 text-xs"
                        value={statusToLane(task.status)}
                        onChange={(event) => {
                          const nextLane = event.target.value
                          if (!isKanbanLane(nextLane)) {
                            return
                          }
                          const target = resolveTargetForLane(board as BoardDetail, nextLane)
                          if (!target) {
                            setError(`Cannot move task to unmapped lane: ${nextLane}`)
                            return
                          }
                          void moveTask(task.id, target.columnId, target.status)
                        }}
                      >
                        {laneIds.map((lane) => (
                          <option key={lane} value={lane}>
                            {laneLabels[lane]}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      {selectedTask && board ? (
        <TaskDetailDialog
          task={selectedTask}
          board={board}
          client={client}
          onClose={() => setSelectedTask(null)}
          onUpdate={(updated) => {
            setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
          }}
        />
      ) : null}
    </section>
  )
}
