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
    <section className="rounded-lg border border-slate-300 bg-white p-4">
      <h2 className="text-lg font-semibold text-slate-900">Chat Runtime</h2>
      {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}

      <div className="mt-3 h-56 overflow-auto rounded border border-slate-200 p-2">
        {messages.map((message) => (
          <div key={message.id} className="mb-2 text-sm">
            <span className="font-semibold text-slate-800">{message.role}: </span>
            <span className="text-slate-700">{message.content}</span>
          </div>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          className="flex-1 rounded border border-slate-300 px-2 py-1"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Message"
        />
        <button
          type="button"
          className="rounded bg-slate-900 px-3 py-1 text-white"
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
