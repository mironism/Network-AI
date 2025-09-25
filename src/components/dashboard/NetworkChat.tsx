'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Send, MessageSquare, Loader2 } from 'lucide-react'

interface MessageItem {
  role: 'user' | 'assistant'
  content: string
  contacts?: Array<{
    id: string
    name: string
    company?: string | null
    location?: string | null
    linkedin_url?: string | null
    similarity?: number
  }>
}

interface NetworkChatProps {
  open: boolean
  onOpenChange: (v: boolean) => void
}

export default function NetworkChat({ open, onOpenChange }: NetworkChatProps) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<MessageItem[]>([{
    role: 'assistant',
    content: 'Ask your CRM anything. Example: Who can help with fundraising?' 
  }])
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  // Ensure scroll-to-bottom when opening the sheet (after animation mounts)
  useEffect(() => {
    if (!open) return
    const id = setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      inputRef.current?.focus()
    }, 120)
    return () => clearTimeout(id)
  }, [open])

  const ask = async () => {
    const q = input.trim()
    if (!q) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: q }])
    setLoading(true)
    try {
      const resp = await fetch('/api/ask-network', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          messages: [...messages, { role: 'user', content: q }]
        })
      })
      if (!resp.ok) throw new Error('Request failed')
      const json = await resp.json()
      setMessages(prev => [...prev, { role: 'assistant', content: json.answer || 'No answer', contacts: json.contacts }])
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong.' }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      ask()
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0">
        <div className="h-full flex flex-col">
          <SheetHeader className="p-4">
            <SheetTitle className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" /> Ask Network
            </SheetTitle>
          </SheetHeader>
          <Separator />

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m, idx) => (
              <div key={idx} className={m.role === 'user' ? 'text-right' : 'text-left'}>
                <div className={
                  'inline-block rounded-lg px-3 py-2 text-sm ' +
                  (m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800')
                }>
                  {m.content}
                </div>
                {m.role === 'assistant' && m.contacts?.length ? (
                  <div className="mt-2 text-xs text-gray-600 space-y-2">
                    <div className="font-semibold">Suggested people</div>
                    <ul className="space-y-1">
                      {m.contacts.map(c => (
                        <li key={c.id} className="flex flex-col">
                          <span className="font-medium">{c.name}</span>
                          <span className="text-gray-500">
                            {c.company ? c.company : ''}{c.company && c.location ? ' • ' : ''}{c.location ? c.location : ''}
                          </span>
                          {c.linkedin_url && (
                            <a className="text-blue-600 hover:underline" href={c.linkedin_url} target="_blank" rel="noreferrer">LinkedIn</a>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <Separator />
          <div className="p-3 flex items-center gap-2">
            <Input
              placeholder="Ask anything about your network..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              ref={inputRef}
            />
            <Button onClick={ask} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}


