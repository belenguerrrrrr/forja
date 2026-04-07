'use client'

// IMPORTANTE: En Supabase → Authentication → Email →
// desactiva "Confirm email" para que el registro funcione sin verificación
// y el usuario entre directamente tras crear la cuenta.

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function AuthForm() {
  const [tab, setTab]           = useState('login')   // 'login' | 'register'
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [registered, setRegistered] = useState(false)

  const router       = useRouter()
  const searchParams = useSearchParams()
  const supabase     = createClient()

  const next = searchParams.get('next') || '/dashboard'

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(translateError(error.message))
    } else {
      router.push(next)
    }
    setLoading(false)
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) {
      setError(translateError(error.message))
    } else {
      setRegistered(true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-10">
          <h1
            className="text-6xl text-[#16A34A] tracking-wider"
            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
          >
            FORJA
          </h1>
          <p className="text-[#64748B] mt-2">Forja tu mejor versión</p>
        </div>

        {/* Registro exitoso */}
        {registered ? (
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-8 text-center shadow-sm">
            <div className="text-4xl mb-4">✉️</div>
            <h2 className="text-xl font-semibold text-[#0F172A] mb-2">Cuenta creada</h2>
            <p className="text-[#64748B] mb-6">
              Revisa tu email <strong className="text-[#0F172A]">{email}</strong> para confirmar tu cuenta y luego inicia sesión.
            </p>
            <button
              onClick={() => { setRegistered(false); setTab('login'); setPassword(''); setConfirm('') }}
              className="w-full bg-[#16A34A] hover:bg-[#15803D] text-white font-semibold py-3 rounded-xl transition-colors"
            >
              Ir a iniciar sesión →
            </button>
          </div>
        ) : (
          <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm overflow-hidden">

            {/* Tabs */}
            <div className="flex border-b border-[#E2E8F0]">
              {[['login', 'Iniciar sesión'], ['register', 'Crear cuenta']].map(([t, label]) => (
                <button
                  key={t}
                  onClick={() => { setTab(t); setError('') }}
                  className={`flex-1 py-4 text-sm font-semibold transition-colors ${
                    tab === t
                      ? 'text-[#16A34A] border-b-2 border-[#16A34A] bg-white'
                      : 'text-[#64748B] hover:text-[#0F172A] bg-[#F8FAFC]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="p-8">
              {/* Error */}
              {error && (
                <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-xl px-4 py-3 mb-5 text-sm text-[#DC2626]">
                  {error}
                </div>
              )}

              {tab === 'login' ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-sm text-[#64748B] mb-2">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="tu@email.com"
                      required
                      className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-3 text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#16A34A] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[#64748B] mb-2">Contraseña</label>
                    <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-3 text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#16A34A] transition-colors"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#16A34A] hover:bg-[#15803D] text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Entrando...' : 'Iniciar sesión →'}
                  </button>
                  <p className="text-center text-xs text-[#94A3B8] pt-1">
                    ¿No tienes cuenta?{' '}
                    <button type="button" onClick={() => { setTab('register'); setError('') }} className="text-[#16A34A] font-semibold hover:underline">
                      Créala gratis
                    </button>
                  </p>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="block text-sm text-[#64748B] mb-2">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="tu@email.com"
                      required
                      className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-3 text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#16A34A] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[#64748B] mb-2">Contraseña</label>
                    <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      required
                      className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-3 text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#16A34A] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[#64748B] mb-2">Confirmar contraseña</label>
                    <input
                      type="password"
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-3 text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#16A34A] transition-colors"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#16A34A] hover:bg-[#15803D] text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Creando cuenta...' : 'Crear cuenta →'}
                  </button>
                  <p className="text-center text-xs text-[#94A3B8] pt-1">
                    ¿Ya tienes cuenta?{' '}
                    <button type="button" onClick={() => { setTab('login'); setError('') }} className="text-[#16A34A] font-semibold hover:underline">
                      Inicia sesión
                    </button>
                  </p>
                </form>
              )}

              {/* Separador */}
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
          </div>
        )}
      </div>
    </div>
  )
}

// Traduce mensajes de error de Supabase al español
function translateError(msg) {
  if (!msg) return 'Ha ocurrido un error. Inténtalo de nuevo.'
  if (msg.includes('Invalid login credentials'))  return 'Email o contraseña incorrectos.'
  if (msg.includes('Email not confirmed'))         return 'Confirma tu email antes de iniciar sesión.'
  if (msg.includes('User already registered'))     return 'Ya existe una cuenta con ese email. Inicia sesión.'
  if (msg.includes('Password should be'))          return 'La contraseña debe tener al menos 6 caracteres.'
  if (msg.includes('rate limit'))                  return 'Demasiados intentos. Espera unos minutos.'
  return msg
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8FAFC]" />}>
      <AuthForm />
    </Suspense>
  )
}
