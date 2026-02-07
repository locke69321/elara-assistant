import { useEffect, useState } from 'react'

import type { ApiClient } from '@/lib/api/client'
import type { BoardDetail, Task, TaskPriority, TaskStatus } from '@/lib/api/types'

interface TaskDetailDialogProps {
  task: Task
  board: BoardDetail
  client: ApiClient
  onClose: () => void
  onUpdate: (updated: Task) => void
}

const priorityLabels: Record<TaskPriority, string> = {
  p0: 'Critical',
  p1: 'High',
  p2: 'Medium',
  p3: 'Low',
}

const statusByColumnKey: Record<string, TaskStatus> = {
  backlog: 'backlog',
  todo: 'todo',
  in_progress: 'in_progress',
  blocked: 'blocked',
  review: 'review',
  done: 'done',
}

export function TaskDetailDialog({ task, board, client, onClose, onUpdate }: TaskDetailDialogProps) {
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description)
  const [priority, setPriority] = useState<TaskPriority>(task.priority)
  const [status, setStatus] = useState<TaskStatus>(task.status)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setTitle(task.title)
    setDescription(task.description)
    setPriority(task.priority)
    setStatus(task.status)
    setError('')
  }, [task])

  const save = async () => {
    setSaving(true)
    setError('')
    try {
      let updated = task

      const fieldsDirty = title !== task.title || description !== task.description || priority !== task.priority
      if (fieldsDirty) {
        updated = await client.updateTask(task.id, {
          title: title.trim(),
          description: description.trim(),
          priority,
        })
      }

      if (status !== task.status) {
        const targetColumn = board.columns.find((col) => col.key === status)
        if (targetColumn) {
          updated = await client.moveTask(updated.id, {
            columnId: targetColumn.id,
            status: statusByColumnKey[status],
          })
        }
      }

      onUpdate(updated)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="dialog-overlay" onClick={onClose} role="presentation">
      <div
        className="dialog-panel"
        role="dialog"
        aria-label="Task details"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 className="dialog-title">Edit Task</h3>
        {error ? <p className="error-message">{error}</p> : null}

        <div className="mt-4 grid gap-3">
          <label className="label">
            <span className="label-text">Title</span>
            <input
              className="input"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>

          <label className="label">
            <span className="label-text">Description</span>
            <textarea
              className="input"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
            />
          </label>

          <label className="label">
            <span className="label-text">Priority</span>
            <select
              className="input"
              value={priority}
              onChange={(event) => setPriority(event.target.value as TaskPriority)}
            >
              {(Object.keys(priorityLabels) as TaskPriority[]).map((key) => (
                <option key={key} value={key}>{priorityLabels[key]}</option>
              ))}
            </select>
          </label>

          <label className="label">
            <span className="label-text">Status</span>
            <select
              className="input"
              value={status}
              onChange={(event) => setStatus(event.target.value as TaskStatus)}
            >
              {board.columns.map((col) => (
                <option key={col.id} value={col.key}>{col.name}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="dialog-actions">
          <button type="button" className="btn btn-secondary px-4 py-2" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary px-4 py-2"
            disabled={saving || !title.trim()}
            onClick={() => { void save() }}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
