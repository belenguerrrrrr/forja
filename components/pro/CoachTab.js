'use client'

import { useState, useEffect, useRef } from 'react'

export default function CoachTab({ user }) {
  const [messages, setMessages] = useState([])
  const [input,    setInput]    = useState('')
  const [sending,  setSending]  = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    fetch('/api/coach')
      .then(r => r.json())
      .then(d => {
        if (d.messages?.length) setMessages(d.messages)
        else setMessages([{
          id: 'welcome', role: 'assistant',
          content: '¡Hola! Soy tu FORJA Coach 🔥 Pregúntame lo que quieras sobre tu entrenamiento, nutrición, o cómo sacar el máximo partido a tu plan. Estoy aquí 24/7.',
        }])
      })
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    if (!input.trim() || sending) return
    const msg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { id: Date.now(), role: 'user', content: msg }])
    setSending(true)
    const res  = await fetch('/api/coach', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg }),
    })
    const data = await res.json()
    if (data.message) setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', content: data.message }])
    setSending(false)
  }

  const SUGGESTIONS = [
    '¿Puedo comer carbos por la noche?',
    '¿Cómo evito el estancamiento?',
    'Explícame el plan de hoy',
    '¿Qué como antes de entrenar?',
  ]

  return (
    <div className="flex flex-col h-[calc(100vh-200px)]">
      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-[#16A34A]/20 border border-[#16A34A]/30 flex items-center justify-center text-xs text-[#16A34A] font-bold mr-2 mt-1 shrink-0">F</div>
            )}
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              m.role === 'user'
                ? 'bg-[#16A34A] text-white rounded-tr-none'
                : 'bg-[#FFFFFF] border border-[#E2E8F0] text-[#0F172A] rounded-tl-none'
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-full bg-[#16A34A]/20 border border-[#16A34A]/30 flex items-center justify-center text-xs text-[#16A34A] font-bold mr-2 shrink-0">F</div>
            <div className="bg-white border border-[#E2E8F0] rounded-2xl rounded-tl-none px-4 py-3">
              <div className="flex gap-1">
                {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 bg-[#64748B] rounded-full animate-bounce" style={{ animationDelay: `${i*0.15}s` }}/>)}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {SUGGESTIONS.map(s => (
            <button key={s} onClick={() => setInput(s)}
              className="text-xs bg-white border border-[#E2E8F0] hover:border-[#16A34A] text-[#64748B] hover:text-[#0F172A] px-3 py-1.5 rounded-full transition-all">
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Pregúntale a tu coach..."
          className="flex-1 bg-white border border-[#E2E8F0] focus:border-[#16A34A] rounded-xl px-4 py-3 text-sm text-[#0F172A] placeholder-[#64748B] focus:outline-none"
        />
        <button onClick={send} disabled={!input.trim() || sending}
          className="bg-[#16A34A] hover:bg-[#15803D] disabled:opacity-40 text-white px-4 rounded-xl font-semibold text-sm">
          →
        </button>
      </div>
    </div>
  )
}
