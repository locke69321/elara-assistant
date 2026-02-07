import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { ApiClient } from '@/lib/api/client'

import { TaskComposerCard } from './TaskComposerCard'

describe('TaskComposerCard', () => {
  it('creates a task in backlog lane and notifies parent', async () => {
    const onTaskCreated = vi.fn()
    const createTask = vi.fn(async () => ({ id: 't1' }))
    const client = {
      listBoards: vi.fn(async () => [{ id: 'b1', name: 'Board' }]),
      createBoard: vi.fn(async () => ({ id: 'b2', name: 'Default Board' })),
      getBoard: vi.fn(async () => ({
        id: 'b1',
        name: 'Board',
        columns: [
          { id: 'c1', key: 'todo' as const, name: 'Todo', position: 1 },
          { id: 'c2', key: 'in_progress' as const, name: 'In Progress', position: 2 },
        ],
      })),
      createTask,
    } as unknown as ApiClient

    render(<TaskComposerCard client={client} onTaskCreated={onTaskCreated} />)

    fireEvent.change(screen.getByPlaceholderText('Task title'), { target: { value: 'Ship updates' } })
    fireEvent.change(screen.getByPlaceholderText('Description'), { target: { value: 'Implement requested UI changes' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add Task' }))

    await waitFor(() => {
      expect(createTask).toHaveBeenCalledWith({
        boardId: 'b1',
        columnId: 'c1',
        title: 'Ship updates',
        description: 'Implement requested UI changes',
        priority: 'p2',
        status: 'todo',
      })
      expect(onTaskCreated).toHaveBeenCalled()
      expect(screen.getByText('Task created')).toBeTruthy()
    })
  })

  it('does not submit when title is empty', () => {
    const client = {
      listBoards: vi.fn(async () => [{ id: 'b1', name: 'Board' }]),
      createBoard: vi.fn(async () => ({ id: 'b2', name: 'Default Board' })),
      getBoard: vi.fn(async () => ({ id: 'b1', name: 'Board', columns: [] })),
      createTask: vi.fn(async () => ({ id: 't1' })),
    } as unknown as ApiClient

    render(<TaskComposerCard client={client} />)

    const addButton = screen.getByRole('button', { name: 'Add Task' })
    expect((addButton as HTMLButtonElement).disabled).toBe(true)
  })

  it('creates a default board when none exist', async () => {
    const createBoard = vi.fn(async () => ({ id: 'b2', name: 'Default Board' }))
    const createTask = vi.fn(async () => ({ id: 't1' }))
    const client = {
      listBoards: vi.fn(async () => []),
      createBoard,
      getBoard: vi.fn(async () => ({
        id: 'b2',
        name: 'Default Board',
        columns: [{ id: 'c1', key: 'backlog' as const, name: 'Backlog', position: 1 }],
      })),
      createTask,
    } as unknown as ApiClient

    render(<TaskComposerCard client={client} />)
    fireEvent.change(screen.getByPlaceholderText('Task title'), { target: { value: 'Bootstrapped task' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add Task' }))

    await waitFor(() => {
      expect(createBoard).toHaveBeenCalledWith('Default Board')
      expect(createTask).toHaveBeenCalledWith({
        boardId: 'b2',
        columnId: 'c1',
        title: 'Bootstrapped task',
        description: '',
        priority: 'p2',
        status: 'backlog',
      })
    })
  })

  it('shows backlog unavailable error when no backlog-compatible lane exists', async () => {
    const createTask = vi.fn(async () => ({ id: 't1' }))
    const client = {
      listBoards: vi.fn(async () => [{ id: 'b1', name: 'Board' }]),
      createBoard: vi.fn(async () => ({ id: 'b2', name: 'Default Board' })),
      getBoard: vi.fn(async () => ({
        id: 'b1',
        name: 'Board',
        columns: [{ id: 'c9', key: 'done' as const, name: 'Done', position: 1 }],
      })),
      createTask,
    } as unknown as ApiClient

    render(<TaskComposerCard client={client} />)
    fireEvent.change(screen.getByPlaceholderText('Task title'), { target: { value: 'Needs backlog' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add Task' }))

    await waitFor(() => {
      expect(screen.getByText('Backlog lane unavailable')).toBeTruthy()
      expect(createTask).not.toHaveBeenCalled()
    })
  })

  it('shows fallback error message for non-Error failures', async () => {
    const client = {
      listBoards: vi.fn(async () => [{ id: 'b1', name: 'Board' }]),
      createBoard: vi.fn(async () => ({ id: 'b2', name: 'Default Board' })),
      getBoard: vi.fn(async () => ({
        id: 'b1',
        name: 'Board',
        columns: [{ id: 'c1', key: 'todo' as const, name: 'Todo', position: 1 }],
      })),
      createTask: vi.fn(() => Promise.reject('bad')),
    } as unknown as ApiClient

    render(<TaskComposerCard client={client} />)
    fireEvent.change(screen.getByPlaceholderText('Task title'), { target: { value: 'task' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add Task' }))

    await waitFor(() => {
      expect(screen.getByText('Failed to create task')).toBeTruthy()
    })
  })
})
