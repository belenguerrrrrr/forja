'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogoFull } from '@/components/shared/Logo'

export default function AuthPage() {
  const [email, setEmail]   = useState('')
  const [sent, setSent]     = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')
  const router   = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Si ya hay sesión activa, redirigir directamente
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push('/dashboard')
    })
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/magic-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    const data = await res.json()
    if (data.error) setError(data.error)
    else setSent(true)
    setLoading(false)
  }

  if (sent) return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-8 text-center">
        <div className="text-5xl mb-4">📬</div>
        <h2 className="text-xl font-semibold text-[#0F172A] mb-2">Revisa tu email</h2>
        <p className="text-[#64748B] text-sm">
          Enviamos un enlace a <strong className="text-[#0F172A]">{email}</strong>.<br />
          Haz clic en él para acceder. Válido durante 1 hora.
        </p>
        <button
          onClick={() => setSent(false)}
          className="mt-6 text-sm text-[#16A34A] hover:underline"
        >
          Usar otro email
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <LogoFull className="justify-center" />
          <p className="text-[#64748B] mt-1 text-sm">Forja tu mejor versión</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-8">
          <h2 className="text-lg font-semibold text-[#0F172A] mb-1">Accede a tu cuenta</h2>
          <p className="text-[#64748B] text-sm mb-6">Te enviamos un enlace mágico. Sin contraseñas.</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#16A34A] transition-colors"
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#16A34A] hover:bg-[#15803D] text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
            >
              {loading ? 'Enviando...' : 'Enviar enlace de acceso →'}
            </button>
          </form>
        </div>

        <button
          onClick={() => router.push('/onboarding')}
          className="w-full mt-3 py-3 text-sm text-[#64748B] hover:text-[#0F172A] transition-colors text-center"
        >
          Continuar sin registrarme →
        </button>
      </div>
    </div>
  )
}
