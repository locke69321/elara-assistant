export type TaskStatus =
  | 'backlog'
  | 'todo'
  | 'in_progress'
  | 'blocked'
  | 'review'
  | 'done'

export type TaskPriority = 'p0' | 'p1' | 'p2' | 'p3'

export interface Board {
  id: string
  name: string
}

export interface Column {
  id: string
  key: TaskStatus
  name: string
  position: number
}

export interface BoardDetail extends Board {
  columns: Column[]
}

export interface Task {
  id: string
  boardId: string
  columnId: string
  title: string
  description: string
  priority: TaskPriority
  status: TaskStatus
  createdAt: string
  updatedAt: string
}

export interface TaskEvent {
  id: string
  eventType: string
  payload: string
  createdAt: string
}

export interface ChatSession {
  id: string
  title: string
  createdAt: string
}

export interface RunInfo {
  id: string
  status: string
  provider: string
  model: string
  traceId: string
}

export interface ChatMessage {
  id: string
  sessionId: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
  run: RunInfo | null
}

export interface MemoryDocument {
  id: string
  title: string
  chunkCount: number
}

export interface MemorySearchResult {
  chunkId: string
  documentId: string
  score: number
  snippet: string
  sourceRef: string
}

export interface MemoryDocumentDetail {
  id: string
  title: string
  content: string
  sourceRef: string
  createdAt: string
}
