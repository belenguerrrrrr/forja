'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogoNav } from '@/components/shared/Logo'

// ─── Configuración de preguntas ───────────────────────────────────────────────

const QUESTIONS = [
  {
    id: 'goal',
    title: '¿Cuál es tu objetivo principal?',
    subtitle: 'Diseñaremos todo el plan en torno a esto.',
    type: 'cards',
    options: [
      { value: 'lose_weight', label: 'Perder grasa', emoji: '🔥', desc: 'Reducir % grasa corporal y bajar de peso' },
      { value: 'gain_muscle', label: 'Ganar músculo', emoji: '💪', desc: 'Aumentar masa muscular y fuerza' },
      { value: 'run_marathon', label: 'Correr una maratón', emoji: '🏃', desc: 'Preparación para carrera de larga distancia' },
      { value: 'get_fit', label: 'Ponerme en forma', emoji: '⚡', desc: 'Mejorar condición física general' },
      { value: 'custom', label: 'Otro objetivo', emoji: '🎯', desc: 'Cuéntanos tú mismo' },
    ],
  },
  {
    id: 'goal_description',
    title: 'Cuéntanos más sobre tu objetivo',
    subtitle: 'Sé específico — cuanto más detalle, mejor el plan.',
    type: 'textarea',
    placeholder: 'Ej: Quiero perder 10kg antes de mi boda en agosto, tengo que correr el maratón de Valencia en noviembre...',
    showIf: (answers) => answers.goal === 'custom',
    optional: true,
  },
  {
    id: 'current_weight',
    title: '¿Cuánto pesas ahora?',
    subtitle: 'Necesitamos esto para calcular tus calorías y macros exactos.',
    type: 'number',
    unit: 'kg',
    placeholder: '75',
    min: 30,
    max: 250,
  },
  {
    id: 'target_weight',
    title: '¿Cuál es tu peso objetivo?',
    subtitle: 'Aproximado está bien. Podemos ajustarlo después.',
    type: 'number',
    unit: 'kg',
    placeholder: '68',
    min: 30,
    max: 250,
    showIf: (answers) => ['lose_weight', 'gain_muscle'].includes(answers.goal),
    optional: true,
  },
  {
    id: 'height',
    title: '¿Cuánto mides?',
    subtitle: 'Junto con tu peso, calculamos tu IMC y metabolismo base.',
    type: 'number',
    unit: 'cm',
    placeholder: '175',
    min: 130,
    max: 220,
  },
  {
    id: 'age_gender',
    title: '¿Cuántos años tienes y cuál es tu sexo?',
    subtitle: 'Afecta al cálculo hormonal y calórico.',
    type: 'age_gender',
  },
  {
    id: 'activity_level',
    title: '¿Cómo es tu nivel de actividad actual?',
    subtitle: 'Fuera del ejercicio que planeas hacer con FORJA.',
    type: 'cards',
    options: [
      { value: 'sedentary', label: 'Sedentario', emoji: '🛋️', desc: 'Trabajo de escritorio, me muevo poco' },
      { value: 'light', label: 'Ligero', emoji: '🚶', desc: 'Camino algo, 1-2 días de actividad' },
      { value: 'moderate', label: 'Moderado', emoji: '🚴', desc: '3-4 días de ejercicio a la semana' },
      { value: 'active', label: 'Activo', emoji: '🏋️', desc: '5+ días de ejercicio intenso' },
      { value: 'very_active', label: 'Muy activo', emoji: '🔥', desc: 'Atleta o trabajo físico exigente' },
    ],
  },
  {
    id: 'training_days',
    title: '¿Cuántos días a la semana puedes entrenar?',
    subtitle: 'Sé realista con tu disponibilidad real, no la ideal.',
    type: 'slider',
    min: 1,
    max: 7,
    unit: 'días/semana',
  },
  {
    id: 'training_duration',
    title: '¿Cuánto tiempo tienes por sesión?',
    subtitle: 'Diseñaremos cada entrenamiento para que quepa en tu agenda.',
    type: 'cards',
    options: [
      { value: 30, label: '30 min', emoji: '⚡', desc: 'Sesiones cortas e intensas' },
      { value: 45, label: '45 min', emoji: '🎯', desc: 'El punto dulce para la mayoría' },
      { value: 60, label: '60 min', emoji: '💪', desc: 'Tiempo suficiente para todo' },
      { value: 90, label: '90 min', emoji: '🏆', desc: 'Sesiones largas y completas' },
    ],
  },
  {
    id: 'gym_access',
    title: '¿Dónde vas a entrenar?',
    subtitle: 'El plan será completamente diferente según tu equipamiento.',
    type: 'cards',
    options: [
      { value: true, label: 'Tengo gimnasio', emoji: '🏋️', desc: 'Acceso a máquinas, pesas y todo el equipamiento' },
      { value: false, label: 'En casa / exterior', emoji: '🏠', desc: 'Sin equipamiento o con material básico' },
    ],
  },
  {
    id: 'injuries',
    title: '¿Tienes alguna lesión o limitación física?',
    subtitle: 'Evitaremos ejercicios que puedan empeorarlas.',
    type: 'multiselect',
    optional: true,
    options: [
      { value: 'lower_back', label: 'Lumbar / espalda baja', emoji: '🔴' },
      { value: 'knee', label: 'Rodilla', emoji: '🔴' },
      { value: 'shoulder', label: 'Hombro', emoji: '🔴' },
      { value: 'hip', label: 'Cadera', emoji: '🔴' },
      { value: 'ankle', label: 'Tobillo', emoji: '🔴' },
      { value: 'wrist', label: 'Muñeca', emoji: '🔴' },
      { value: 'none', label: 'Sin lesiones', emoji: '✅' },
    ],
  },
  {
    id: 'dietary_restrictions',
    title: '¿Tienes alguna restricción alimentaria?',
    subtitle: 'Adaptaremos las recomendaciones nutricionales.',
    type: 'multiselect',
    optional: true,
    options: [
      { value: 'vegetarian', label: 'Vegetariano', emoji: '🥗' },
      { value: 'vegan', label: 'Vegano', emoji: '🌱' },
      { value: 'gluten_free', label: 'Sin gluten', emoji: '🌾' },
      { value: 'lactose_free', label: 'Sin lactosa', emoji: '🥛' },
      { value: 'nut_allergy', label: 'Alergia a frutos secos', emoji: '🥜' },
      { value: 'none', label: 'Sin restricciones', emoji: '✅' },
    ],
  },
]

