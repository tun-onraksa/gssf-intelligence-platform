'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { MessageCircle, X, Send, Loader2, Bot, User, Trash2 } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const SUGGESTED = [
  'How many participants are there?',
  'Who needs a visa?',
  'List all sponsors',
  'How many teams are there?',
]

export function ChatBubble() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    const userMsg: Message = { role: 'user', content: trimmed }
    const updated = [...messages, userMsg]
    setMessages(updated)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updated }),
      })

      if (!res.ok) throw new Error('Request failed')

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let assistantText = ''

      setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

      while (reader) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        for (const line of chunk.split('\n')) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') break
            try {
              const { text } = JSON.parse(data)
              assistantText += text
              setMessages((prev) => {
                const next = [...prev]
                next[next.length - 1] = { role: 'assistant', content: assistantText }
                return next
              })
            } catch { /* skip malformed */ }
          }
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' },
      ])
    } finally {
      setLoading(false)
    }
  }, [messages, loading])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send(input)
    }
  }

  return (
    <>
      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-20 right-6 z-50 flex w-[380px] flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden"
          style={{ height: 520 }}>

          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-900 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600">
                <Bot size={14} className="text-white" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-white">GSSF Assistant</p>
                <p className="text-[10px] text-slate-400">Answers from live data only</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={() => setMessages([])}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                  title="Clear chat"
                >
                  <Trash2 size={13} />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 && (
              <div className="space-y-4 pt-2">
                <div className="text-center">
                  <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-blue-50">
                    <Bot size={20} className="text-blue-500" />
                  </div>
                  <p className="text-[13px] font-medium text-slate-700">Ask anything about the program</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Only answers from real data</p>
                </div>
                <div className="space-y-1.5">
                  {SUGGESTED.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left text-[12px] text-slate-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                  msg.role === 'user' ? 'bg-blue-600' : 'bg-slate-200'
                }`}>
                  {msg.role === 'user'
                    ? <User size={11} className="text-white" />
                    : <Bot size={11} className="text-slate-600" />
                  }
                </div>
                <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-[12px] leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-sm'
                    : 'bg-slate-100 text-slate-800 rounded-tl-sm'
                }`}>
                  {msg.content || (
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Loader2 size={11} className="animate-spin" /> Thinking…
                    </span>
                  )}
                </div>
              </div>
            ))}

            {loading && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex gap-2">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-200">
                  <Bot size={11} className="text-slate-600" />
                </div>
                <div className="rounded-2xl rounded-tl-sm bg-slate-100 px-3 py-2 text-[12px] text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Loader2 size={11} className="animate-spin" /> Thinking…
                  </span>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-slate-100 px-3 py-3">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about participants, sponsors…"
                className="flex-1 bg-transparent text-[12px] text-slate-700 placeholder-slate-400 focus:outline-none"
                disabled={loading}
              />
              <button
                onClick={() => send(input)}
                disabled={!input.trim() || loading}
                className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-600 text-white disabled:opacity-40 hover:bg-blue-700 transition-colors"
              >
                <Send size={11} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all ${
          open ? 'bg-slate-800 hover:bg-slate-700' : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {open
          ? <X size={20} className="text-white" />
          : <MessageCircle size={20} className="text-white" />
        }
        {!open && messages.length > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
            {messages.filter((m) => m.role === 'assistant').length}
          </span>
        )}
      </button>
    </>
  )
}
