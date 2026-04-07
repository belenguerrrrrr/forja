'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const router  = useRouter()
  const supabase = createClient()

  const handleReset = async (e) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
    } else {
      router.push('/dashboard')
    }
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
          <p className="text-[#64748B] mt-2">Establece tu nueva contraseña</p>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-[#0F172A] mb-6">Nueva contraseña</h2>

          {error && (
            <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-xl px-4 py-3 mb-5 text-sm text-[#DC2626]">
              {error}
            </div>
          )}

          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="block text-sm text-[#64748B] mb-2">Nueva contraseña</label>
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
              {loading ? 'Guardando...' : 'Establecer contraseña →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
