import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Mock } from 'vitest'

import type { ApiClient } from '@/lib/api/client'

import { KanbanBoard } from './KanbanBoard'

function buildClientMock(): { client: ApiClient; moveTaskMock: Mock; updateTaskMock: Mock } {
  const listBoards = vi.fn(async () => [{ id: 'b1', name: 'Board' }])
  const createBoard = vi.fn(async (name: string) => ({ id: 'b2', name }))
  const getBoard = vi.fn(async () => ({
    id: 'b1',
    name: 'Board',
    columns: [
      { id: 'c1', key: 'todo' as const, name: 'Todo', position: 1 },
      { id: 'c2', key: 'in_progress' as const, name: 'In Progress', position: 2 },
    ],
  }))
  const listTasks = vi.fn(async () => [
    {
      id: 't1',
      boardId: 'b1',
      columnId: 'c1',
      title: 'Initial task',
      description: 'desc',
      priority: 'p2' as const,
      status: 'todo' as const,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ])
  const createTask = vi.fn(async () => ({
    id: 't2',
    boardId: 'b1',
    columnId: 'c1',
    title: 'Added task',
    description: 'new desc',
    priority: 'p2' as const,
    status: 'todo' as const,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }))
  const moveTask = vi.fn(async () => ({
    id: 't1',
    boardId: 'b1',
    columnId: 'c2',
    title: 'Initial task',
    description: 'desc',
    priority: 'p2' as const,
    status: 'in_progress' as const,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:01.000Z',
  }))
  const updateTask = vi.fn(async () => ({
    id: 't1',
    boardId: 'b1',
    columnId: 'c1',
    title: 'Updated title',
    description: 'desc',
    priority: 'p2' as const,
    status: 'todo' as const,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:01.000Z',
  }))

  const client = {
    listBoards,
    createBoard,
    getBoard,
    listTasks,
    createTask,
    moveTask,
    updateTask,
  } as unknown as ApiClient

  return { client, moveTaskMock: moveTask as unknown as Mock, updateTaskMock: updateTask as unknown as Mock }
}

describe('KanbanBoard', () => {
  it('loads board data, adds tasks, and moves tasks', async () => {
    const { client, moveTaskMock } = buildClientMock()
    render(<KanbanBoard client={client} />)

    await waitFor(() => {
      expect(screen.getByText('Initial task')).toBeTruthy()
    })

    const titleInput = screen.getByPlaceholderText('Task title')
    const descriptionInput = screen.getByPlaceholderText('Description')
    const prioritySelect = screen.getByLabelText('Priority')
    fireEvent.change(titleInput, { target: { value: 'Added task' } })
    fireEvent.change(descriptionInput, { target: { value: 'new desc' } })
    fireEvent.change(prioritySelect, { target: { value: 'p1' } })
    fireEvent.click(screen.getByText('Add Task'))

    await waitFor(() => {
      expect(screen.getByText('Added task')).toBeTruthy()
    })

    fireEvent.change(screen.getAllByLabelText('Move')[0], { target: { value: 'in_progress' } })
    await waitFor(() => {
      expect(moveTaskMock).toHaveBeenCalled()
    })
  })

  it('renders error when initial load fails', async () => {
    const client = {
      listBoards: vi.fn(async () => {
        throw new Error('boom')
      }),
    } as unknown as ApiClient

    render(<KanbanBoard client={client} />)

    await waitFor(() => {
      expect(screen.getByText('boom')).toBeTruthy()
    })

    fireEvent.click(screen.getByText('Add Task'))
  })

  it('handles move failures and ignores unknown target columns', async () => {
    const moveTask = vi.fn(async () => {
      throw new Error('bad move')
    })
    const client = {
      listBoards: vi.fn(async () => [{ id: 'b1', name: 'Board' }]),
      createBoard: vi.fn(async () => ({ id: 'b2', name: 'Board' })),
      getBoard: vi.fn(async () => ({
        id: 'b1',
        name: 'Board',
        columns: [
          { id: 'c1', key: 'todo' as const, name: 'Todo', position: 1 },
          { id: 'c2', key: 'in_progress' as const, name: 'In Progress', position: 2 },
        ],
      })),
      listTasks: vi.fn(async () => [
        {
          id: 't1',
          boardId: 'b1',
          columnId: 'c1',
          title: 'Initial task',
          description: 'desc',
          priority: 'p2' as const,
          status: 'todo' as const,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ]),
      createTask: vi.fn(async () => ({
        id: 't2',
        boardId: 'b1',
        columnId: 'c1',
        title: 'Added task',
        description: 'new desc',
        priority: 'p2' as const,
        status: 'todo' as const,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      })),
      moveTask,
    } as unknown as ApiClient

    render(<KanbanBoard client={client} />)
    await waitFor(() => {
      expect(screen.getByText('Initial task')).toBeTruthy()
    })

    fireEvent.change(screen.getAllByLabelText('Move')[0], { target: { value: 'blocked' } })
    expect(moveTask).not.toHaveBeenCalled()

    fireEvent.change(screen.getAllByLabelText('Move')[0], { target: { value: 'in_progress' } })
    await waitFor(() => {
      expect(screen.getByText('bad move')).toBeTruthy()
    })
  })

  it('ignores invalid adds and shows create errors', async () => {
    const createTask = vi.fn(async () => {
      throw new Error('create failed')
    })
    const client = {
      listBoards: vi.fn(async () => [{ id: 'b1', name: 'Board' }]),
      createBoard: vi.fn(async () => ({ id: 'b2', name: 'Board' })),
      getBoard: vi.fn(async () => ({
        id: 'b1',
        name: 'Board',
        columns: [
          { id: 'c1', key: 'todo' as const, name: 'Todo', position: 1 },
          { id: 'c2', key: 'in_progress' as const, name: 'In Progress', position: 2 },
        ],
      })),
      listTasks: vi.fn(async () => []),
      createTask,
      moveTask: vi.fn(async () => {
        throw new Error('unused')
      }),
    } as unknown as ApiClient

    render(<KanbanBoard client={client} />)
    await waitFor(() => {
      expect(screen.getByText('Kanban')).toBeTruthy()
    })

    fireEvent.click(screen.getByText('Add Task'))
    expect(createTask).not.toHaveBeenCalled()

    fireEvent.change(screen.getByPlaceholderText('Task title'), { target: { value: 'New Task' } })
    fireEvent.change(screen.getByPlaceholderText('Description'), { target: { value: 'desc' } })
    fireEvent.click(screen.getByText('Add Task'))

    await waitFor(() => {
      expect(screen.getByText('create failed')).toBeTruthy()
    })
  })

  it('opens task detail dialog on task title click and closes on cancel', async () => {
    const { client } = buildClientMock()
    render(<KanbanBoard client={client} />)

    await waitFor(() => {
      expect(screen.getByText('Initial task')).toBeTruthy()
    })

    fireEvent.click(screen.getByText('Initial task'))

    await waitFor(() => {
      expect(screen.getByText('Edit Task')).toBeTruthy()
      expect(screen.getByDisplayValue('Initial task')).toBeTruthy()
    })

    fireEvent.click(screen.getByText('Cancel'))

    await waitFor(() => {
      expect(screen.queryByText('Edit Task')).toBeNull()
    })
  })

  it('updates task list when saving via detail dialog', async () => {
    const { client, updateTaskMock } = buildClientMock()
    render(<KanbanBoard client={client} />)

    await waitFor(() => {
      expect(screen.getByText('Initial task')).toBeTruthy()
    })

    fireEvent.click(screen.getByText('Initial task'))

    await waitFor(() => {
      expect(screen.getByText('Edit Task')).toBeTruthy()
    })

    fireEvent.change(screen.getByDisplayValue('Initial task'), { target: { value: 'Updated title' } })
    fireEvent.click(screen.getByText('Save'))

    await waitFor(() => {
      expect(updateTaskMock).toHaveBeenCalled()
      expect(screen.getByText('Updated title')).toBeTruthy()
      expect(screen.queryByText('Edit Task')).toBeNull()
    })
  })

  it('maps done tasks into Complete lane', async () => {
    const client = {
      listBoards: vi.fn(async () => [{ id: 'b1', name: 'Board' }]),
      createBoard: vi.fn(async () => ({ id: 'b2', name: 'Board' })),
      getBoard: vi.fn(async () => ({
        id: 'b1',
        name: 'Board',
        columns: [
          { id: 'c1', key: 'todo' as const, name: 'Todo', position: 1 },
          { id: 'c2', key: 'done' as const, name: 'Done', position: 2 },
        ],
      })),
      listTasks: vi.fn(async () => [
        {
          id: 't1',
          boardId: 'b1',
          columnId: 'c2',
          title: 'Shipped task',
          description: '',
          priority: 'p2' as const,
          status: 'done' as const,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ]),
      createTask: vi.fn(async () => {
        throw new Error('unused')
      }),
      moveTask: vi.fn(async () => {
        throw new Error('unused')
      }),
    } as unknown as ApiClient

    render(<KanbanBoard client={client} />)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Complete' })).toBeTruthy()
      expect(screen.getByText('Shipped task')).toBeTruthy()
    })
  })

  it('does not move task when selected lane has no mapped backend target', async () => {
    const moveTask = vi.fn(async () => ({
      id: 't1',
      boardId: 'b1',
      columnId: 'c2',
      title: 'Initial task',
      description: 'desc',
      priority: 'p2' as const,
      status: 'in_progress' as const,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:01.000Z',
    }))
    const client = {
      listBoards: vi.fn(async () => [{ id: 'b1', name: 'Board' }]),
      createBoard: vi.fn(async () => ({ id: 'b2', name: 'Board' })),
      getBoard: vi.fn(async () => ({
        id: 'b1',
        name: 'Board',
        columns: [
          { id: 'c1', key: 'todo' as const, name: 'Todo', position: 1 },
          { id: 'c2', key: 'in_progress' as const, name: 'In Progress', position: 2 },
        ],
      })),
      listTasks: vi.fn(async () => [
        {
          id: 't1',
          boardId: 'b1',
          columnId: 'c1',
          title: 'Initial task',
          description: 'desc',
          priority: 'p2' as const,
          status: 'todo' as const,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ]),
      createTask: vi.fn(async () => ({
        id: 't2',
        boardId: 'b1',
        columnId: 'c1',
        title: 'Added task',
        description: 'new desc',
        priority: 'p2' as const,
        status: 'todo' as const,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      })),
      moveTask,
    } as unknown as ApiClient

    render(<KanbanBoard client={client} />)
    await waitFor(() => {
      expect(screen.getByText('Initial task')).toBeTruthy()
    })

    fireEvent.change(screen.getAllByLabelText('Move')[0], { target: { value: 'complete' } })
    expect(moveTask).not.toHaveBeenCalled()
  })
})
