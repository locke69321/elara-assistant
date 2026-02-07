import { useEffect, useRef, useState } from 'react'

import type { ApiClient } from '@/lib/api/client'
import type { ChatMessage, ChatSession } from '@/lib/api/types'

interface ChatPanelProps {
  client: ApiClient
}

export function ChatPanel({ client }: ChatPanelProps) {
  const [session, setSession] = useState<ChatSession | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    void (async () => {
      try {
        const created = await client.createChatSession('Primary Session')
        setSession(created)
        setMessages(await client.listChatMessages(created.id))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize chat')
      }
    })()
  }, [client])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const sendMessage = async () => {
    if (!session || !input.trim() || sending) {
      return
    }
    setSending(true)
    try {
      await client.sendChatMessage(session.id, input.trim())
      setMessages(await client.listChatMessages(session.id))
      setInput('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void sendMessage()
    }
  }

  return (
    <section className="card">
      <h2 className="section-title">Chat Runtime</h2>
      {error ? <p className="error-message" role="alert">{error}</p> : null}

      <div ref={scrollRef} role="log" aria-label="Chat messages" className="mt-3 flex h-64 flex-col gap-2 overflow-auto rounded-md border border-border-subtle bg-surface-sunken p-3">
        {messages.length === 0 ? (
          <p className="m-auto text-sm text-text-muted">No messages yet</p>
        ) : null}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
              message.role === 'user'
                ? 'self-end bg-interactive text-on-interactive'
                : 'self-start bg-surface-raised border border-border-subtle text-text-primary'
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
          disabled={sending}
        />
        <button
          type="button"
          className="btn btn-primary"
          disabled={sending || !input.trim()}
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
