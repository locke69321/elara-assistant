import { useEffect, useMemo, useState } from 'react'

import type { ApiClient } from '@/lib/api/client'
import type { BoardDetail, Task, TaskPriority, TaskStatus } from '@/lib/api/types'
import { TaskDetailDialog } from './TaskDetailDialog'

interface KanbanBoardProps {
  client: ApiClient
}

const statusByColumnKey: Record<string, TaskStatus> = {
  backlog: 'backlog',
  todo: 'todo',
  in_progress: 'in_progress',
  blocked: 'blocked',
  review: 'review',
  done: 'done',
}

const priorityLabels: Record<TaskPriority, string> = {
  p0: 'Critical',
  p1: 'High',
  p2: 'Medium',
  p3: 'Low',
}

export function KanbanBoard({ client }: KanbanBoardProps) {
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
  }, [client])

  const tasksByColumn = useMemo(() => {
    const map = new Map<string, Task[]>()
    for (const task of tasks) {
      const existing = map.get(task.columnId) ?? []
      map.set(task.columnId, [...existing, task])
    }
    return map
  }, [tasks])

  const addTask = async () => {
    if (!board) {
      return
    }
    const todoColumn = board.columns.find((column) => column.key === 'todo')
    if (!todoColumn || !newTask.title.trim()) {
      return
    }

    try {
      const created = await client.createTask({
        boardId: board.id,
        columnId: todoColumn.id,
        title: newTask.title.trim(),
        description: newTask.description.trim(),
        priority: newTask.priority,
        status: 'todo',
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
    <section className="card">
      <h2 className="section-title">Kanban</h2>
      {error ? <p className="error-message" role="alert">{error}</p> : null}

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
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

      <div className="mt-4 grid gap-3 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0" style={{ gridTemplateColumns: `repeat(${board?.columns.length ?? 3}, minmax(180px, 1fr))` }}>
        {board?.columns.map((column) => (
          <article key={column.id} className="rounded-lg border border-border-subtle bg-surface-raised p-3 min-w-0">
            <header className="mb-3 flex items-center justify-between border-b border-border-subtle pb-2">
              <h3 className="text-sm font-semibold text-text-primary">{column.name}</h3>
              <span className="badge">{tasksByColumn.get(column.id)?.length ?? 0}</span>
            </header>
            <ul className="space-y-2">
              {(tasksByColumn.get(column.id) ?? []).map((task) => (
                <li key={task.id} className="rounded-md border border-border-subtle bg-surface p-3 shadow-sm">
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
                        value={task.status}
                        onChange={(event) => {
                          const nextStatus = event.target.value as TaskStatus
                          const targetColumn = board.columns.find((item) => item.key === nextStatus)
                          const mappedStatus = statusByColumnKey[nextStatus]
                          if (!targetColumn || !mappedStatus) {
                            return
                          }
                          void moveTask(task.id, targetColumn.id, mappedStatus)
                        }}
                      >
                        {board.columns.map((item) => (
                          <option key={item.id} value={item.key}>
                            {item.name}
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
