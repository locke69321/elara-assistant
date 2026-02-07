import type {
  Board,
  BoardDetail,
  ChatMessage,
  ChatSession,
  MemoryDocument,
  MemoryDocumentDetail,
  MemorySearchResult,
  Task,
  TaskEvent,
  TaskPriority,
  TaskStatus,
} from './types'

export interface ApiClientConfig {
  baseUrl: string
  token: string
}

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export class ApiClient {
  private readonly baseUrl: string
  private readonly token: string

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '')
    this.token = config.token
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
        ...(init?.headers ?? {}),
      },
    })

    if (!response.ok) {
      const text = await response.text()
      throw new ApiError(response.status, text || response.statusText)
    }

    return (await response.json()) as T
  }

  getMe(): Promise<{ id: string; email: string; name: string }> {
    return this.request('/api/v1/me')
  }

  listBoards(): Promise<Board[]> {
    return this.request('/api/v1/boards')
  }

  createBoard(name: string): Promise<Board> {
    return this.request('/api/v1/boards', {
      method: 'POST',
      body: JSON.stringify({ name }),
    })
  }

  getBoard(boardId: string): Promise<BoardDetail> {
    return this.request(`/api/v1/boards/${boardId}`)
  }

  listTasks(boardId: string): Promise<Task[]> {
    return this.request(`/api/v1/boards/${boardId}/tasks`)
  }

  createTask(payload: {
    boardId: string
    columnId: string
    title: string
    description: string
    priority: TaskPriority
    status: TaskStatus
  }): Promise<Task> {
    return this.request('/api/v1/tasks', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }

  updateTask(taskId: string, payload: { title?: string; description?: string; priority?: TaskPriority }): Promise<Task> {
    return this.request(`/api/v1/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  }

  moveTask(taskId: string, payload: { columnId: string; status: TaskStatus }): Promise<Task> {
    return this.request(`/api/v1/tasks/${taskId}/move`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }

  taskHistory(taskId: string): Promise<TaskEvent[]> {
    return this.request(`/api/v1/tasks/${taskId}/history`)
  }

  createChatSession(title: string): Promise<ChatSession> {
    return this.request('/api/v1/chat/sessions', {
      method: 'POST',
      body: JSON.stringify({ title }),
    })
  }

  sendChatMessage(sessionId: string, content: string): Promise<ChatMessage> {
    return this.request(`/api/v1/chat/sessions/${sessionId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ role: 'user', content }),
    })
  }

  listChatMessages(sessionId: string): Promise<ChatMessage[]> {
    return this.request(`/api/v1/chat/sessions/${sessionId}/messages`)
  }

  ingestMemory(payload: { title: string; content: string; sourceRef: string }): Promise<MemoryDocument> {
    return this.request('/api/v1/memory/documents', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }

  searchMemory(query: string, limit = 5): Promise<MemorySearchResult[]> {
    return this.request('/api/v1/memory/search', {
      method: 'POST',
      body: JSON.stringify({ query, limit }),
    })
  }

  getMemoryDocument(documentId: string): Promise<MemoryDocumentDetail> {
    return this.request(`/api/v1/memory/documents/${documentId}`)
  }
}
