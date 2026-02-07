import { useEffect, useState } from 'react'

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

  const sendMessage = async () => {
    if (!session || !input.trim()) {
      return
    }
    try {
      await client.sendChatMessage(session.id, input.trim())
      setMessages(await client.listChatMessages(session.id))
      setInput('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message')
    }
  }

  return (
    <section className="card">
      <h2 className="section-title">Chat Runtime</h2>
      {error ? <p className="error-message">{error}</p> : null}

      <div className="mt-3 h-56 overflow-auto rounded-md border border-border-subtle bg-surface-sunken p-2">
        {messages.map((message) => (
          <div key={message.id} className="mb-2 text-sm">
            <span className="font-semibold text-text-primary">{message.role}: </span>
            <span className="text-text-secondary">{message.content}</span>
          </div>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          className="input flex-1"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Message"
        />
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            void sendMessage()
          }}
        >
          Send
        </button>
      </div>
    </section>
  )
}