// ─── Subcomponentes ───────────────────────────────────────────────────────────

function ProgressBar({ current, total }) {
  const pct = Math.round((current / total) * 100)
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-[#64748B] mb-2">
        <span>Paso {current} de {total}</span>
        <span>{pct}% completado</span>
      </div>
      <div className="h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#16A34A] to-[#15803D] rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function CardsInput({ options, value, onChange, multi = false }) {
  const handleSelect = (opt) => {
    if (multi) {
      const cur = Array.isArray(value) ? value : []
      if (opt.value === 'none') {
        onChange(['none'])
      } else {
        const without_none = cur.filter(v => v !== 'none')
        if (without_none.includes(opt.value)) {
          onChange(without_none.filter(v => v !== opt.value))
        } else {
          onChange([...without_none, opt.value])
        }
      }
    } else {
      onChange(opt.value)
    }
  }

  const isSelected = (opt) => {
    if (multi) return Array.isArray(value) && value.includes(opt.value)
    return value === opt.value
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {options.map((opt) => (
        <button
          key={String(opt.value)}
          onClick={() => handleSelect(opt)}
          className={`text-left p-4 rounded-xl border transition-all duration-200 ${
            isSelected(opt)
              ? 'bg-[#16A34A]/10 border-[#16A34A] shadow-[0_0_20px_rgba(255,77,28,0.15)]'
              : 'bg-[#FFFFFF] border-[#E2E8F0] hover:border-[#64748B]'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">{opt.emoji}</span>
            <div>
              <div className={`font-semibold text-sm ${isSelected(opt) ? 'text-[#16A34A]' : 'text-[#0F172A]'}`}>
                {opt.label}
              </div>
              {opt.desc && <div className="text-[#64748B] text-xs mt-0.5">{opt.desc}</div>}
            </div>
            {isSelected(opt) && (
              <span className="ml-auto text-[#16A34A] text-sm">✓</span>
            )}
          </div>
        </button>
      ))}
    </div>
  )
}

function SliderInput({ value, onChange, min, max, unit }) {
  const val = value || min
  return (
    <div className="space-y-6">
      <div className="text-center">
        <span className="font-display text-8xl text-[#16A34A]" style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: '5rem' }}>
          {val}
        </span>
        <span className="text-[#64748B] text-lg ml-2">{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={val}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[#16A34A] cursor-pointer"
        style={{ accentColor: '#16A34A' }}
      />
      <div className="flex justify-between text-xs text-[#64748B]">
        <span>{min} {unit}</span>
        <span>{max} {unit}</span>
      </div>
    </div>
  )
}

function AgeGenderInput({ value = {}, onChange }) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm text-[#64748B] mb-2">Edad</label>
        <input
          type="number"
          value={value.age || ''}
          onChange={(e) => onChange({ ...value, age: Number(e.target.value) })}
          placeholder="28"
          min={14}
          max={90}
          className="w-full bg-[#FFFFFF] border border-[#E2E8F0] focus:border-[#16A34A] rounded-xl px-4 py-3 text-[#0F172A] text-lg focus:outline-none transition-colors"
        />
      </div>
      <div>
        <label className="block text-sm text-[#64748B] mb-3">Sexo biológico</label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { val: 'male', label: 'Hombre', emoji: '♂️' },
            { val: 'female', label: 'Mujer', emoji: '♀️' },
            { val: 'other', label: 'Otro', emoji: '⚧️' },
          ].map((g) => (
            <button
              key={g.val}
              onClick={() => onChange({ ...value, gender: g.val })}
              className={`p-3 rounded-xl border text-center transition-all ${
                value.gender === g.val
                  ? 'bg-[#16A34A]/10 border-[#16A34A] text-[#16A34A]'
                  : 'bg-[#FFFFFF] border-[#E2E8F0] text-[#64748B] hover:border-[#64748B]'
              }`}
            >
              <div className="text-xl mb-1">{g.emoji}</div>
              <div className="text-xs font-medium">{g.label}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter()
  const [answers, setAnswers] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [animating, setAnimating] = useState(false)

  // Filtrar preguntas según respuestas anteriores
  const visibleQuestions = QUESTIONS.filter(q => !q.showIf || q.showIf(answers))
  const [stepIndex, setStepIndex] = useState(0)
  const currentQ = visibleQuestions[stepIndex]
  const isLast = stepIndex === visibleQuestions.length - 1

  const getCurrentValue = () => {
    if (currentQ.id === 'age_gender') {
      return { age: answers.age, gender: answers.gender }
    }
    if (currentQ.id === 'training_days') return answers.training_days_per_week
    if (currentQ.id === 'training_duration') return answers.training_duration_minutes
    return answers[currentQ.id]
  }

  const setCurrentValue = (val) => {
    if (currentQ.id === 'age_gender') {
      setAnswers(prev => ({ ...prev, age: val.age, gender: val.gender }))
    } else if (currentQ.id === 'training_days') {
      setAnswers(prev => ({ ...prev, training_days_per_week: val }))
    } else if (currentQ.id === 'training_duration') {
      setAnswers(prev => ({ ...prev, training_duration_minutes: val }))
    } else {
      setAnswers(prev => ({ ...prev, [currentQ.id]: val }))
    }
  }

  const canAdvance = () => {
    if (currentQ.optional) return true
    const val = getCurrentValue()
    if (currentQ.id === 'age_gender') return val?.age && val?.gender
    if (currentQ.type === 'multiselect') return Array.isArray(val) && val.length > 0
    if (currentQ.type === 'slider') return val !== undefined && val !== null
    return val !== undefined && val !== '' && val !== null
  }

  const goNext = () => {
    if (!canAdvance()) return
    setAnimating(true)
    setTimeout(() => {
      if (isLast) {
        handleSubmit()
      } else {
        setStepIndex(i => i + 1)
        setAnimating(false)
      }
    }, 200)
  }

  const goBack = () => {
    if (stepIndex === 0) return
    setAnimating(true)
    setTimeout(() => {
      setStepIndex(i => i - 1)
      setAnimating(false)
    }, 200)
  }

  // Auto-avanzar en cards single-select
  useEffect(() => {
    if (currentQ?.type === 'cards' && !currentQ?.multi && getCurrentValue() !== undefined) {
      const timer = setTimeout(() => {
        if (!isLast) goNext()
      }, 400)
      return () => clearTimeout(timer)
    }
  }, [answers[currentQ?.id], answers.training_duration_minutes])

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (session) {
        // Usuario logado — guardar en Supabase y generar plan real
        const { error: dbError } = await supabase
          .from('user_data')
          .upsert({
            user_id: session.user.id,
            goal: answers.goal,
            goal_description: answers.goal_description || null,
            target_weight: answers.target_weight ? Number(answers.target_weight) : null,
            current_weight: Number(answers.current_weight),
            height: Number(answers.height),
            age: Number(answers.age),
            gender: answers.gender,
            activity_level: answers.activity_level,
            training_days_per_week: answers.training_days_per_week || 3,
            training_duration_minutes: answers.training_duration_minutes || 60,
            gym_access: answers.gym_access === true || answers.gym_access === 'true',
            injuries: answers.injuries?.filter(i => i !== 'none') || [],
            dietary_restrictions: answers.dietary_restrictions?.filter(d => d !== 'none') || [],
            onboarding_completed: true,
          })

        if (dbError) throw dbError

        const res = await fetch('/api/plan', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
        })

        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Error generando el plan')
        }

        router.push('/pro')
      } else {
        // Usuario no logado — guardar en localStorage y llamar preview
        localStorage.setItem('forja_onboarding_data', JSON.stringify(answers))

        const res = await fetch('/api/plan/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(answers),
        })

        if (!res.ok) throw new Error('Error generando el plan')
        const data = await res.json()
        localStorage.setItem('forja_plan_data', JSON.stringify(data.plan))
        router.push('/diagnostico')
      }
    } catch (err) {
      console.error('handleSubmit error:', err)
      setError(err.message || 'Ha ocurrido un error. Inténtalo de nuevo.')
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center gap-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 border-2 border-[#16A34A]/20 rounded-full" />
          <div className="absolute inset-0 border-2 border-t-[#16A34A] rounded-full animate-spin" />
        </div>
        <div>
          <div className="font-display text-2xl text-[#16A34A] text-center tracking-widest mb-2" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>FORJANDO TU PLAN</div>
          <div className="text-[#64748B] text-sm text-center">La IA está analizando tus datos...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <LogoNav />
            {stepIndex > 0 && (
              <button onClick={goBack} className="text-[#64748B] text-sm hover:text-[#0F172A] transition-colors">
                ← Atrás
              </button>
            )}
          </div>
          <ProgressBar current={stepIndex + 1} total={visibleQuestions.length} />
        </div>
      </div>

      {/* Pregunta */}
      <div className="flex-1 flex items-center px-6 py-8">
        <div className="max-w-xl mx-auto w-full">
          <div key={currentQ.id} className={`slide-in ${animating ? 'opacity-0' : ''}`}>
            {/* Título */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-[#0F172A] mb-2 leading-tight">
                {currentQ.title}
              </h2>
              {currentQ.subtitle && (
                <p className="text-[#64748B] text-sm leading-relaxed">{currentQ.subtitle}</p>
              )}
            </div>

            {/* Input según tipo */}
            {currentQ.type === 'cards' && (
              <CardsInput
                options={currentQ.options}
                value={getCurrentValue()}
                onChange={setCurrentValue}
              />
            )}

            {currentQ.type === 'multiselect' && (
              <CardsInput
                options={currentQ.options}
                value={getCurrentValue() || []}
                onChange={setCurrentValue}
                multi
              />
            )}

            {currentQ.type === 'number' && (
              <div className="relative">
                <input
                  type="number"
                  value={getCurrentValue() || ''}
                  onChange={(e) => setCurrentValue(e.target.value)}
                  placeholder={currentQ.placeholder}
                  min={currentQ.min}
                  max={currentQ.max}
                  className="w-full bg-[#FFFFFF] border border-[#E2E8F0] focus:border-[#16A34A] rounded-xl px-4 py-4 text-[#0F172A] text-2xl font-semibold focus:outline-none transition-colors pr-16"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748B] text-sm">
                  {currentQ.unit}
                </span>
              </div>
            )}

            {currentQ.type === 'textarea' && (
              <textarea
                value={getCurrentValue() || ''}
                onChange={(e) => setCurrentValue(e.target.value)}
                placeholder={currentQ.placeholder}
                rows={4}
                className="w-full bg-[#FFFFFF] border border-[#E2E8F0] focus:border-[#16A34A] rounded-xl px-4 py-3 text-[#0F172A] focus:outline-none transition-colors resize-none"
              />
            )}

            {currentQ.type === 'slider' && (
              <SliderInput
                value={getCurrentValue()}
                onChange={setCurrentValue}
                min={currentQ.min}
                max={currentQ.max}
                unit={currentQ.unit}
              />
            )}

            {currentQ.type === 'age_gender' && (
              <AgeGenderInput value={getCurrentValue()} onChange={setCurrentValue} />
            )}

            {error && (
              <div className="mt-4 text-red-400 text-sm bg-red-400/10 rounded-xl px-4 py-3">{error}</div>
            )}

            {/* Botón de avance (para tipos que no auto-avanzan) */}
            {(['number', 'textarea', 'slider', 'age_gender', 'multiselect'].includes(currentQ.type)) && (
              <button
                onClick={goNext}
                disabled={!canAdvance()}
                className={`mt-8 w-full py-4 rounded-xl font-semibold transition-all ${
                  canAdvance()
                    ? 'bg-[#16A34A] hover:bg-[#15803D] text-white'
                    : 'bg-[#E2E8F0] text-[#64748B] cursor-not-allowed'
                }`}
              >
                {isLast ? 'Generar mi plan →' : 'Continuar →'}
              </button>
            )}

            {currentQ.optional && currentQ.type !== 'multiselect' && (
              <button
                onClick={goNext}
                className="mt-3 w-full py-3 text-sm text-[#64748B] hover:text-[#0F172A] transition-colors"
              >
                Omitir esta pregunta
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Footer hint */}
      <div className="px-6 pb-6">
        <div className="max-w-xl mx-auto text-center text-xs text-[#64748B]">
          🔒 Tus datos son privados y solo se usan para generar tu plan personalizado.
        </div>
      </div>
    </div>
  )
}
