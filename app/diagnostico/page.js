'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import BottomNav from '@/components/shared/BottomNav'

const DAYS = [
  { key: 'monday',    short: 'L' },
  { key: 'tuesday',   short: 'M' },
  { key: 'wednesday', short: 'X' },
  { key: 'thursday',  short: 'J' },
  { key: 'friday',    short: 'V' },
  { key: 'saturday',  short: 'S' },
  { key: 'sunday',    short: 'D' },
]

// 0 = domingo, 1 = lunes … convertido al índice de DAYS
const todayIndex = () => {
  const jsDay = new Date().getDay() // 0 Sun … 6 Sat
  return jsDay === 0 ? 6 : jsDay - 1
}

const REST_MESSAGES = [
  'El descanso es donde crece el músculo. Aprovéchalo.',
  'Recuperación activa: camina, estira, descansa bien.',
  'Hoy tu cuerpo se repara y se vuelve más fuerte.',
  'El progreso no solo ocurre en el gym. Descansa con intención.',
]

function ScoreCircle({ score }) {
  const color = score >= 75 ? '#16A34A' : score >= 50 ? '#D97706' : '#DC2626'
  const r = 40
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  return (
    <div className="relative inline-flex items-center justify-center w-24 h-24">
      <svg className="absolute inset-0 -rotate-90" width="96" height="96">
        <circle cx="48" cy="48" r={r} fill="none" stroke="#E2E8F0" strokeWidth="7" />
        <circle
          cx="48" cy="48" r={r} fill="none"
          stroke={color} strokeWidth="7"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div className="relative text-center">
        <div className="font-bold text-2xl leading-none" style={{ color, fontFamily: "'Bebas Neue', sans-serif" }}>{score}</div>
        <div className="text-[10px] text-[#94A3B8] uppercase tracking-wide">salud</div>
      </div>
    </div>
  )
}

function MacroPill({ label, grams, pct, color }) {
  return (
    <div className="flex-1 rounded-xl px-3 py-2.5 text-center" style={{ backgroundColor: `${color}12` }}>
      <div className="text-base font-bold leading-none mb-0.5" style={{ color, fontFamily: "'Bebas Neue', sans-serif" }}>{grams}g</div>
      <div className="text-[10px] text-[#64748B] font-medium uppercase tracking-wide">{label}</div>
      <div className="text-[10px]" style={{ color }}>{pct}%</div>
    </div>
  )
}

function DayPill({ short, isToday, isRest, isSelected, onClick }) {
  let bg, text, ring
  if (isSelected) {
    bg = isRest ? '#94A3B8' : '#16A34A'
    text = '#FFFFFF'
    ring = ''
  } else if (isToday) {
    bg = '#FFFFFF'
    text = '#16A34A'
    ring = '0 0 0 2px #16A34A'
  } else if (isRest) {
    bg = '#F1F5F9'
    text = '#94A3B8'
    ring = ''
  } else {
    bg = '#F0FDF4'
    text = '#15803D'
    ring = ''
  }
  return (
    <button
      onClick={onClick}
      className="flex-1 h-10 rounded-xl text-sm font-bold transition-all duration-200 active:scale-95"
      style={{ backgroundColor: bg, color: text, boxShadow: ring }}
    >
      {short}
    </button>
  )
}

