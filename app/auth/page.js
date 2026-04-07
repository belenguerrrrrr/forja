'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function AuthForm() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const errorParam = searchParams.get('error')
  const isExpired = errorParam === 'expired'

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (!error) setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1
            className="text-6xl text-[#16A34A] tracking-wider"
            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
          >
            FORJA
          </h1>
          <p className="text-[#64748B] mt-2">Forja tu mejor versión</p>
        </div>

        {/* Error de enlace caducado */}
        {isExpired && !sent && (
          <div className="bg-[#FFF7ED] border border-[#FED7AA] rounded-2xl px-5 py-4 mb-5 flex gap-3 items-start">
            <span className="text-xl flex-shrink-0">⏰</span>
            <div>
              <p className="text-sm font-semibold text-[#92400E] mb-0.5">El enlace ha caducado</p>
              <p className="text-sm text-[#B45309]">
                Los enlaces mágicos son válidos durante 1 hora. Solicita uno nuevo introduciendo tu email.
              </p>
            </div>
          </div>
        )}

        {sent ? (
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-8 text-center shadow-sm">
            <div className="text-4xl mb-4">📬</div>
            <h2 className="text-xl font-semibold text-[#0F172A] mb-2">Revisa tu email</h2>
            <p className="text-[#64748B] mb-4">
              Te hemos enviado un enlace mágico a{' '}
              <strong className="text-[#0F172A]">{email}</strong>.
            </p>
            <p className="text-sm text-[#94A3B8]">
              El enlace caduca en <strong>1 hora</strong>. Revisa también la carpeta de spam.
            </p>
          </div>
        ) : (
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-8 shadow-sm">
            <h2 className="text-xl font-semibold text-[#0F172A] mb-6">Accede a tu cuenta</h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm text-[#64748B] mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-3 text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#16A34A] transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#16A34A] hover:bg-[#15803D] text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
              >
                {loading ? 'Enviando...' : 'Enviar enlace de acceso →'}
              </button>
            </form>
            <p className="text-center text-[#64748B] text-sm mt-6">
              Sin contraseñas. Solo un enlace seguro a tu email.
            </p>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#E2E8F0]" />
              </div>
              <div className="relative flex justify-center text-xs text-[#94A3B8] bg-white px-2">o</div>
            </div>
            <button
              type="button"
              onClick={() => router.push('/onboarding')}
              className="w-full border border-[#E2E8F0] hover:border-[#16A34A] text-[#64748B] hover:text-[#0F172A] font-medium py-3 rounded-xl transition-colors text-sm"
            >
              Continuar sin registrarme →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8FAFC]" />}>
      <AuthForm />
    </Suspense>
  )
}
