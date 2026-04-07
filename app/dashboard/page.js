'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useUser } from '@/hooks/useUser'
import { usePlan } from '@/hooks/usePlan'
import BottomNav from '@/components/shared/BottomNav'

function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, profile, loading: userLoading } = useUser()
  const { plan: dbPlan, userData, loading: planLoading } = usePlan(user?.id)
  const [guestPlan, setGuestPlan] = useState(null)
  const showUpgrade = searchParams.get('upgrade') === 'true'

  useEffect(() => {
    if (!user) {
      const stored = localStorage.getItem('forja_guest_plan')
      if (stored) setGuestPlan(JSON.parse(stored))
      return
    }
    if (userLoading || planLoading) return

    // Si es Pro, ir al dashboard Pro
    if (['pro_monthly', 'pro_annual', 'lifetime'].includes(profile?.plan)) {
      router.push('/pro')
      return
    }

    // Si no ha completado onboarding, ir a onboarding
    if (!userData?.onboarding_completed) {
      router.push('/onboarding')
    }
  }, [user, profile, userData, userLoading, planLoading])

  const plan = user ? dbPlan : guestPlan

  if (user && (userLoading || planLoading)) {
    return (
      <div className="min-h-screen bg-forja-bg flex items-center justify-center">
        <div className="text-forja-primary font-display text-2xl animate-pulse">FORJA</div>
      </div>
    )
  }

  // Dashboard free — muestra diagnóstico y plan básico, CTA upgrade
  return (
    <div className="min-h-screen bg-forja-bg text-forja-text p-4">
      <div className="max-w-2xl mx-auto pt-12">
        <h1 className="font-display text-5xl text-forja-primary mb-2">TU DIAGNÓSTICO</h1>

        {plan && (
          <div className="space-y-6 mt-8">
            {/* Score */}
            <div className="bg-forja-surface border border-forja-border rounded-2xl p-6 text-center">
              <p className="text-forja-muted text-sm mb-2">Puntuación de salud actual</p>
              <div className="text-7xl font-display text-forja-primary">{plan.health_score}</div>
              <div className="text-forja-muted">/100</div>
            </div>

            {/* Calorías y macros */}
            <div className="bg-forja-surface border border-forja-border rounded-2xl p-6">
              <h3 className="font-semibold mb-4">Tu objetivo calórico diario</h3>
              <div className="text-4xl font-display text-forja-text mb-4">{plan.daily_calories} <span className="text-forja-muted text-xl">kcal</span></div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-forja-bg rounded-xl p-3 text-center">
                  <div className="text-forja-primary font-semibold">{plan.protein_grams}g</div>
                  <div className="text-forja-muted text-xs mt-1">Proteína</div>
                </div>
                <div className="bg-forja-bg rounded-xl p-3 text-center">
                  <div className="text-forja-secondary font-semibold">{plan.carbs_grams}g</div>
                  <div className="text-forja-muted text-xs mt-1">Carbos</div>
                </div>
                <div className="bg-forja-bg rounded-xl p-3 text-center">
                  <div className="text-forja-green font-semibold">{plan.fat_grams}g</div>
                  <div className="text-forja-muted text-xs mt-1">Grasas</div>
                </div>
              </div>
            </div>

            {/* Resumen */}
            <div className="bg-forja-surface border border-forja-border rounded-2xl p-6">
              <p className="text-forja-muted leading-relaxed">{plan.summary}</p>
            </div>

            {/* CTA Upgrade */}
            <div className="bg-gradient-to-br from-forja-primary/20 to-forja-secondary/10 border border-forja-primary/30 rounded-2xl p-6 text-center">
              <h3 className="font-display text-3xl text-forja-primary mb-2">HAZTE PRO</h3>
              <p className="text-forja-muted mb-6">Tracking diario, AI Coach, ajuste automático del plan y más.</p>
              <button
                onClick={() => router.push('/#precios')}
                className="bg-forja-primary hover:bg-forja-secondary text-white font-semibold px-8 py-3 rounded-xl transition-colors"
              >
                Ver planes desde 14,99€/mes →
              </button>
            </div>
          </div>
        )}
        <div className="pb-24" />
      </div>
      <BottomNav />
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardContent />
    </Suspense>
  )
}
