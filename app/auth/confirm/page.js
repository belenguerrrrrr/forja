'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ConfirmPage() {
  const [status, setStatus] = useState('Verificando tu acceso...')
  const router   = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const handleAuth = async () => {
      const params     = new URLSearchParams(window.location.search)
      const hashParams = new URLSearchParams(window.location.hash.replace('#', ''))

      const token_hash    = params.get('token_hash')    || hashParams.get('token_hash')
      const access_token  = hashParams.get('access_token')
      const refresh_token = hashParams.get('refresh_token')
      const type          = params.get('type') || hashParams.get('type') || 'magiclink'

      if (token_hash) {
        setStatus('Verificando enlace...')
        const { error } = await supabase.auth.verifyOtp({ token_hash, type })
        if (!error) {
          setStatus('¡Acceso verificado! Redirigiendo...')
          router.push('/dashboard')
          return
        }
        setStatus('Enlace inválido o caducado. Redirigiendo...')
        setTimeout(() => router.push('/auth?error=expired'), 2000)
        return
      }

      if (access_token) {
        setStatus('Estableciendo sesión...')
        const { error } = await supabase.auth.setSession({ access_token, refresh_token })
        if (!error) {
          setStatus('¡Sesión establecida! Redirigiendo...')
          router.push('/dashboard')
          return
        }
        setStatus('Error al establecer sesión. Redirigiendo...')
        setTimeout(() => router.push('/auth?error=expired'), 2000)
        return
      }

      setStatus('No se encontró token. Redirigiendo al login...')
      setTimeout(() => router.push('/auth'), 2000)
    }

    handleAuth()
  }, [])

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-t-[#16A34A] border-[#E2E8F0] rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[#64748B] text-sm">{status}</p>
      </div>
    </div>
  )
}
