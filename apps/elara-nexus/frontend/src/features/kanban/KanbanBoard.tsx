import { useEffect, useMemo, useState } from 'react'

import type { ApiClient } from '@/lib/api/client'
import type { BoardDetail, Task, TaskPriority, TaskStatus } from '@/lib/api/types'

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

export function KanbanBoard({ client }: KanbanBoardProps) {
  const [board, setBoard] = useState<BoardDetail | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'p2' as TaskPriority })
  const [error, setError] = useState<string>('')

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
    <section className="rounded-lg border border-slate-300 bg-white p-4">
      <h2 className="text-lg font-semibold text-slate-900">Kanban</h2>
      {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}

      <div className="mt-4 grid gap-2 md:grid-cols-3">
        <input
          className="rounded border border-slate-300 px-2 py-1"
          placeholder="Task title"
          value={newTask.title}
          onChange={(event) => setNewTask((prev) => ({ ...prev, title: event.target.value }))}
        />
        <input
          className="rounded border border-slate-300 px-2 py-1"
          placeholder="Description"
          value={newTask.description}
          onChange={(event) => setNewTask((prev) => ({ ...prev, description: event.target.value }))}
        />
        <button
          type="button"
          className="rounded bg-slate-900 px-3 py-1 text-white"
          onClick={() => {
            void addTask()
          }}
        >
          Add Task
        </button>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        {board?.columns.map((column) => (
          <article key={column.id} className="rounded border border-slate-200 bg-slate-50 p-3">
            <header className="mb-2 flex items-center justify-between">
              <h3 className="font-medium text-slate-800">{column.name}</h3>
              <span className="text-xs text-slate-500">{tasksByColumn.get(column.id)?.length ?? 0}</span>
            </header>
            <ul className="space-y-2">
              {(tasksByColumn.get(column.id) ?? []).map((task) => (
                <li key={task.id} className="rounded border border-slate-200 bg-white p-2">
                  <p className="text-sm font-medium text-slate-900">{task.title}</p>
                  <p className="text-xs text-slate-600">{task.description}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <label className="text-xs text-slate-600" htmlFor={`status-${task.id}`}>
                      Move
                    </label>
                    <select
                      id={`status-${task.id}`}
                      className="rounded border border-slate-300 px-1 py-0.5 text-xs"
                      value={task.status}
                      onChange={(event) => {
                        const nextStatus = event.target.value as TaskStatus
                        const targetColumn = board.columns.find((item) => item.key === nextStatus)
                        if (!targetColumn) {
                          return
                        }
                        void moveTask(task.id, targetColumn.id, statusByColumnKey[nextStatus])
                      }}
                    >
                      {board.columns.map((item) => (
                        <option key={item.id} value={item.key}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  )
}
