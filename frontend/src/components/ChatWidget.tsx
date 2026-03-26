import type { FormEvent } from 'react'
import { useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import type { ChatRecord } from '../types'

interface ChatWidgetProps {
  open: boolean
  onToggle: () => void
  history: ChatRecord[]
  message: string
  onMessageChange: (value: string) => void
  onSubmit: (e: FormEvent<HTMLFormElement>) => void
  loading: boolean
}

export default function ChatWidget({ open, onToggle, history, message, onMessageChange, onSubmit, loading }: ChatWidgetProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputClass =
    'flex-1 resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-violet-500 focus:outline-none'

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history, loading])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!loading && message.trim()) {
        onSubmit(e as unknown as FormEvent<HTMLFormElement>)
      }
    }
  }

  return (
    <>
      {/* Toggle Button */}
      {!open && (
        <button
          className="fixed bottom-4 right-4 z-[210] flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-xl text-white shadow-lg shadow-violet-500/30 transition-transform hover:scale-105"
          onClick={onToggle}
          title="Chat AI"
        >
          🤖
        </button>
      )}

      {open && (
        <div className="fixed bottom-0 left-0 right-0 z-[200] flex max-h-[95vh] flex-col overflow-hidden rounded-none border border-white/10 bg-[#0f0f18] shadow-2xl md:bottom-6 md:left-auto md:right-6 md:w-96 md:rounded-2xl md:max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="text-xl">🤖</span>
              <div>
                <h3 className="font-semibold text-white">SiagaMate AI</h3>
                <p className="text-xs text-slate-500">Asisten Bencana</p>
              </div>
            </div>
            <button
              className="cursor-pointer text-slate-500 transition hover:text-white"
              onClick={onToggle}
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex min-h-[200px] flex-1 flex-col gap-3 overflow-y-auto p-4">
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="mb-3 text-3xl">👋</div>
                <p className="text-sm text-slate-400">Halo! Tanya saya tentang bencana.</p>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  {['Evakuasi', 'P3K', 'Gempa', 'Banjir'].map((topic) => (
                    <span key={topic} className="rounded-full bg-violet-500/10 px-3 py-1 text-xs text-violet-300">
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {[...history].reverse().map((chat, idx) => (
                  <div key={idx} className="flex flex-col gap-2">
                    {/* User */}
                    <div className="max-w-[80%] self-end rounded-2xl rounded-br-sm bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2.5 text-sm text-white">
                      {chat.message}
                    </div>

                    {/* AI */}
                    {chat.provider !== 'user' && (
                      <div className="max-w-[80%] self-start rounded-2xl rounded-bl-sm border border-white/5 bg-white/5 px-4 py-2.5 text-sm text-slate-200">
                        <div className="chat-markdown">
                          <ReactMarkdown>{chat.answer}</ReactMarkdown>
                        </div>
                        <p className="mt-2 text-[10px] text-slate-500">
                          {chat.provider === 'gemini' ? 'AI Gemini' : 'Pedoman Offline'}
                        </p>
                      </div>
                    )}
                  </div>
                ))}

                {loading && (
                  <div className="flex items-center gap-2 self-start rounded-2xl rounded-bl-sm border border-white/5 bg-white/5 px-4 py-3 text-sm text-slate-400">
                    <div className="flex gap-1">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-400" style={{ animationDelay: '0ms' }} />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-400" style={{ animationDelay: '150ms' }} />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-400" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span>Berpikir...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input */}
          <form className="flex gap-2 border-t border-white/5 p-3" onSubmit={onSubmit}>
            <textarea
              className={inputClass}
              rows={1}
              value={message}
              onChange={(e) => onMessageChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tanya sesuatu..."
              disabled={loading}
            />
            <button
              type="submit"
              className="cursor-pointer rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
              disabled={loading || !message.trim()}
            >
              ↑
            </button>
          </form>
        </div>
      )}
    </>
  )
}
