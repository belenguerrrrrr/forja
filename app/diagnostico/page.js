'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const DAYS_ES = {
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sábado',
  sunday: 'Domingo',
}

const DAYS_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

function MacroBar({ label, grams, total, color }) {
  const pct = total > 0 ? Math.round((grams / total) * 100) : 0
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-[#64748B]">{label}</span>
        <span className="font-semibold text-[#0F172A]">{grams}g <span className="text-[#64748B] font-normal">({pct}%)</span></span>
      </div>
      <div className="h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

function DayCard({ day, session }) {
  const isRest = session.type === 'rest'
  return (
    <div className={`rounded-xl border p-4 ${isRest ? 'bg-[#F8FAFC] border-[#E2E8F0]' : 'bg-white border-[#E2E8F0]'}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="font-semibold text-[#0F172A]">{DAYS_ES[day]}</span>
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
          isRest
            ? 'bg-[#F1F5F9] text-[#64748B]'
            : 'bg-[#16A34A]/10 text-[#16A34A]'
        }`}>
          {isRest ? 'Descanso' : session.name}
        </span>
      </div>

      {!isRest && session.exercises?.length > 0 && (
        <div className="space-y-2">
          {session.exercises.map((ex, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <span className="text-[#16A34A] mt-0.5 text-xs">▸</span>
              <div>
                <span className="font-medium text-[#0F172A]">{ex.name}</span>
                <span className="text-[#64748B] ml-1">{ex.sets}×{ex.reps}</span>
                {ex.notes && <div className="text-[#94A3B8] text-xs mt-0.5">{ex.notes}</div>}
              </div>
            </div>
          ))}
          {session.cardio && (
            <div className="flex items-center gap-2 text-sm pt-1 border-t border-[#F1F5F9]">
              <span className="text-[#16A34A] text-xs">♦</span>
              <span className="text-[#64748B]">{session.cardio}</span>
            </div>
          )}
        </div>
      )}

      {!isRest && session.duration_minutes && (
        <div className="mt-2 text-xs text-[#94A3B8]">{session.duration_minutes} min</div>
      )}
    </div>
  )
}

export default function DiagnosticoPage() {
  const router = useRouter()
  const [plan, setPlan] = useState(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const raw = localStorage.getItem('forja_plan_preview')
    if (!raw) {
      router.replace('/onboarding')
      return
    }
    try {
      setPlan(JSON.parse(raw))
    } catch {
      router.replace('/onboarding')
    }
  }, [router])

  if (!mounted || !plan) return null

  const totalMacroGrams = (plan.protein_grams || 0) + (plan.carbs_grams || 0) + (plan.fat_grams || 0)
  const scoreColor = plan.health_score >= 75 ? '#16A34A' : plan.health_score >= 50 ? '#D97706' : '#DC2626'

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-[#E2E8F0] bg-white">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <span className="font-display text-2xl text-[#16A34A] tracking-widest" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>FORJA</span>
          <span className="text-sm text-[#64748B]">Tu diagnóstico personalizado</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Hero */}
        <div className="text-center pb-2">
          <h1 className="text-3xl font-bold text-[#0F172A] mb-2">Tu plan está listo</h1>
          <p className="text-[#64748B]">Basado en tus datos, aquí está tu diagnóstico completo</p>
        </div>

        {/* Health Score + Calorías */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 text-center">
            <div className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-3">Puntuación de salud</div>
            <div className="text-6xl font-bold mb-1" style={{ color: scoreColor, fontFamily: "'Bebas Neue', sans-serif" }}>
              {plan.health_score}
            </div>
            <div className="text-[#94A3B8] text-sm">sobre 100</div>
            <div className="mt-3 h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{ width: `${plan.health_score}%`, backgroundColor: scoreColor }}
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 text-center">
            <div className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-3">Calorías diarias</div>
            <div className="text-6xl font-bold text-[#16A34A] mb-1" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
              {plan.daily_calories}
            </div>
            <div className="text-[#94A3B8] text-sm">kcal / día</div>
          </div>
        </div>

        {/* Macros */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6">
          <h2 className="font-semibold text-[#0F172A] mb-4">Distribución de macros</h2>
          <div className="space-y-4">
            <MacroBar label="Proteína" grams={plan.protein_grams} total={totalMacroGrams} color="#16A34A" />
            <MacroBar label="Carbohidratos" grams={plan.carbs_grams} total={totalMacroGrams} color="#2563EB" />
            <MacroBar label="Grasas" grams={plan.fat_grams} total={totalMacroGrams} color="#D97706" />
          </div>
        </div>

        {/* Resumen */}
        {plan.summary && (
          <div className="bg-[#16A34A]/5 border border-[#16A34A]/20 rounded-2xl p-6">
            <h2 className="font-semibold text-[#16A34A] mb-3">Análisis de tu caso</h2>
            <p className="text-[#374151] leading-relaxed text-sm">{plan.summary}</p>
          </div>
        )}

        {/* Plan de entrenamiento semanal */}
        {plan.training_plan && (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6">
            <h2 className="font-semibold text-[#0F172A] mb-4">Plan de entrenamiento semanal</h2>
            <div className="space-y-3">
              {DAYS_ORDER.map((day) => {
                const session = plan.training_plan[day]
                if (!session) return null
                return <DayCard key={day} day={day} session={session} />
              })}
            </div>
          </div>
        )}

        {/* Key tips */}
        {plan.key_tips?.length > 0 && (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6">
            <h2 className="font-semibold text-[#0F172A] mb-4">Claves para tu éxito</h2>
            <ul className="space-y-3">
              {plan.key_tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span className="w-5 h-5 rounded-full bg-[#16A34A]/10 text-[#16A34A] flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-[#374151]">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* CTA */}
        <div className="bg-[#0F172A] rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Empieza a progresar hoy</h2>
          <p className="text-[#94A3B8] mb-6 text-sm leading-relaxed">
            Crea tu cuenta gratis para guardar este plan, registrar tus entrenamientos y hacer seguimiento de tu progreso día a día.
          </p>
          <button
            onClick={() => router.push('/auth')}
            className="w-full bg-[#16A34A] hover:bg-[#15803D] text-white font-semibold py-4 rounded-xl transition-colors text-base"
          >
            Crear cuenta y guardar mi plan
          </button>
          <p className="text-[#475569] text-xs mt-4">Sin tarjeta de crédito. Siempre gratis para empezar.</p>
        </div>

        <div className="pb-6" />
      </div>
    </div>
  )
}
