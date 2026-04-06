'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AuthPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

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
    <div className="min-h-screen bg-forja-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="font-display text-6xl text-forja-primary tracking-wider">FORJA</h1>
          <p className="text-forja-muted mt-2">Forja tu mejor versión</p>
        </div>

        {sent ? (
          <div className="bg-forja-surface border border-forja-border rounded-2xl p-8 text-center">
            <div className="text-4xl mb-4">📬</div>
            <h2 className="text-xl font-semibold text-forja-text mb-2">Revisa tu email</h2>
            <p className="text-forja-muted">
              Te hemos enviado un enlace mágico a <strong className="text-forja-text">{email}</strong>.
              Haz clic en él para acceder.
            </p>
          </div>
        ) : (
          <div className="bg-forja-surface border border-forja-border rounded-2xl p-8">
            <h2 className="text-xl font-semibold text-forja-text mb-6">Accede a tu cuenta</h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm text-forja-muted mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                  className="w-full bg-forja-bg border border-forja-border rounded-xl px-4 py-3 text-forja-text placeholder-forja-muted focus:outline-none focus:border-forja-primary transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-forja-primary hover:bg-forja-secondary text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
              >
                {loading ? 'Enviando...' : 'Enviar enlace de acceso →'}
              </button>
            </form>
            <p className="text-center text-forja-muted text-sm mt-6">
              Sin contraseñas. Solo un enlace seguro a tu email.
            </p>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-forja-border" />
              </div>
              <div className="relative flex justify-center text-xs text-forja-muted bg-forja-surface px-2">o</div>
            </div>
            <button
              type="button"
              onClick={() => router.push('/onboarding')}
              className="w-full border border-forja-border hover:border-forja-primary text-forja-muted hover:text-forja-text font-medium py-3 rounded-xl transition-colors text-sm"
            >
              Continuar sin cuenta →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
