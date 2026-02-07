import { useState } from 'react'

import type { ApiClient } from '@/lib/api/client'
import type { TaskPriority, TaskStatus } from '@/lib/api/types'

interface TaskComposerCardProps {
  client: ApiClient
  onTaskCreated?: () => void
}

const priorityLabels: Record<TaskPriority, string> = {
  p0: 'Critical',
  p1: 'High',
  p2: 'Medium',
  p3: 'Low',
}

const backlogTargets: TaskStatus[] = ['todo', 'backlog']

export function TaskComposerCard({ client, onTaskCreated }: TaskComposerCardProps) {
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'p2' as TaskPriority })
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const addTask = async () => {
    if (creating || !newTask.title.trim()) {
      return
    }

    setCreating(true)
    setError('')
    setSuccess('')

    try {
      const boards = await client.listBoards()
      const active = boards[0] ?? (await client.createBoard('Default Board'))
      const detail = await client.getBoard(active.id)

      const targetStatus = backlogTargets.find((status) => detail.columns.some((column) => column.key === status))
      if (!targetStatus) {
        setError('Backlog lane unavailable')
        return
      }

      const targetColumn = detail.columns.find((column) => column.key === targetStatus)
      if (!targetColumn) {
        setError('Backlog lane unavailable')
        return
      }

      await client.createTask({
        boardId: active.id,
        columnId: targetColumn.id,
        title: newTask.title.trim(),
        description: newTask.description.trim(),
        priority: newTask.priority,
        status: targetStatus,
      })

      setNewTask({ title: '', description: '', priority: 'p2' })
      setSuccess('Task created')
      onTaskCreated?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task')
    } finally {
      setCreating(false)
    }
  }

  return (
    <section className="card" data-animate="rise" data-delay="3">
      <div className="card-header">
        <div>
          <p className="panel-kicker">Planning</p>
          <h2 className="section-title">Add Task</h2>
        </div>
      </div>

      {error ? <p className="error-message" role="alert">{error}</p> : null}
      {success ? <p className="success-message" role="status">{success}</p> : null}

      <div className="grid gap-2">
        <input
          className="input"
          aria-label="Task title"
          placeholder="Task title"
          value={newTask.title}
          onChange={(event) => setNewTask((prev) => ({ ...prev, title: event.target.value }))}
          disabled={creating}
        />
        <input
          className="input"
          aria-label="Description"
          placeholder="Description"
          value={newTask.description}
          onChange={(event) => setNewTask((prev) => ({ ...prev, description: event.target.value }))}
          disabled={creating}
        />
        <select
          className="input"
          value={newTask.priority}
          aria-label="Priority"
          onChange={(event) => setNewTask((prev) => ({ ...prev, priority: event.target.value as TaskPriority }))}
          disabled={creating}
        >
          {(Object.keys(priorityLabels) as TaskPriority[]).map((key) => (
            <option key={key} value={key}>{priorityLabels[key]}</option>
          ))}
        </select>
        <button
          type="button"
          className="btn btn-primary"
          disabled={creating || !newTask.title.trim()}
          onClick={() => {
            void addTask()
          }}
        >
          {creating ? 'Adding…' : 'Add Task'}
        </button>
      </div>
    </section>
  )
}
