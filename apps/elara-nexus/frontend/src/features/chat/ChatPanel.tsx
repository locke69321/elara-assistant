import { useEffect, useRef, useState } from 'react'

import type { ApiClient } from '@/lib/api/client'
import type { ChatMessage } from '@/lib/api/types'

interface ChatPanelProps {
  client: ApiClient
  onActivityStateChange?: (state: 'idle' | 'working') => void
  sessionId?: string | null
  autoCreateSession?: boolean
}

export function ChatPanel({ client, onActivityStateChange, sessionId, autoCreateSession = true }: ChatPanelProps) {
  const [internalSessionId, setInternalSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const activeSessionId = sessionId ?? internalSessionId

  useEffect(() => {
    let active = true

    void (async () => {
      try {
        setError('')
        if (sessionId) {
          setMessages(await client.listChatMessages(sessionId))
          return
        }

        if (!autoCreateSession) {
          setInternalSessionId(null)
          setMessages([])
          return
        }

        const created = await client.createChatSession('Primary Session')
        if (!active) {
          return
        }
        setInternalSessionId(created.id)
        setMessages(await client.listChatMessages(created.id))
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to initialize chat')
        }
      }
    })()

    return () => {
      active = false
    }
  }, [autoCreateSession, client, sessionId])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const sendMessage = async () => {
    if (!activeSessionId || !input.trim() || sending) {
      return
    }
    setSending(true)
    onActivityStateChange?.('working')
    try {
      await client.sendChatMessage(activeSessionId, input.trim())
      setMessages(await client.listChatMessages(activeSessionId))
      setInput('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message')
    } finally {
      setSending(false)
      onActivityStateChange?.('idle')
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void sendMessage()
    }
  }

  return (
    <section className="card" data-animate="rise" data-delay="3">
      <div className="card-header">
        <div>
          <p className="panel-kicker">Operator</p>
          <h2 className="section-title">Chat Runtime</h2>
          {activeSessionId ? <p className="section-subtitle">Session active</p> : <p className="section-subtitle">Select a session to begin</p>}
        </div>
      </div>
      {error ? <p className="error-message" role="alert">{error}</p> : null}

      <div ref={scrollRef} role="log" aria-label="Chat messages" className="chat-log">
        {messages.length === 0 ? (
          <p className="m-auto text-sm text-text-muted">No messages yet</p>
        ) : null}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message-bubble ${
              message.role === 'user'
                ? 'message-bubble--user'
                : 'message-bubble--assistant'
            }`}
          >
            <p className="text-xs font-medium opacity-70 mb-0.5">{message.role === 'user' ? 'You' : 'Assistant'}</p>
            <p>{message.content}</p>
          </div>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          className="input flex-1"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="Message"
          placeholder="Message"
          disabled={sending || !activeSessionId}
        />
        <button
          type="button"
          className="btn btn-primary"
          disabled={sending || !input.trim() || !activeSessionId}
          onClick={() => {
            void sendMessage()
          }}
        >
          {sending ? 'Sending…' : 'Send'}
        </button>
      </div>
    </section>
  )
}