function SessionDetail({ session, dayKey }) {
  const isRest = session?.type === 'rest' || !session
  if (isRest) {
    const msg = REST_MESSAGES[DAYS.findIndex(d => d.key === dayKey) % REST_MESSAGES.length]
    return (
      <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-5 text-center mt-3">
        <div className="text-3xl mb-2">😴</div>
        <div className="font-semibold text-[#64748B] mb-1">Día de descanso</div>
        <p className="text-sm text-[#94A3B8]">{msg}</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 mt-3 shadow-sm">
      {/* Cabecera */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="font-bold text-[#0F172A] text-base leading-snug">{session.name}</h3>
          <span className="text-xs text-[#64748B] mt-0.5 inline-block">{session.type}</span>
        </div>
        {session.duration_minutes && (
          <span className="flex-shrink-0 text-xs font-semibold text-[#16A34A] bg-[#F0FDF4] px-2.5 py-1 rounded-full">
            {session.duration_minutes} min
          </span>
        )}
      </div>

      {/* Ejercicios */}
      {session.exercises?.length > 0 && (
        <div className="space-y-2 mb-3">
          <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 text-[10px] uppercase tracking-widest text-[#94A3B8] font-semibold px-1 mb-1">
            <span>Ejercicio</span>
            <span className="text-right">Series</span>
            <span className="text-right">Reps</span>
          </div>
          {session.exercises.map((ex, i) => (
            <div
              key={i}
              className="grid grid-cols-[1fr_auto_auto] gap-x-3 items-center bg-[#F8FAFC] rounded-xl px-3 py-2.5"
            >
              <div>
                <div className="text-sm font-medium text-[#0F172A] leading-snug">{ex.name}</div>
                {ex.notes && <div className="text-[11px] text-[#94A3B8] mt-0.5">{ex.notes}</div>}
              </div>
              <div className="text-sm font-bold text-[#16A34A] text-right tabular-nums">{ex.sets}</div>
              <div className="text-sm font-bold text-[#0F172A] text-right tabular-nums">{ex.reps}</div>
            </div>
          ))}
        </div>
      )}

      {/* Cardio */}
      {session.cardio && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#F1F5F9]">
          <span className="text-xs font-semibold text-white bg-[#2563EB] px-2.5 py-1 rounded-full flex-shrink-0">Cardio</span>
          <span className="text-sm text-[#374151]">{session.cardio}</span>
        </div>
      )}
    </div>
  )
}

export default function DiagnosticoPage() {
  const router = useRouter()
  const [plan, setPlan] = useState(null)
  const [selectedDay, setSelectedDay] = useState(todayIndex())
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const raw = localStorage.getItem('forja_plan_preview')
    if (!raw) { router.replace('/onboarding'); return }
    try { setPlan(JSON.parse(raw)) }
    catch { router.replace('/onboarding') }
  }, [router])

  if (!mounted || !plan) return null

  const totalG = (plan.protein_grams || 0) + (plan.carbs_grams || 0) + (plan.fat_grams || 0)
  const pct = (g) => totalG > 0 ? Math.round((g / totalG) * 100) : 0

  const today = todayIndex()
  const selectedDayKey = DAYS[selectedDay].key
  const selectedSession = plan.training_plan?.[selectedDayKey]
  const isRest = (key) => !plan.training_plan?.[key] || plan.training_plan[key]?.type === 'rest'

  // Truncar summary a ~3 líneas
  const summary = plan.summary
    ? plan.summary.split('. ').slice(0, 3).join('. ') + '.'
    : null

  return (
    <div className="min-h-screen bg-[#F8FAFC]" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-[#E2E8F0] px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <span className="text-xl text-[#16A34A] tracking-widest font-bold" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>FORJA</span>
          <span className="text-xs text-[#94A3B8] font-medium uppercase tracking-wider">Tu diagnóstico</span>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">

        {/* Hero: Score + Calorías */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5 flex items-center gap-5">
          <ScoreCircle score={plan.health_score} />
          <div className="flex-1 min-w-0">
            <div className="text-xs text-[#94A3B8] font-semibold uppercase tracking-wider mb-0.5">Calorías diarias</div>
            <div className="text-5xl font-bold text-[#0F172A] leading-none" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
              {plan.daily_calories}
              <span className="text-lg text-[#94A3B8] font-normal ml-1">kcal</span>
            </div>
            <div className="text-xs text-[#64748B] mt-2">
              Puntuación de forma física basada en tu perfil
            </div>
          </div>
        </div>

        {/* Macros pills */}
        <div className="flex gap-2">
          <MacroPill label="Proteína"     grams={plan.protein_grams} pct={pct(plan.protein_grams)} color="#16A34A" />
          <MacroPill label="Carbohidratos" grams={plan.carbs_grams}   pct={pct(plan.carbs_grams)}   color="#2563EB" />
          <MacroPill label="Grasas"        grams={plan.fat_grams}     pct={pct(plan.fat_grams)}     color="#D97706" />
        </div>

        {/* Plan semanal interactivo */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5">
          <h2 className="font-bold text-[#0F172A] mb-4">Plan semanal</h2>

          {/* Selector de días */}
          <div className="flex gap-1.5">
            {DAYS.map((d, i) => (
              <DayPill
                key={d.key}
                short={d.short}
                isToday={i === today}
                isRest={isRest(d.key)}
                isSelected={i === selectedDay}
                onClick={() => setSelectedDay(i)}
              />
            ))}
          </div>

          {/* Detalle del día seleccionado */}
          <SessionDetail session={selectedSession} dayKey={selectedDayKey} />
        </div>

        {/* Análisis */}
        {summary && (
          <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-2xl p-5">
            <h2 className="font-bold text-[#15803D] mb-2 text-sm uppercase tracking-wider">Análisis de tu caso</h2>
            <p className="text-sm text-[#166534] leading-relaxed">{summary}</p>
          </div>
        )}

        {/* Key tips */}
        {plan.key_tips?.length > 0 && (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5">
            <h2 className="font-bold text-[#0F172A] mb-4">Claves para tu éxito</h2>
            <div className="space-y-3">
              {plan.key_tips.slice(0, 3).map((tip, i) => {
                const icons = ['🎯', '⚡', '🔑']
                const [title, ...rest] = tip.split(':')
                const desc = rest.length ? rest.join(':').trim() : null
                return (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-xl flex-shrink-0 mt-0.5">{icons[i]}</span>
                    <div>
                      <div className="font-semibold text-sm text-[#0F172A]">{desc ? title : `Clave ${i + 1}`}</div>
                      <div className="text-sm text-[#64748B] leading-snug">{desc || title}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Mi Tracker */}
        <button
          onClick={() => router.push('/tracker')}
          className="w-full bg-white border-2 border-[#16A34A] text-[#16A34A] font-bold py-4 rounded-2xl transition-colors hover:bg-[#F0FDF4] text-sm flex items-center justify-center gap-2"
        >
          <span>📊</span> Mi Tracker diario
        </button>

        {/* CTA */}
        <div className="bg-[#0F172A] rounded-2xl p-6 text-center">
          <div className="text-2xl font-bold text-white mb-1" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.05em' }}>
            EMPIEZA A PROGRESAR HOY
          </div>
          <p className="text-[#94A3B8] text-sm mb-5 leading-relaxed">
            Crea tu cuenta gratis para guardar este plan, registrar entrenamientos y hacer seguimiento día a día.
          </p>
          <button
            onClick={() => router.push('/auth')}
            className="w-full bg-[#16A34A] hover:bg-[#15803D] active:bg-[#166534] text-white font-bold py-4 rounded-xl transition-colors text-sm tracking-wide"
          >
            Crear cuenta y guardar mi plan →
          </button>
          <p className="text-[#475569] text-xs mt-3">Sin tarjeta de crédito · Siempre gratis para empezar</p>
        </div>

        <div className="pb-24" />
      </div>
      <BottomNav />
    </div>
  )
}
