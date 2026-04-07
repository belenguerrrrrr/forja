'use client'

import { useState, useEffect, useRef, useMemo, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DAYS_ES, GOALS_ES, estimateCaloriesBurned } from '@/lib/utils'
import { useTracker } from '@/hooks/useTracker'
import { FOOD_DB } from '@/lib/foodDB'

const MEALS = [
  { id: 'breakfast', label: 'Desayuno', emoji: '🌅' },
  { id: 'morning_snack', label: 'Media mañana', emoji: '🍎' },
  { id: 'lunch', label: 'Comida', emoji: '🍽️' },
  { id: 'afternoon_snack', label: 'Merienda', emoji: '🥐' },
  { id: 'dinner', label: 'Cena', emoji: '🌙' },
]

const WORKOUT_TYPE_LABELS = {
  strength: 'Fuerza / Musculación',
  running: 'Carrera',
  cycling: 'Ciclismo',
  swimming: 'Natación',
  hiit: 'HIIT',
  yoga: 'Yoga / Stretching',
  walking: 'Caminar',
  other: 'Otro',
}

const SLEEP_EMOJIS = ['😴', '😑', '🙂', '😊', '🔥']

// ─── Componente MacroBar ──────────────────────────────────────────────────────
function MacroBar({ label, current, target, color }) {
  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-[#64748B]">{label}</span>
        <span className="text-[#0F172A]">{Math.round(current)}g <span className="text-[#64748B]">/ {target}g</span></span>
      </div>
      <div className="h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

// ─── Tab: Dashboard ───────────────────────────────────────────────────────────
function DashboardTab({ plan, userData, logs, setActiveTab }) {
  // Datos de peso desde weight_morning de daily_logs
  const weightData = useMemo(() =>
    (logs || []).filter(l => l.weight_morning != null).map(l => ({
      date: l.log_date,
      weight: parseFloat(l.weight_morning),
    })),
    [logs]
  )

  const weightToday = weightData[weightData.length - 1]?.weight ?? null
  const weightInitial = userData?.current_weight ? parseFloat(userData.current_weight) : null
  const weightTarget = userData?.target_weight ? parseFloat(userData.target_weight) : null
  const weightChange = weightToday != null && weightInitial != null
    ? (weightToday - weightInitial).toFixed(1)
    : null

  // Racha: días consecutivos con actividad (comida registrada o check-in)
  const streak = useMemo(() => {
    if (!logs?.length) return 0
    const sorted = [...logs].sort((a, b) => new Date(b.log_date) - new Date(a.log_date))
    let count = 0
    for (const l of sorted) {
      if ((l.calories_consumed > 0) || l.weight_morning != null) count++
      else break
    }
    return count
  }, [logs])

  // Adherencia calórica últimos 7 días
  const adherence7 = useMemo(() => {
    if (!logs?.length || !plan?.daily_calories) return null
    const last7 = logs.slice(-7).filter(l => l.calories_consumed > 0)
    if (!last7.length) return null
    const ok = last7.filter(l => Math.abs(l.calories_consumed - plan.daily_calories) <= plan.daily_calories * 0.15)
    return Math.round((ok.length / last7.length) * 100)
  }, [logs, plan])

  // Último resumen nocturno
  const lastSummary = useMemo(() =>
    [...(logs || [])].reverse().find(l => l.ai_summary_night)?.ai_summary_night ?? null,
    [logs]
  )

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-4xl text-[#0F172A] tracking-wide" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
          BUENOS DÍAS 🔥
        </h2>
        <p className="text-[#64748B] text-sm mt-1">
          {userData ? GOALS_ES[userData.goal] || userData.goal : 'Tu plan está activo'}
        </p>
      </div>

      {/* Progreso de peso */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-semibold text-[#0F172A]">Progreso de peso</h3>
          {weightChange !== null && (
            <span className={`text-sm font-bold ${parseFloat(weightChange) <= 0 ? 'text-[#16A34A]' : 'text-orange-500'}`}>
              {parseFloat(weightChange) > 0 ? '+' : ''}{weightChange} kg
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4 text-center">
          <div className="bg-[#F8FAFC] rounded-xl p-3">
            <div className="text-xs text-[#94A3B8] mb-1">Hoy</div>
            <div className="text-xl font-bold text-[#0F172A]">{weightToday ?? '–'}</div>
            <div className="text-xs text-[#94A3B8]">kg</div>
          </div>
          <div className="bg-[#F8FAFC] rounded-xl p-3">
            <div className="text-xs text-[#94A3B8] mb-1">Inicial</div>
            <div className="text-xl font-bold text-[#64748B]">{weightInitial ?? '–'}</div>
            <div className="text-xs text-[#94A3B8]">kg</div>
          </div>
          <div className="bg-[#16A34A]/10 rounded-xl p-3">
            <div className="text-xs text-[#16A34A] mb-1">Objetivo</div>
            <div className="text-xl font-bold text-[#16A34A]">{weightTarget ?? '–'}</div>
            <div className="text-xs text-[#16A34A]">kg</div>
          </div>
        </div>

        {/* Gráfica 30 días */}
        {weightData.length > 1 && (
          <>
            <div className="flex items-end gap-0.5 h-16">
              {weightData.slice(-30).map((w, i) => {
                const vals = weightData.slice(-30).map(x => x.weight)
                const min = Math.min(...vals)
                const max = Math.max(...vals)
                const range = max - min || 1
                const pct = ((w.weight - min) / range) * 100
                return (
                  <div key={i} className="flex-1 flex flex-col justify-end">
                    <div
                      className="rounded-sm bg-[#16A34A]/60 min-h-[4px]"
                      style={{ height: `${Math.max(8, pct)}%` }}
                    />
                  </div>
                )
              })}
            </div>
            <div className="flex justify-between text-xs text-[#94A3B8] mt-1">
              <span>{weightData[Math.max(0, weightData.length - 30)]?.weight} kg</span>
              <span>{weightData[weightData.length - 1]?.weight} kg</span>
            </div>
          </>
        )}
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
          <div className="text-xs text-[#94A3B8] mb-1">Racha actual</div>
          <div className="text-2xl font-bold text-[#16A34A]">{streak}</div>
          <div className="text-xs text-[#94A3B8]">días registrados 🔥</div>
        </div>
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
          <div className="text-xs text-[#94A3B8] mb-1">Adherencia 7 días</div>
          <div className="text-2xl font-bold text-[#16A34A]">{adherence7 !== null ? `${adherence7}%` : '–'}</div>
          <div className="text-xs text-[#94A3B8]">días en objetivo calórico</div>
        </div>
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
          <div className="text-xs text-[#94A3B8] mb-1">Puntuación plan</div>
          <div className="text-2xl font-bold text-[#16A34A]">{plan?.health_score ?? '–'}</div>
          <div className="text-xs text-[#94A3B8]">/ 100</div>
        </div>
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
          <div className="text-xs text-[#94A3B8] mb-1">Kcal objetivo</div>
          <div className="text-2xl font-bold text-[#16A34A]">{plan?.daily_calories ?? '–'}</div>
          <div className="text-xs text-[#94A3B8]">kcal/día</div>
        </div>
      </div>

      {/* Último resumen nocturno */}
      {lastSummary && (
        <div className="bg-[#0F172A] text-white rounded-xl p-5">
          <div className="text-xs text-white/50 mb-2 uppercase tracking-wider">Último resumen nocturno</div>
          <p className="text-sm text-white/80 leading-relaxed">{lastSummary}</p>
        </div>
      )}

      {/* Acceso rápido al tracker */}
      <button
        onClick={() => setActiveTab('tracker')}
        className="w-full bg-[#16A34A] hover:bg-[#15803D] text-white font-semibold py-4 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
      >
        🍽️ Abrir Tracker de hoy
      </button>
    </div>
  )
}

// ─── Tab: Tracker ─────────────────────────────────────────────────────────────
function TrackerTab({ user, plan, userData }) {
  const date = useMemo(() => new Date().toISOString().split('T')[0], [])
  const {
    log, foodEntries, workoutEntries, loading,
    morningCheckin, addFoodEntry, removeFoodEntry,
    addWorkoutEntry, removeWorkoutEntry,
  } = useTracker(user?.id, date)

  // Check-in state
  const [checkin, setCheckin] = useState({ weight: '', sleepHours: 7.5, sleepQuality: 3 })
  const [savingCheckin, setSavingCheckin] = useState(false)

  // Meal state
  const [expandedMeals, setExpandedMeals] = useState({ breakfast: true })
  const [addingToMeal, setAddingToMeal] = useState(null)
  const [search, setSearch] = useState('')
  const [selectedFood, setSelectedFood] = useState(null)
  const [quantity, setQuantity] = useState(100)
  const [savingFood, setSavingFood] = useState(false)

  // Workout state
  const [showWorkoutModal, setShowWorkoutModal] = useState(false)
  const [newWorkout, setNewWorkout] = useState({ type: 'strength', duration: 60, notes: '' })
  const [savingWorkout, setSavingWorkout] = useState(false)

  // AI state
  const [aiFeedback, setAiFeedback] = useState(null)
  const [aiSummary, setAiSummary] = useState(null)
  const [loadingFeedback, setLoadingFeedback] = useState(false)
  const [loadingSummary, setLoadingSummary] = useState(false)

  const checkinDone = log?.weight_morning != null
  const isAfter8PM = new Date().getHours() >= 20

  // Totales del día
  const totalKcal = foodEntries.reduce((s, f) => s + (f.calories || 0), 0)
  const totalProtein = foodEntries.reduce((s, f) => s + (parseFloat(f.protein) || 0), 0)
  const totalCarbs = foodEntries.reduce((s, f) => s + (parseFloat(f.carbs) || 0), 0)
  const totalFat = foodEntries.reduce((s, f) => s + (parseFloat(f.fat) || 0), 0)
  const totalBurned = workoutEntries.reduce((s, w) => s + (w.calories_burned || 0), 0)
  const netBalance = (plan?.daily_calories || 0) - totalKcal + totalBurned

  const filtered = search.length > 1
    ? FOOD_DB.filter(f => f.name.toLowerCase().includes(search.toLowerCase())).slice(0, 6)
    : []

  const getMealFoods = (mealId) => foodEntries.filter(f => f.meal_type === mealId)

  const handleCheckin = async () => {
    setSavingCheckin(true)
    await morningCheckin({
      weight: checkin.weight,
      sleepHours: checkin.sleepHours,
      sleepQuality: checkin.sleepQuality,
    })
    setSavingCheckin(false)
  }

  const handleAddFood = async (mealId) => {
    if (!selectedFood) return
    const ratio = quantity / 100
    setSavingFood(true)
    await addFoodEntry({
      food_name: selectedFood.name,
      quantity_grams: quantity,
      calories: Math.round(selectedFood.kcal * ratio),
      protein: parseFloat((selectedFood.protein * ratio).toFixed(1)),
      carbs: parseFloat((selectedFood.carbs * ratio).toFixed(1)),
      fat: parseFloat((selectedFood.fat * ratio).toFixed(1)),
      meal_type: mealId,
    })
    setSearch(''); setSelectedFood(null); setQuantity(100); setAddingToMeal(null)
    setSavingFood(false)
  }

  const handleAddWorkout = async () => {
    setSavingWorkout(true)
    const burned = estimateCaloriesBurned(newWorkout.type, newWorkout.duration, userData?.current_weight || 75)
    await addWorkoutEntry({
      workout_type: newWorkout.type,
      duration_minutes: newWorkout.duration,
      calories_burned: burned,
      notes: newWorkout.notes || null,
    })
    setShowWorkoutModal(false)
    setNewWorkout({ type: 'strength', duration: 60, notes: '' })
    setSavingWorkout(false)
  }

  const getFeedback = async () => {
    setLoadingFeedback(true)
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date }),
      })
      const data = await res.json()
      if (data.feedback) setAiFeedback(data.feedback)
    } catch (e) {
      console.error(e)
    }
    setLoadingFeedback(false)
  }

  const getDailySummary = async () => {
    setLoadingSummary(true)
    try {
      const res = await fetch('/api/daily-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date }),
      })
      const data = await res.json()
      if (data.summary) setAiSummary(data.summary)
    } catch (e) {
      console.error(e)
    }
    setLoadingSummary(false)
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-2 border-t-[#16A34A] border-[#E2E8F0] rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-8">

      {/* ── Sección 1: Check-in matutino ─────────────────────── */}
      {!checkinDone ? (
        <div className="bg-white border border-[#16A34A]/30 rounded-xl p-5 space-y-5">
          <div>
            <h3 className="font-semibold text-[#0F172A]">Check-in matutino</h3>
            <p className="text-xs text-[#64748B] mt-0.5">Registra tu peso y cómo has dormido</p>
          </div>

          {/* Peso */}
          <div>
            <label className="text-xs text-[#64748B] mb-2 block">Peso esta mañana (kg)</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCheckin(p => ({ ...p, weight: Math.max(0, parseFloat(p.weight || 0) - 0.1).toFixed(1) }))}
                className="w-11 h-11 rounded-xl bg-[#F1F5F9] text-[#0F172A] font-bold text-xl flex items-center justify-center hover:bg-[#E2E8F0] transition-colors"
              >−</button>
              <input
                type="number"
                value={checkin.weight}
                onChange={e => setCheckin(p => ({ ...p, weight: e.target.value }))}
                placeholder="75.0"
                step="0.1"
                className="flex-1 text-center text-3xl font-bold bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl py-3 text-[#0F172A] focus:outline-none focus:border-[#16A34A]"
              />
              <button
                onClick={() => setCheckin(p => ({ ...p, weight: (parseFloat(p.weight || 0) + 0.1).toFixed(1) }))}
                className="w-11 h-11 rounded-xl bg-[#F1F5F9] text-[#0F172A] font-bold text-xl flex items-center justify-center hover:bg-[#E2E8F0] transition-colors"
              >+</button>
            </div>
          </div>

          {/* Horas de sueño */}
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-xs text-[#64748B]">Horas de sueño</label>
              <span className="text-sm font-semibold text-[#0F172A]">{checkin.sleepHours}h</span>
            </div>
            <input
              type="range" min="4" max="12" step="0.5"
              value={checkin.sleepHours}
              onChange={e => setCheckin(p => ({ ...p, sleepHours: parseFloat(e.target.value) }))}
              style={{ accentColor: '#16A34A' }}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-[#94A3B8] mt-1">
              <span>4h</span><span>8h</span><span>12h</span>
            </div>
          </div>

          {/* Calidad del sueño */}
          <div>
            <label className="text-xs text-[#64748B] mb-2 block">Calidad del sueño</label>
            <div className="flex gap-2">
              {SLEEP_EMOJIS.map((emoji, i) => (
                <button
                  key={i}
                  onClick={() => setCheckin(p => ({ ...p, sleepQuality: i + 1 }))}
                  className={`flex-1 py-2.5 rounded-xl text-xl border transition-all ${
                    checkin.sleepQuality === i + 1
                      ? 'bg-[#16A34A]/10 border-[#16A34A]/40 scale-105'
                      : 'bg-[#F8FAFC] border-[#E2E8F0] hover:border-[#16A34A]/20'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleCheckin}
            disabled={savingCheckin || !checkin.weight}
            className="w-full bg-[#16A34A] hover:bg-[#15803D] text-white font-semibold py-3 rounded-xl text-sm transition-colors disabled:opacity-50"
          >
            {savingCheckin ? 'Guardando...' : 'Registrar check-in ✓'}
          </button>
        </div>
      ) : (
        <div className="bg-[#16A34A]/5 border border-[#16A34A]/20 rounded-xl p-4 flex items-center gap-3">
          <span className="text-2xl">✅</span>
          <div>
            <div className="text-sm font-medium text-[#0F172A]">Check-in matutino registrado</div>
            <div className="text-xs text-[#64748B] mt-0.5">
              {log?.weight_morning ? `${log.weight_morning} kg` : ''}
              {log?.sleep_hours ? ` · ${log.sleep_hours}h sueño` : ''}
              {log?.sleep_quality ? ` · ${SLEEP_EMOJIS[log.sleep_quality - 1]}` : ''}
            </div>
          </div>
        </div>
      )}

      {/* ── Sección 2: Mis comidas de hoy ────────────────────── */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-[#0F172A] px-1">Mis comidas de hoy</h3>

        {MEALS.map(meal => {
          const mealFoods = getMealFoods(meal.id)
          const mealKcal = mealFoods.reduce((s, f) => s + (f.calories || 0), 0)
          const mealProtein = mealFoods.reduce((s, f) => s + (parseFloat(f.protein) || 0), 0)
          const mealCarbs = mealFoods.reduce((s, f) => s + (parseFloat(f.carbs) || 0), 0)
          const mealFat = mealFoods.reduce((s, f) => s + (parseFloat(f.fat) || 0), 0)
          const isExpanded = !!expandedMeals[meal.id]
          const isAdding = addingToMeal === meal.id

          return (
            <div key={meal.id} className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
              {/* Header */}
              <button
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#F8FAFC] transition-colors"
                onClick={() => setExpandedMeals(p => ({ ...p, [meal.id]: !isExpanded }))}
              >
                <div className="flex items-center gap-2">
                  <span>{meal.emoji}</span>
                  <span className="text-sm font-medium text-[#0F172A]">{meal.label}</span>
                  {mealFoods.length > 0 && (
                    <span className="text-xs bg-[#F1F5F9] text-[#64748B] px-1.5 py-0.5 rounded-full">{mealFoods.length}</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {mealKcal > 0 && <span className="text-sm font-bold text-[#16A34A]">{mealKcal} kcal</span>}
                  <span className="text-[#94A3B8] text-xs">{isExpanded ? '▲' : '▼'}</span>
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-[#E2E8F0]">
                  {/* Lista de alimentos */}
                  {mealFoods.map(f => (
                    <div key={f.id} className="flex items-center justify-between px-4 py-2.5 border-b border-[#F1F5F9] hover:bg-[#F8FAFC]">
                      <div className="flex-1 min-w-0 mr-3">
                        <div className="text-sm text-[#0F172A] truncate">{f.food_name}</div>
                        <div className="text-xs text-[#94A3B8]">
                          {f.quantity_grams}g · P:{parseFloat(f.protein).toFixed(1)}g C:{parseFloat(f.carbs).toFixed(1)}g G:{parseFloat(f.fat).toFixed(1)}g
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm font-semibold text-[#16A34A]">{f.calories}</span>
                        <button
                          onClick={() => removeFoodEntry(f.id)}
                          className="text-[#CBD5E1] hover:text-red-400 transition-colors w-6 h-6 flex items-center justify-center"
                        >✕</button>
                      </div>
                    </div>
                  ))}

                  {/* Resumen macros de la comida */}
                  {mealFoods.length > 0 && (
                    <div className="flex gap-4 px-4 py-2 bg-[#F8FAFC] text-xs text-[#64748B] border-b border-[#F1F5F9]">
                      <span className="font-medium">P: {mealProtein.toFixed(1)}g</span>
                      <span className="font-medium">C: {mealCarbs.toFixed(1)}g</span>
                      <span className="font-medium">G: {mealFat.toFixed(1)}g</span>
                    </div>
                  )}

                  {/* Añadir alimento */}
                  {!isAdding ? (
                    <button
                      onClick={() => setAddingToMeal(meal.id)}
                      className="w-full py-3 px-4 text-sm text-[#16A34A] font-medium hover:bg-[#16A34A]/5 transition-colors flex items-center justify-center gap-1"
                    >
                      <span className="text-lg leading-none">+</span> Añadir alimento
                    </button>
                  ) : (
                    <div className="p-4 space-y-3 bg-[#F8FAFC]">
                      <div className="relative">
                        <input
                          value={search}
                          onChange={e => { setSearch(e.target.value); setSelectedFood(null) }}
                          placeholder="Buscar alimento..."
                          autoFocus
                          className="w-full bg-white border border-[#E2E8F0] focus:border-[#16A34A] rounded-xl px-4 py-2.5 text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none"
                        />
                        {filtered.length > 0 && !selectedFood && (
                          <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-white border border-[#E2E8F0] rounded-xl shadow-xl overflow-hidden">
                            {filtered.map(f => (
                              <button
                                key={f.name}
                                onClick={() => { setSelectedFood(f); setSearch(f.name) }}
                                className="w-full text-left px-4 py-2.5 hover:bg-[#F8FAFC] transition-colors flex justify-between items-center"
                              >
                                <span className="text-sm text-[#0F172A]">{f.name}</span>
                                <span className="text-xs text-[#94A3B8]">{f.kcal} kcal/100g</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {selectedFood && (
                        <div className="space-y-2">
                          <div className="bg-[#16A34A]/10 border border-[#16A34A]/20 rounded-xl p-3 flex justify-between items-center">
                            <span className="text-sm font-medium text-[#0F172A]">{selectedFood.name}</span>
                            <span className="text-sm font-bold text-[#16A34A]">
                              {Math.round(selectedFood.kcal * quantity / 100)} kcal
                            </span>
                          </div>
                          <div>
                            <input
                              type="number"
                              value={quantity}
                              onChange={e => setQuantity(Number(e.target.value))}
                              className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm text-center font-semibold text-[#0F172A] focus:outline-none focus:border-[#16A34A]"
                            />
                            <p className="text-xs text-center text-[#94A3B8] mt-1">gramos</p>
                          </div>
                          <div className="flex gap-2 text-xs text-[#64748B] justify-center">
                            <span>P: {(selectedFood.protein * quantity / 100).toFixed(1)}g</span>
                            <span>·</span>
                            <span>C: {(selectedFood.carbs * quantity / 100).toFixed(1)}g</span>
                            <span>·</span>
                            <span>G: {(selectedFood.fat * quantity / 100).toFixed(1)}g</span>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button
                          onClick={() => { setAddingToMeal(null); setSearch(''); setSelectedFood(null); setQuantity(100) }}
                          className="flex-1 py-2.5 rounded-xl bg-[#E2E8F0] text-sm text-[#64748B] hover:text-[#0F172A] transition-colors"
                        >Cancelar</button>
                        <button
                          onClick={() => handleAddFood(meal.id)}
                          disabled={!selectedFood || savingFood}
                          className="flex-1 py-2.5 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-sm font-semibold disabled:opacity-50 transition-colors"
                        >
                          {savingFood ? '...' : 'Añadir ✓'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Sección 3: Ejercicio de hoy ───────────────────────── */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E2E8F0]">
          <h3 className="text-sm font-semibold text-[#0F172A]">Ejercicio de hoy</h3>
          <button
            onClick={() => setShowWorkoutModal(true)}
            className="text-xs bg-[#16A34A] hover:bg-[#15803D] text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
          >
            + Añadir
          </button>
        </div>

        {workoutEntries.length === 0 ? (
          <div className="py-6 text-center text-sm text-[#94A3B8]">Sin entrenamiento registrado hoy</div>
        ) : (
          workoutEntries.map(w => (
            <div key={w.id} className="flex items-center justify-between px-4 py-3 border-b border-[#F1F5F9] last:border-0 hover:bg-[#F8FAFC]">
              <div>
                <div className="text-sm font-medium text-[#0F172A]">{WORKOUT_TYPE_LABELS[w.workout_type] || w.workout_type}</div>
                <div className="text-xs text-[#94A3B8]">{w.duration_minutes} min · {w.calories_burned} kcal quemadas</div>
              </div>
              <button
                onClick={() => removeWorkoutEntry(w.id)}
                className="text-[#CBD5E1] hover:text-red-400 transition-colors w-7 h-7 flex items-center justify-center"
              >✕</button>
            </div>
          ))
        )}
      </div>

      {/* ── Sección 4: Balance del día ────────────────────────── */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-[#0F172A]">Balance del día</h3>

        {/* Barra de calorías */}
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-[#64748B]">Calorías consumidas</span>
            <span className={`font-semibold ${totalKcal > (plan?.daily_calories || 0) ? 'text-orange-500' : 'text-[#0F172A]'}`}>
              {totalKcal} / {plan?.daily_calories || 0} kcal
            </span>
          </div>
          <div className="h-3 bg-[#E2E8F0] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${plan?.daily_calories ? Math.min(100, Math.round(totalKcal / plan.daily_calories * 100)) : 0}%`,
                background: totalKcal > (plan?.daily_calories || 0)
                  ? 'linear-gradient(90deg, #f97316, #ea580c)'
                  : 'linear-gradient(90deg, #16A34A, #15803D)',
              }}
            />
          </div>
        </div>

        {/* Barras de macros */}
        <div className="space-y-2.5">
          <MacroBar label="Proteína" current={totalProtein} target={plan?.protein_grams || 0} color="#16A34A" />
          <MacroBar label="Carbohidratos" current={totalCarbs} target={plan?.carbs_grams || 0} color="#15803D" />
          <MacroBar label="Grasas" current={totalFat} target={plan?.fat_grams || 0} color="#22C55E" />
        </div>

        {/* Métricas numéricas */}
        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-[#E2E8F0]">
          <div className="text-center">
            <div className="text-xs text-[#94A3B8] mb-0.5">Quemadas</div>
            <div className="text-xl font-bold text-[#22C55E]">{totalBurned}</div>
            <div className="text-xs text-[#94A3B8]">kcal</div>
          </div>
          <div className="text-center border-x border-[#E2E8F0]">
            <div className="text-xs text-[#94A3B8] mb-0.5">Consumidas</div>
            <div className="text-xl font-bold text-[#0F172A]">{totalKcal}</div>
            <div className="text-xs text-[#94A3B8]">kcal</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-[#94A3B8] mb-0.5">Balance neto</div>
            <div className={`text-xl font-bold ${netBalance >= 0 ? 'text-[#16A34A]' : 'text-orange-500'}`}>
              {netBalance > 0 ? '+' : ''}{netBalance}
            </div>
            <div className="text-xs text-[#94A3B8]">kcal</div>
          </div>
        </div>

        {/* Botones IA */}
        <div className="space-y-2 pt-1">
          <button
            onClick={getFeedback}
            disabled={loadingFeedback}
            className="w-full bg-[#0F172A] hover:bg-[#1E293B] text-white py-3 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loadingFeedback
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Analizando...</>
              : '🤖 Ver feedback de la IA'}
          </button>

          {isAfter8PM && (
            <button
              onClick={getDailySummary}
              disabled={loadingSummary}
              className="w-full bg-[#16A34A] hover:bg-[#15803D] text-white py-3 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loadingSummary
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generando resumen...</>
                : '🌙 Generar resumen del día'}
            </button>
          )}
        </div>

        {/* Resultado feedback IA */}
        {aiFeedback && (
          <div className={`rounded-xl p-4 border space-y-2 ${
            aiFeedback.status === 'excellent' ? 'bg-[#16A34A]/10 border-[#16A34A]/30' :
            aiFeedback.status === 'good' ? 'bg-green-50 border-green-200' :
            aiFeedback.status === 'attention' ? 'bg-orange-50 border-orange-200' :
            'bg-[#F8FAFC] border-[#E2E8F0]'
          }`}>
            <p className="text-sm text-[#0F172A] leading-relaxed">{aiFeedback.message}</p>
            {aiFeedback.nextMealSuggestion && (
              <p className="text-xs text-[#64748B]">
                <span className="font-semibold text-[#0F172A]">Próxima comida:</span> {aiFeedback.nextMealSuggestion}
              </p>
            )}
            {aiFeedback.motivation && (
              <p className="text-xs text-[#16A34A] font-medium italic">{aiFeedback.motivation}</p>
            )}
          </div>
        )}

        {/* Resultado resumen nocturno */}
        {aiSummary && (
          <div className="bg-[#0F172A] rounded-xl p-5 text-white space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm">Resumen nocturno</span>
              <span className="text-2xl font-bold text-[#22C55E]">{aiSummary.score}/10</span>
            </div>
            <p className="text-sm text-white/80 leading-relaxed">{aiSummary.summary}</p>
            {aiSummary.achievements?.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-white/50 uppercase tracking-wider">Logros</p>
                {aiSummary.achievements.map((a, i) => (
                  <p key={i} className="text-xs text-[#22C55E]">✓ {a}</p>
                ))}
              </div>
            )}
            {aiSummary.improvements?.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-white/50 uppercase tracking-wider">Para mañana</p>
                {aiSummary.improvements.map((m, i) => (
                  <p key={i} className="text-xs text-white/70">→ {m}</p>
                ))}
              </div>
            )}
            {aiSummary.calorieAdjustment !== 0 && aiSummary.calorieAdjustment != null && (
              <p className="text-xs text-yellow-400">
                Ajuste sugerido: {aiSummary.calorieAdjustment > 0 ? '+' : ''}{aiSummary.calorieAdjustment} kcal/día
              </p>
            )}
          </div>
        )}
      </div>

      {/* Modal de entrenamiento */}
      {showWorkoutModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
            <h3 className="font-semibold text-[#0F172A]">Registrar entrenamiento</h3>

            <div>
              <label className="text-xs text-[#64748B] mb-1.5 block">Tipo de actividad</label>
              <select
                value={newWorkout.type}
                onChange={e => setNewWorkout(w => ({ ...w, type: e.target.value }))}
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm text-[#0F172A] focus:outline-none"
              >
                {Object.entries(WORKOUT_TYPE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-[#64748B] mb-1.5 block">Duración (minutos)</label>
              <input
                type="number"
                value={newWorkout.duration}
                onChange={e => setNewWorkout(w => ({ ...w, duration: Number(e.target.value) }))}
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm text-[#0F172A] focus:outline-none"
              />
            </div>

            <div className="bg-[#F8FAFC] rounded-xl p-3 text-center">
              <span className="text-[#64748B] text-sm">Estimación: </span>
              <span className="text-[#16A34A] font-bold">
                {estimateCaloriesBurned(newWorkout.type, newWorkout.duration, userData?.current_weight || 75)} kcal quemadas
              </span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowWorkoutModal(false)}
                className="flex-1 py-3 rounded-xl bg-[#E2E8F0] text-sm text-[#64748B] hover:text-[#0F172A] transition-colors"
              >Cancelar</button>
              <button
                onClick={handleAddWorkout}
                disabled={savingWorkout}
                className="flex-1 py-3 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white font-semibold text-sm transition-colors disabled:opacity-50"
              >
                {savingWorkout ? 'Guardando...' : 'Registrar ✓'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Tab: Plan ────────────────────────────────────────────────────────────────
function PlanTab({ plan }) {
  const [completedExercises, setCompletedExercises] = useState({})
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()

  if (!plan?.training_plan) return (
    <div className="text-center py-16 text-[#64748B]">Plan no generado todavía</div>
  )

  const days = Object.entries(plan.training_plan)

  return (
    <div className="space-y-4">
      {/* Macros del plan */}
      <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-4">
        <h3 className="text-sm font-semibold text-[#0F172A] mb-3">Tus objetivos diarios</h3>
        <div className="grid grid-cols-4 gap-2 text-center">
          {[
            { label: 'Calorías', val: plan.daily_calories, unit: 'kcal', color: '#16A34A' },
            { label: 'Proteína', val: `${plan.protein_grams}g`, color: '#16A34A' },
            { label: 'Carbos', val: `${plan.carbs_grams}g`, color: '#15803D' },
            { label: 'Grasas', val: `${plan.fat_grams}g`, color: '#22C55E' },
          ].map(m => (
            <div key={m.label} className="bg-[#F8FAFC] rounded-xl p-2">
              <div className="font-bold text-sm" style={{ color: m.color }}>{m.val}</div>
              <div className="text-[10px] text-[#64748B] mt-0.5">{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Días de entrenamiento */}
      {days.map(([day, session]) => {
        const isToday = day === today
        const isRest = session.type === 'rest'

        return (
          <div
            key={day}
            className={`rounded-xl border overflow-hidden ${
              isToday ? 'border-[#16A34A]/40 bg-gradient-to-b from-[#16A34A]/5 to-[#FFFFFF]' : 'border-[#E2E8F0] bg-[#FFFFFF]'
            }`}
          >
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                {isToday && <span className="w-2 h-2 bg-[#16A34A] rounded-full animate-pulse" />}
                <span className={`font-semibold text-sm ${isToday ? 'text-[#16A34A]' : 'text-[#0F172A]'}`}>
                  {DAYS_ES[day]}
                  {isToday && <span className="ml-2 text-xs bg-[#16A34A]/20 text-[#16A34A] px-2 py-0.5 rounded-full">HOY</span>}
                </span>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${
                isRest ? 'bg-[#E2E8F0] text-[#64748B]' : 'bg-[#16A34A]/10 text-[#16A34A]'
              }`}>
                {isRest ? '🛌 Descanso' : `💪 ${session.duration_minutes || 60}min`}
              </span>
            </div>

            {!isRest && session.exercises && (
              <div className="px-4 pb-4 space-y-2">
                <div className="text-xs text-[#64748B] mb-2">{session.name}</div>
                {session.exercises.map((ex, i) => {
                  const key = `${day}-${i}`
                  const done = completedExercises[key]
                  return (
                    <div
                      key={key}
                      onClick={() => setCompletedExercises(prev => ({ ...prev, [key]: !done }))}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                        done ? 'bg-[#22C55E]/10 border border-[#22C55E]/20' : 'bg-[#F8FAFC] hover:bg-[#E2E8F0]'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                        done ? 'bg-[#22C55E] border-[#22C55E]' : 'border-[#E2E8F0]'
                      }`}>
                        {done && <span className="text-white text-xs">✓</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-medium ${done ? 'line-through text-[#64748B]' : 'text-[#0F172A]'}`}>
                          {ex.name}
                        </div>
                        <div className="text-xs text-[#64748B]">
                          {ex.sets && `${ex.sets}×${ex.reps}`}
                          {ex.rest_seconds && ` · ${ex.rest_seconds}s descanso`}
                        </div>
                        {ex.notes && <div className="text-xs text-[#64748B]/60 mt-0.5 italic">{ex.notes}</div>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      {plan.key_tips?.length > 0 && (
        <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-4">
          <h3 className="text-sm font-semibold text-[#0F172A] mb-3">💡 Consejos clave</h3>
          <ul className="space-y-2">
            {plan.key_tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-[#64748B]">
                <span className="text-[#16A34A] shrink-0 mt-0.5">→</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// ─── Tab: Coach ───────────────────────────────────────────────────────────────
function CoachTab({ user }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    fetch('/api/coach')
      .then(r => r.json())
      .then(d => {
        if (d.messages?.length) setMessages(d.messages)
        else setMessages([{
          id: 'welcome',
          role: 'assistant',
          content: '¡Hola! Soy tu FORJA Coach 🔥 Pregúntame lo que quieras sobre tu entrenamiento, nutrición, o cómo sacar el máximo partido a tu plan. Estoy aquí 24/7.',
        }])
      })
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    if (!input.trim() || sending) return
    const msg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { id: Date.now(), role: 'user', content: msg }])
    setSending(true)

    const res = await fetch('/api/coach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg }),
    })
    const data = await res.json()
    if (data.message) {
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', content: data.message }])
    }
    setSending(false)
  }

  const SUGGESTIONS = [
    '¿Puedo comer carbos por la noche?',
    '¿Cómo evito el estancamiento?',
    'Explícame el plan de hoy',
    '¿Qué como antes de entrenar?',
  ]

  return (
    <div className="flex flex-col h-[calc(100vh-200px)]">
      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-[#16A34A]/20 border border-[#16A34A]/30 flex items-center justify-center text-xs text-[#16A34A] font-bold mr-2 mt-1 shrink-0">F</div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-[#16A34A] text-white rounded-tr-none'
                  : 'bg-[#FFFFFF] border border-[#E2E8F0] text-[#0F172A] rounded-tl-none'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl rounded-tl-none px-4 py-3">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 bg-[#64748B] rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {SUGGESTIONS.map(s => (
            <button
              key={s}
              onClick={() => setInput(s)}
              className="text-xs bg-[#FFFFFF] border border-[#E2E8F0] hover:border-[#16A34A] text-[#64748B] hover:text-[#0F172A] px-3 py-1.5 rounded-full transition-all"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Pregúntale a tu coach..."
          className="flex-1 bg-[#FFFFFF] border border-[#E2E8F0] focus:border-[#16A34A] rounded-xl px-4 py-3 text-sm text-[#0F172A] placeholder-[#64748B] focus:outline-none"
        />
        <button
          onClick={send}
          disabled={!input.trim() || sending}
          className="bg-[#16A34A] hover:bg-[#15803D] disabled:opacity-40 text-white px-4 rounded-xl transition-colors font-semibold text-sm"
        >
          →
        </button>
      </div>
    </div>
  )
}

// ─── Tab: Laboratorio ─────────────────────────────────────────────────────────
function LabTab({ plan, userData }) {
  const [scenario, setScenario] = useState({
    dailyCalories: plan?.daily_calories || 2000,
    weeklyWorkouts: userData?.training_days_per_week || 3,
    currentWeight: userData?.current_weight || 80,
    targetWeight: userData?.target_weight || 70,
  })

  const deficit = scenario.dailyCalories < (plan?.daily_calories || 2000)
    ? (plan?.daily_calories || 2000) - scenario.dailyCalories
    : 0
  const weeklyCalorieBurn = scenario.weeklyWorkouts * 350
  const totalWeeklyDeficit = deficit * 7 + weeklyCalorieBurn
  const kgPerWeek = totalWeeklyDeficit / 7700
  const weightDiff = Math.abs(scenario.currentWeight - scenario.targetWeight)
  const weeksNeeded = kgPerWeek > 0 ? Math.ceil(weightDiff / kgPerWeek) : null
  const estimatedDate = weeksNeeded
    ? new Date(Date.now() + weeksNeeded * 7 * 24 * 60 * 60 * 1000).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-[#0F172A] mb-1">Simulador de escenarios</h3>
        <p className="text-xs text-[#64748B]">Ajusta las variables y ve cuándo alcanzarías tu objetivo.</p>
      </div>

      <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-5 space-y-5">
        {[
          { label: 'Calorías diarias', key: 'dailyCalories', min: 1200, max: 4000, unit: 'kcal', step: 50 },
          { label: 'Entrenamientos/semana', key: 'weeklyWorkouts', min: 0, max: 7, unit: 'días', step: 1 },
          { label: 'Peso actual', key: 'currentWeight', min: 40, max: 200, unit: 'kg', step: 0.5 },
          { label: 'Peso objetivo', key: 'targetWeight', min: 40, max: 200, unit: 'kg', step: 0.5 },
        ].map(s => (
          <div key={s.key}>
            <div className="flex justify-between mb-2">
              <label className="text-xs text-[#64748B]">{s.label}</label>
              <span className="text-xs text-[#0F172A] font-semibold">{scenario[s.key]} {s.unit}</span>
            </div>
            <input
              type="range" min={s.min} max={s.max} step={s.step}
              value={scenario[s.key]}
              onChange={e => setScenario(prev => ({ ...prev, [s.key]: Number(e.target.value) }))}
              style={{ accentColor: '#16A34A' }}
              className="w-full"
            />
          </div>
        ))}
      </div>

      <div className={`rounded-xl p-5 border ${weeksNeeded ? 'bg-[#16A34A]/10 border-[#16A34A]/30' : 'bg-[#FFFFFF] border-[#E2E8F0]'}`}>
        <h4 className="text-sm font-semibold text-[#0F172A] mb-4">Proyección estimada</h4>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-[#F8FAFC] rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-[#16A34A]">{kgPerWeek > 0 ? kgPerWeek.toFixed(2) : '0'}</div>
            <div className="text-xs text-[#64748B] mt-1">kg/semana</div>
          </div>
          <div className="bg-[#F8FAFC] rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-[#16A34A]">{weeksNeeded || '∞'}</div>
            <div className="text-xs text-[#64748B] mt-1">semanas</div>
          </div>
        </div>
        {estimatedDate && (
          <div className="text-center">
            <div className="text-xs text-[#64748B] mb-1">Fecha estimada</div>
            <div className="text-lg font-semibold text-[#22C55E]">{estimatedDate}</div>
          </div>
        )}
        {!weeksNeeded && (
          <p className="text-sm text-[#64748B] text-center">Aumenta el déficit calórico o añade más entrenamientos.</p>
        )}
        <div className="mt-4 pt-4 border-t border-[#E2E8F0] text-xs text-[#64748B] leading-relaxed">
          ⚠️ Estimación basada en 7.700 kcal = 1kg. Los resultados reales varían.
        </div>
      </div>
    </div>
  )
}

// ─── Página principal Pro ─────────────────────────────────────────────────────
function ProContent() {
  const router = useRouter()
  const supabase = createClient()

  const [user, setUser] = useState(null)
  const [plan, setPlan] = useState(null)
  const [userData, setUserData] = useState(null)
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.replace('/auth')
          return
        }
        setUser(user)

        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0]

        const [{ data: planData }, { data: ud }, { data: logsData }] = await Promise.all([
          supabase.from('plans').select('*').eq('user_id', user.id).eq('is_active', true).order('created_at', { ascending: false }).limit(1).single(),
          supabase.from('user_data').select('*').eq('user_id', user.id).single(),
          supabase.from('daily_logs').select('*').eq('user_id', user.id).gte('log_date', thirtyDaysAgoStr).order('log_date', { ascending: true }),
        ])

        setPlan(planData)
        setUserData(ud)
        setLogs(logsData || [])
      } catch (error) {
        console.error('Error loading pro dashboard:', error)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  const TABS = [
    { id: 'dashboard', label: 'Dashboard', emoji: '📊' },
    { id: 'tracker', label: 'Tracker', emoji: '🍽️' },
    { id: 'plan', label: 'Mi Plan', emoji: '📋' },
    { id: 'coach', label: 'Coach', emoji: '🤖' },
    { id: 'lab', label: 'Laboratorio', emoji: '🧪' },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-t-[#16A34A] border-[#E2E8F0] rounded-full animate-spin mx-auto mb-4" />
          <div className="font-display text-xl text-[#16A34A] tracking-widest" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>FORJA</div>
        </div>
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">📋</div>
          <h2 className="text-2xl font-bold text-[#0F172A] mb-3" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.05em' }}>
            NO TIENES UN PLAN AÚN
          </h2>
          <p className="text-[#64748B] mb-8 leading-relaxed">
            Completa el diagnóstico inicial para que la IA genere tu plan personalizado de entrenamiento y nutrición.
          </p>
          <button
            onClick={() => router.push('/onboarding')}
            className="bg-[#16A34A] hover:bg-[#15803D] text-white font-semibold px-8 py-4 rounded-xl transition-colors"
          >
            Generar mi plan →
          </button>
          <button
            onClick={async () => { await supabase.auth.signOut(); router.push('/') }}
            className="block mx-auto mt-4 text-sm text-[#64748B] hover:text-[#0F172A] transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-[#E2E8F0]">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <span className="font-display text-2xl text-[#16A34A] tracking-widest" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>FORJA</span>
            <button
              onClick={async () => { await supabase.auth.signOut(); router.push('/') }}
              className="text-xs text-[#64748B] hover:text-[#0F172A] transition-colors"
            >
              Salir
            </button>
          </div>
          <div className="flex overflow-x-auto gap-1 pb-2 scrollbar-hide">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === tab.id ? 'bg-[#16A34A] text-white' : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                <span>{tab.emoji}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {activeTab === 'dashboard' && <DashboardTab plan={plan} userData={userData} logs={logs} setActiveTab={setActiveTab} />}
        {activeTab === 'tracker' && <TrackerTab user={user} plan={plan} userData={userData} />}
        {activeTab === 'plan' && <PlanTab plan={plan} />}
        {activeTab === 'coach' && <CoachTab user={user} />}
        {activeTab === 'lab' && <LabTab plan={plan} userData={userData} />}
      </div>
    </div>
  )
}

export default function ProPage() {
  return (
    <Suspense>
      <ProContent />
    </Suspense>
  )
}
