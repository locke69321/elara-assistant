import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { ApiClient } from '@/lib/api/client'
import type { BoardDetail, Task } from '@/lib/api/types'

import { TaskDetailDialog } from './TaskDetailDialog'

const board: BoardDetail = {
  id: 'b1',
  name: 'Board',
  columns: [
    { id: 'c1', key: 'todo', name: 'Todo', position: 1 },
    { id: 'c2', key: 'in_progress', name: 'In Progress', position: 2 },
    { id: 'c3', key: 'done', name: 'Done', position: 3 },
  ],
}

const task: Task = {
  id: 't1',
  boardId: 'b1',
  columnId: 'c1',
  title: 'Original title',
  description: 'Original desc',
  priority: 'p2',
  status: 'todo',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

describe('TaskDetailDialog', () => {
  it('renders task fields and saves field changes', async () => {
    const updatedTask: Task = { ...task, title: 'New title', description: 'New desc', priority: 'p1' }
    const updateTask = vi.fn(async () => updatedTask)
    const client = { updateTask, moveTask: vi.fn() } as unknown as ApiClient
    const onClose = vi.fn()
    const onUpdate = vi.fn()

    render(
      <TaskDetailDialog task={task} board={board} client={client} onClose={onClose} onUpdate={onUpdate} />,
    )

    expect(screen.getByDisplayValue('Original title')).toBeTruthy()
    expect(screen.getByDisplayValue('Original desc')).toBeTruthy()
    expect(screen.getByText('Edit Task')).toBeTruthy()

    fireEvent.change(screen.getByDisplayValue('Original title'), { target: { value: 'New title' } })
    fireEvent.change(screen.getByDisplayValue('Original desc'), { target: { value: 'New desc' } })
    fireEvent.click(screen.getByText('Save'))

    await waitFor(() => {
      expect(updateTask).toHaveBeenCalledWith('t1', {
        title: 'New title',
        description: 'New desc',
        priority: 'p2',
      })
      expect(onUpdate).toHaveBeenCalledWith(updatedTask)
      expect(onClose).toHaveBeenCalled()
    })
  })

  it('saves status changes via moveTask', async () => {
    const movedTask: Task = { ...task, status: 'in_progress', columnId: 'c2' }
    const moveTask = vi.fn(async () => movedTask)
    const client = { updateTask: vi.fn(async () => task), moveTask } as unknown as ApiClient
    const onClose = vi.fn()
    const onUpdate = vi.fn()

    render(
      <TaskDetailDialog task={task} board={board} client={client} onClose={onClose} onUpdate={onUpdate} />,
    )

    fireEvent.change(screen.getByDisplayValue('Todo'), { target: { value: 'in_progress' } })
    fireEvent.click(screen.getByText('Save'))

    await waitFor(() => {
      expect(moveTask).toHaveBeenCalledWith('t1', { columnId: 'c2', status: 'in_progress' })
      expect(onUpdate).toHaveBeenCalledWith(movedTask)
      expect(onClose).toHaveBeenCalled()
    })
  })

  it('shows error on save failure', async () => {
    const client = {
      updateTask: vi.fn(async () => { throw new Error('update failed') }),
      moveTask: vi.fn(),
    } as unknown as ApiClient
    const onClose = vi.fn()
    const onUpdate = vi.fn()

    render(
      <TaskDetailDialog task={task} board={board} client={client} onClose={onClose} onUpdate={onUpdate} />,
    )

    fireEvent.change(screen.getByDisplayValue('Original title'), { target: { value: 'Changed' } })
    fireEvent.click(screen.getByText('Save'))

    await waitFor(() => {
      expect(screen.getByText('update failed')).toBeTruthy()
    })

    expect(onClose).not.toHaveBeenCalled()
    expect(onUpdate).not.toHaveBeenCalled()
  })

  it('closes on cancel', () => {
    const client = { updateTask: vi.fn(), moveTask: vi.fn() } as unknown as ApiClient
    const onClose = vi.fn()
    const onUpdate = vi.fn()

    render(
      <TaskDetailDialog task={task} board={board} client={client} onClose={onClose} onUpdate={onUpdate} />,
    )

    fireEvent.click(screen.getByText('Cancel'))
    expect(onClose).toHaveBeenCalled()
  })

  it('closes on overlay click', () => {
    const client = { updateTask: vi.fn(), moveTask: vi.fn() } as unknown as ApiClient
    const onClose = vi.fn()

    render(
      <TaskDetailDialog task={task} board={board} client={client} onClose={onClose} onUpdate={vi.fn()} />,
    )

    fireEvent.click(screen.getByRole('presentation'))
    expect(onClose).toHaveBeenCalled()
  })

  it('uses fallback error for non-Error failures', async () => {
    const client = {
      updateTask: vi.fn(() => Promise.reject('bad')),
      moveTask: vi.fn(),
    } as unknown as ApiClient

    render(
      <TaskDetailDialog task={task} board={board} client={client} onClose={vi.fn()} onUpdate={vi.fn()} />,
    )

    fireEvent.change(screen.getByDisplayValue('Original title'), { target: { value: 'Changed' } })
    fireEvent.click(screen.getByText('Save'))

    await waitFor(() => {
      expect(screen.getByText('Failed to save changes')).toBeTruthy()
    })
  })

  it('skips API calls when nothing changed', async () => {
    const updateTask = vi.fn()
    const moveTask = vi.fn()
    const client = { updateTask, moveTask } as unknown as ApiClient
    const onClose = vi.fn()
    const onUpdate = vi.fn()

    render(
      <TaskDetailDialog task={task} board={board} client={client} onClose={onClose} onUpdate={onUpdate} />,
    )

    fireEvent.click(screen.getByText('Save'))

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled()
    })

    expect(updateTask).not.toHaveBeenCalled()
    expect(moveTask).not.toHaveBeenCalled()
    expect(onUpdate).toHaveBeenCalledWith(task)
  })
})
