'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { estimateCaloriesBurned } from '@/lib/utils'
import { useTracker } from '@/hooks/useTracker'
import { FOOD_DB } from '@/lib/foodDB'

const MEALS = [
  { id: 'breakfast',       label: 'Desayuno',      emoji: '🌅' },
  { id: 'morning_snack',   label: 'Media mañana',  emoji: '🍎' },
  { id: 'lunch',           label: 'Comida',        emoji: '🍽️' },
  { id: 'afternoon_snack', label: 'Merienda',      emoji: '🍊' },
  { id: 'dinner',          label: 'Cena',          emoji: '🌙' },
]

const WORKOUT_TYPE_LABELS = {
  strength: 'Fuerza / Musculación', running: 'Carrera', cycling: 'Ciclismo',
  swimming: 'Natación', hiit: 'HIIT', yoga: 'Yoga / Stretching',
  walking: 'Caminar', other: 'Otro',
}

const SLEEP_EMOJIS = ['😴', '😑', '🙂', '😊', '🔥']

function localToday() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
function offsetDate(base, days) {
  const d = new Date(base + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}
function formatDateShort(dateStr) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
}

// ── MacroBar ──────────────────────────────────────────────────────────────────
function MacroBar({ label, current, target, color }) {
  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0
  const over = target > 0 && current > target * 1.1
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-[#64748B]">{label}</span>
        <span className="text-[#0F172A]">{Math.round(current)}g <span className="text-[#94A3B8]">/ {target}g</span></span>
      </div>
      <div className="h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: over ? '#F97316' : color }} />
      </div>
    </div>
  )
}

// ── AIDescribe ────────────────────────────────────────────────────────────────
function AIDescribe({ onAddAll }) {
  const [text, setText]       = useState('')
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState(null)
  const [error, setError]     = useState('')
  const r1 = n => Math.round(n * 10) / 10

  const analyze = async () => {
    if (!text.trim()) return
    setLoading(true); setError(''); setPreview(null)
    try {
      const res  = await fetch('/api/nutrition/parse', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: text }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error')
      setPreview(data.items || [])
    } catch { setError('No se pudo analizar. Inténtalo de nuevo.') }
    finally { setLoading(false) }
  }

  const confirm = () => { onAddAll(preview); setText(''); setPreview(null) }

  if (preview) {
    const total = preview.reduce((a, it) => ({ cal: a.cal + it.calories, p: a.p + it.protein, c: a.c + it.carbs, f: a.f + it.fat }), { cal:0,p:0,c:0,f:0 })
    return (
      <div className="space-y-2">
        {preview.map((item, i) => (
          <div key={i} className="flex items-center justify-between bg-[#F8FAFC] rounded-xl px-3 py-2.5">
            <div className="flex-1 min-w-0 mr-3">
              <div className="text-sm font-medium text-[#0F172A] truncate">{item.name}</div>
              <div className="text-xs text-[#94A3B8]">~{item.grams}g estimados</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-[#0F172A]">{Math.round(item.calories)} kcal</div>
              <div className="text-[11px] text-[#94A3B8]">P{r1(item.protein)} C{r1(item.carbs)} G{r1(item.fat)}</div>
            </div>
          </div>
        ))}
        <div className="flex items-center justify-between bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl px-4 py-2.5">
          <span className="text-sm font-bold text-[#15803D]">Total</span>
          <div className="text-right">
            <span className="text-base font-bold text-[#16A34A]">{Math.round(total.cal)} kcal</span>
            <span className="text-xs text-[#64748B] ml-2">P{Math.round(total.p)} C{Math.round(total.c)} G{Math.round(total.f)}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setPreview(null)} className="flex-1 py-2.5 rounded-xl border border-[#E2E8F0] text-sm text-[#64748B]">Editar</button>
          <button onClick={confirm} className="flex-1 py-2.5 rounded-xl bg-[#16A34A] text-white text-sm font-bold">Añadir ✓</button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <textarea value={text} onChange={e => setText(e.target.value)} rows={3}
        placeholder={'Describe lo que has comido...\nEj: 2 tostadas con AOVE y 30g de pavo, café con leche'}
        className="w-full bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#16A34A] rounded-xl px-4 py-3 text-sm resize-none focus:outline-none"
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      <button onClick={analyze} disabled={!text.trim() || loading}
        className={`w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 ${text.trim() && !loading ? 'bg-[#0F172A] text-white' : 'bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed'}`}>
        {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Analizando...</> : '✨ Calcular macros con IA'}
      </button>
    </div>
  )
}

// ── AIActivity ────────────────────────────────────────────────────────────────
function AIActivity({ onAddAll, userWeight }) {
  const [text, setText]       = useState('')
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState(null)
  const [error, setError]     = useState('')

  const analyze = async () => {
    if (!text.trim()) return
    setLoading(true); setError(''); setPreview(null)
    try {
      const res  = await fetch('/api/activity/parse', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: text, weight_kg: userWeight }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error')
      setPreview(data.activities || [])
    } catch { setError('No se pudo analizar.') }
    finally { setLoading(false) }
  }

  const confirm = () => { onAddAll(preview); setText(''); setPreview(null) }

  if (preview) {
    const totalCal = preview.reduce((a, act) => a + act.calories_burned, 0)
    const totalMin = preview.reduce((a, act) => a + act.duration_minutes, 0)
    return (
      <div className="space-y-2">
        {preview.map((act, i) => (
          <div key={i} className="flex items-center gap-3 bg-[#F8FAFC] rounded-xl px-3 py-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#EFF6FF] flex items-center justify-center text-lg shrink-0">{act.emoji}</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-[#0F172A] truncate">{act.name}</div>
              {act.notes && <div className="text-xs text-[#94A3B8] truncate">{act.notes}</div>}
            </div>
            <div className="text-right shrink-0">
              <div className="text-sm font-bold text-[#3B82F6]">-{act.calories_burned} kcal</div>
              <div className="text-[11px] text-[#94A3B8]">{act.duration_minutes} min</div>
            </div>
          </div>
        ))}
        <div className="flex items-center justify-between bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl px-4 py-2.5">
          <span className="text-sm font-bold text-[#2563EB]">Total</span>
          <div className="text-right">
            <span className="text-base font-bold text-[#3B82F6]">-{totalCal} kcal</span>
            <span className="text-xs text-[#64748B] ml-2">{totalMin} min</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setPreview(null)} className="flex-1 py-2.5 rounded-xl border border-[#E2E8F0] text-sm text-[#64748B]">Editar</button>
          <button onClick={confirm} className="flex-1 py-2.5 rounded-xl bg-[#16A34A] text-white text-sm font-bold">Añadir ✓</button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <textarea value={text} onChange={e => setText(e.target.value)} rows={3}
        placeholder={'Describe tu actividad...\nEj: 1 hora de tenis y 5km corriendo a 4:30'}
        className="w-full bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#16A34A] rounded-xl px-4 py-3 text-sm resize-none focus:outline-none"
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      <button onClick={analyze} disabled={!text.trim() || loading}
        className={`w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 ${text.trim() && !loading ? 'bg-[#0F172A] text-white' : 'bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed'}`}>
        {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Calculando...</> : '✨ Calcular calorías con IA'}
      </button>
    </div>
  )
}

// ── FoodCamera ────────────────────────────────────────────────────────────────
function FoodCamera({ onScanResult, onClose }) {
  const inputRef  = useRef(null)
  const [scanning, setScanning] = useState(false)
  const [result,   setResult]   = useState(null)
  const [error,    setError]    = useState('')

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setScanning(true); setError('')
    const reader = new FileReader()
    reader.onloadend = async () => {
      const base64 = reader.result.split(',')[1]
      try {
        const res  = await fetch('/api/food-scan', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_base64: base64, media_type: file.type || 'image/jpeg' }),
        })
        const data = await res.json()
        if (data.foods) setResult(data)
        else setError('No se pudo identificar la comida')
      } catch { setError('Error al analizar la imagen') }
      finally { setScanning(false) }
    }
    reader.readAsDataURL(file)
  }

  if (result) {
    return (
      <div className="space-y-2">
        {result.meal_description && <p className="text-xs text-[#64748B] italic">{result.meal_description}</p>}
        {result.foods.map((food, i) => (
          <div key={i} className="flex justify-between items-center bg-[#F8FAFC] rounded-xl px-3 py-2">
            <div>
              <div className="text-sm font-medium text-[#0F172A]">{food.name}</div>
              <div className="text-xs text-[#94A3B8]">~{food.quantity_grams}g{food.confidence === 'low' ? ' · ⚠️ estimado' : ''}</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-[#0F172A]">{food.calories} kcal</div>
              <div className="text-xs text-[#94A3B8]">P{food.protein} C{food.carbs} G{food.fat}</div>
            </div>
          </div>
        ))}
        <div className="flex items-center justify-between bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl px-4 py-2">
          <span className="text-sm font-bold text-[#15803D]">Total</span>
          <span className="text-sm font-bold text-[#16A34A]">{result.total_calories} kcal</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setResult(null)} className="flex-1 py-2 rounded-xl border border-[#E2E8F0] text-sm text-[#64748B]">Repetir</button>
          <button onClick={() => { onScanResult(result.foods); onClose() }} className="flex-1 py-2 rounded-xl bg-[#16A34A] text-white text-sm font-bold">Añadir ✓</button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3 py-1">
      <input ref={inputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
      {scanning ? (
        <div className="flex flex-col items-center py-6 gap-3">
          <div className="w-8 h-8 border-2 border-t-[#16A34A] border-[#E2E8F0] rounded-full animate-spin"/>
          <p className="text-sm text-[#64748B]">Analizando imagen con IA...</p>
        </div>
      ) : (
        <button onClick={() => inputRef.current?.click()}
          className="w-full py-4 bg-[#0F172A] hover:bg-[#1E293B] rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2">
          📷 Tomar foto o elegir imagen
        </button>
      )}
      {error && <p className="text-xs text-red-500 text-center">{error}</p>}
      <button onClick={onClose} className="w-full py-2 text-xs text-[#94A3B8] hover:text-[#64748B]">Cancelar</button>
    </div>
  )
}

// ── MealInputPro ──────────────────────────────────────────────────────────────
function MealInputPro({ mealId, addFoodEntry, addFoodEntries, onClose }) {
  const [mode,         setMode]         = useState('ai')
  const [query,        setQuery]        = useState('')
  const [selectedFood, setSelectedFood] = useState(null)
  const [grams,        setGrams]        = useState('100')
  const [saving,       setSaving]       = useState(false)

  const results = query.length >= 2
    ? FOOD_DB.filter(f => f.name.toLowerCase().includes(query.toLowerCase())).slice(0, 6)
    : []

  const handleAIAdd = async (items) => {
    setSaving(true)
    await addFoodEntries(items.map(it => ({
      food_name: it.name, quantity_grams: it.grams,
      calories: Math.round(it.calories),
      protein: parseFloat((+it.protein).toFixed(1)),
      carbs:   parseFloat((+it.carbs).toFixed(1)),
      fat:     parseFloat((+it.fat).toFixed(1)),
      meal_type: mealId,
    })))
    setSaving(false); onClose()
  }

  const handleCameraAdd = async (foods) => {
    setSaving(true)
    await addFoodEntries(foods.map(food => ({
      food_name: food.name,
      quantity_grams: Math.round(food.quantity_grams),
      calories: Math.round(food.calories),
      protein: parseFloat((+food.protein).toFixed(1)),
      carbs:   parseFloat((+food.carbs).toFixed(1)),
      fat:     parseFloat((+food.fat).toFixed(1)),
      meal_type: mealId,
    })))
    setSaving(false)
  }

  const handleManualAdd = async () => {
    if (!selectedFood || Number(grams) <= 0) return
    const g = Number(grams); const ratio = g / 100
    setSaving(true)
    await addFoodEntry({
      food_name: selectedFood.name, quantity_grams: g,
      calories: Math.round(selectedFood.kcal * ratio),
      protein:  parseFloat((selectedFood.protein * ratio).toFixed(1)),
      carbs:    parseFloat((selectedFood.carbs   * ratio).toFixed(1)),
      fat:      parseFloat((selectedFood.fat     * ratio).toFixed(1)),
      meal_type: mealId,
    })
    setSaving(false); onClose()
  }

  const TABS = [['ai','✨ IA'],['search','🔍 Buscar'],['camera','📷 Foto']]

  return (
    <div className="p-3 bg-[#F8FAFC] border-t border-[#E2E8F0]">
      <div className="flex bg-[#F1F5F9] rounded-xl p-1 mb-3">
        {TABS.map(([m, lbl]) => (
          <button key={m} onClick={() => setMode(m)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${mode === m ? 'bg-white text-[#0F172A] shadow-sm' : 'text-[#64748B]'}`}
          >{lbl}</button>
        ))}
      </div>

      {mode === 'ai' && (
        <>
          <AIDescribe onAddAll={handleAIAdd}/>
          <button onClick={onClose} className="w-full mt-2 py-2 text-xs text-[#94A3B8]">Cancelar</button>
        </>
      )}

      {mode === 'camera' && <FoodCamera onScanResult={handleCameraAdd} onClose={onClose}/>}

      {mode === 'search' && (
        <div className="space-y-3">
          <div className="relative">
            <input value={query} onChange={e => { setQuery(e.target.value); setSelectedFood(null) }}
              placeholder="Buscar alimento..." autoFocus
              className="w-full bg-white border border-[#E2E8F0] focus:border-[#16A34A] rounded-xl px-4 py-2.5 text-sm focus:outline-none"
            />
            {results.length > 0 && !selectedFood && (
              <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-white border border-[#E2E8F0] rounded-xl shadow-xl overflow-hidden">
                {results.map(f => (
                  <button key={f.name} onClick={() => { setSelectedFood(f); setQuery(f.name) }}
                    className="w-full text-left px-4 py-2.5 hover:bg-[#F8FAFC] flex justify-between items-center">
                    <span className="text-sm text-[#0F172A]">{f.name}</span>
                    <span className="text-xs text-[#94A3B8]">{f.kcal} kcal/100g</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {selectedFood && (
            <div className="space-y-2">
              <div className="bg-[#16A34A]/10 border border-[#16A34A]/20 rounded-xl p-3 flex justify-between">
                <span className="text-sm font-medium">{selectedFood.name}</span>
                <span className="text-sm font-bold text-[#16A34A]">{Math.round(selectedFood.kcal * Number(grams) / 100)} kcal</span>
              </div>
              <input type="number" value={grams} onChange={e => setGrams(e.target.value)}
                className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm text-center font-semibold focus:outline-none focus:border-[#16A34A]"/>
              <p className="text-xs text-center text-[#94A3B8]">gramos</p>
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-[#E2E8F0] text-sm text-[#64748B]">Cancelar</button>
            <button onClick={handleManualAdd} disabled={!selectedFood || saving}
              className="flex-1 py-2.5 rounded-xl bg-[#16A34A] text-white text-sm font-semibold disabled:opacity-50">
              {saving ? '...' : 'Añadir ✓'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── TrackerTab (main export) ──────────────────────────────────────────────────
export default function TrackerTab({ user, plan, userData, onGoToWorkout }) {
  const today  = localToday()
  const [viewDate, setViewDate] = useState(today)
  const isToday = viewDate === today

  const {
    log, foodEntries, workoutEntries, loading,
    morningCheckin, addFoodEntry, addFoodEntries, removeFoodEntry,
    addWorkoutEntry, removeWorkoutEntry,
  } = useTracker(user?.id, viewDate)

  // ── Check-in con auto-save debounced ──────────────────────────────
  const [checkin, setCheckin] = useState({ weight: '', sleepHours: 7.5, sleepQuality: 3 })
  const [checkinOpen,    setCheckinOpen]    = useState(true)
  const [checkinSaving,  setCheckinSaving]  = useState(false)
  const [checkinSaved,   setCheckinSaved]   = useState(false)
  const debounceRef = useRef(null)

  // Inicializar desde el log cargado
  useEffect(() => {
    if (log?.weight_morning) {
      setCheckin({
        weight:       log.weight_morning?.toString() || '',
        sleepHours:   log.sleep_hours || 7.5,
        sleepQuality: log.sleep_quality || 3,
      })
      setCheckinSaved(true)
    }
  }, [log?.weight_morning])

  // Auto-save con debounce de 1s
  useEffect(() => {
    if (!checkin.weight || !isToday) return
    setCheckinSaved(false)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setCheckinSaving(true)
      await morningCheckin({ weight: checkin.weight, sleepHours: checkin.sleepHours, sleepQuality: checkin.sleepQuality })
      setCheckinSaving(false)
      setCheckinSaved(true)
    }, 1000)
    return () => clearTimeout(debounceRef.current)
  }, [checkin.weight, checkin.sleepHours, checkin.sleepQuality])

  // ── Meal state ────────────────────────────────────────────────────
  const [expandedMeals, setExpandedMeals] = useState({ breakfast: true })
  const [addingToMeal,  setAddingToMeal]  = useState(null)

  // ── Workout state ─────────────────────────────────────────────────
  const [showWorkoutModal,  setShowWorkoutModal]  = useState(false)
  const [workoutModalMode,  setWorkoutModalMode]  = useState('ai')
  const [newWorkout,        setNewWorkout]        = useState({ type: 'strength', duration: 60 })
  const [savingWorkout,     setSavingWorkout]     = useState(false)

  // ── AI feedback ───────────────────────────────────────────────────
  const [aiFeedback,      setAiFeedback]      = useState(null)
  const [loadingFeedback, setLoadingFeedback] = useState(false)

  // ── Totales ───────────────────────────────────────────────────────
  const totalKcal    = foodEntries.reduce((s, f) => s + (f.calories || 0), 0)
  const totalProtein = foodEntries.reduce((s, f) => s + (parseFloat(f.protein) || 0), 0)
  const totalCarbs   = foodEntries.reduce((s, f) => s + (parseFloat(f.carbs)   || 0), 0)
  const totalFat     = foodEntries.reduce((s, f) => s + (parseFloat(f.fat)     || 0), 0)
  const totalBurned  = log?.calories_burned || workoutEntries.reduce((s, w) => s + (w.calories_burned || 0), 0)
  const netCalories  = totalKcal - totalBurned
  const remaining    = (plan?.daily_calories || 0) - netCalories
  const calPct       = plan?.daily_calories ? Math.min(100, Math.round((netCalories / plan.daily_calories) * 100)) : 0
  const calColor     = netCalories > (plan?.daily_calories || 0) * 1.1 ? '#F97316' : '#16A34A'

  const getMealFoods = (mealId) => foodEntries.filter(f => f.meal_type === mealId)

  const todayDayName    = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
  const todayPlanSession = plan?.training_plan?.[todayDayName]
  const hasTodayWorkout  = todayPlanSession && todayPlanSession.type !== 'rest'

  const handleAddWorkout = async () => {
    setSavingWorkout(true)
    const burned = estimateCaloriesBurned(newWorkout.type, newWorkout.duration, userData?.current_weight || 75)
    await addWorkoutEntry({ workout_type: newWorkout.type, duration_minutes: newWorkout.duration, calories_burned: burned })
    setSavingWorkout(false)
    setShowWorkoutModal(false)
    setNewWorkout({ type: 'strength', duration: 60 })
  }

  const getFeedback = async () => {
    setLoadingFeedback(true)
    try {
      const res  = await fetch('/api/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ date: viewDate }) })
      const data = await res.json()
      if (data.feedback) setAiFeedback(data.feedback)
      else console.error('Feedback error:', data.error)
    } catch (err) {
      console.error('Feedback fetch error:', err)
    }
    setLoadingFeedback(false)
  }

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-t-[#16A34A] border-[#E2E8F0] rounded-full animate-spin"/></div>

  return (
    <div className="space-y-4 pb-8">

      {/* Navegación de fechas */}
      <div className="flex items-center justify-between bg-white border border-[#E2E8F0] rounded-xl px-4 py-3">
        <button onClick={() => setViewDate(d => offsetDate(d, -1))}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-[#94A3B8] hover:bg-[#F1F5F9] text-lg">‹</button>
        <button onClick={() => !isToday && setViewDate(today)}
          className={`flex-1 text-center text-sm font-semibold mx-2 py-1 rounded-xl ${isToday ? 'text-[#16A34A]' : 'text-[#0F172A] hover:bg-[#F1F5F9]'}`}>
          <span className="capitalize">{formatDateShort(viewDate)}</span>
          {!isToday && <span className="text-[#94A3B8] font-normal ml-2 text-xs">· hoy →</span>}
        </button>
        <button onClick={() => setViewDate(d => offsetDate(d, +1))} disabled={isToday}
          className={`w-9 h-9 flex items-center justify-center rounded-xl text-lg ${isToday ? 'text-[#E2E8F0] cursor-not-allowed' : 'text-[#94A3B8] hover:bg-[#F1F5F9]'}`}>›</button>
      </div>

      {!isToday && (
        <div className="bg-[#FFF7ED] border border-[#FED7AA] rounded-xl px-4 py-3 text-sm text-[#92400E] flex items-center gap-2">
          <span>📅</span><span>Estás viendo un día pasado. Solo lectura.</span>
        </div>
      )}

      {/* ── SECCIÓN 1: Balance del día (sticky) ────────────────────── */}
      <div className="sticky top-0 z-20 bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[#0F172A]">Balance del día</h3>
          <span className={`text-xs font-bold ${calColor === '#F97316' ? 'text-orange-500' : 'text-[#16A34A]'}`}>
            {netCalories} / {plan?.daily_calories || 0} kcal
          </span>
        </div>
        <div className="flex items-center gap-4 mb-3">
          {/* Círculo kcal */}
          <div className="relative w-14 h-14 shrink-0">
            <svg className="w-14 h-14 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#E2E8F0" strokeWidth="3"/>
              <circle cx="18" cy="18" r="15.9" fill="none" stroke={calColor} strokeWidth="3"
                strokeDasharray={`${calPct} 100`} strokeLinecap="round" pathLength="100"/>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[10px] font-bold text-[#0F172A] leading-none">{calPct}%</span>
            </div>
          </div>
          <div className="flex-1 grid grid-cols-3 gap-1 text-center">
            <div><div className="text-[10px] text-[#94A3B8]">Consumidas</div><div className="text-sm font-bold text-[#0F172A]">{totalKcal}</div></div>
            <div><div className="text-[10px] text-[#94A3B8]">Quemadas</div><div className="text-sm font-bold text-[#22C55E]">{totalBurned}</div></div>
            <div>
              <div className="text-[10px] text-[#94A3B8]">Restantes</div>
              <div className={`text-sm font-bold ${remaining >= 0 ? 'text-[#16A34A]' : 'text-orange-500'}`}>{remaining > 0 ? '+' : ''}{remaining}</div>
            </div>
          </div>
        </div>
        <div className="space-y-1.5">
          <MacroBar label="Proteína"      current={totalProtein} target={plan?.protein_grams || 0} color="#16A34A"/>
          <MacroBar label="Carbohidratos" current={totalCarbs}   target={plan?.carbs_grams   || 0} color="#15803D"/>
          <MacroBar label="Grasas"        current={totalFat}     target={plan?.fat_grams     || 0} color="#22C55E"/>
        </div>
      </div>

      {/* ── SECCIÓN 0: Check-in matutino (collapsable) ─────────────── */}
      {isToday && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
          <button className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#F8FAFC]"
            onClick={() => setCheckinOpen(p => !p)}>
            <div className="flex items-center gap-2">
              <span className="text-lg">🌅</span>
              <span className="text-sm font-semibold text-[#0F172A]">Check-in matutino</span>
              {checkin.weight && <span className="text-xs text-[#16A34A] bg-[#16A34A]/10 px-2 py-0.5 rounded-full">{checkin.weight} kg</span>}
            </div>
            <div className="flex items-center gap-2">
              {checkinSaving && <span className="text-[10px] text-[#94A3B8]">Guardando...</span>}
              {checkinSaved && !checkinSaving && <span className="text-[10px] text-[#16A34A]">✓ Guardado</span>}
              <span className="text-[#94A3B8] text-xs">{checkinOpen ? '▲' : '▼'}</span>
            </div>
          </button>

          {checkinOpen && (
            <div className="border-t border-[#E2E8F0] p-4 space-y-4">
              {/* Peso */}
              <div>
                <label className="text-xs text-[#64748B] mb-2 block">Peso esta mañana (kg)</label>
                <div className="flex items-center gap-3">
                  <button onClick={() => setCheckin(p => ({ ...p, weight: Math.max(0, parseFloat(p.weight || 0) - 0.1).toFixed(1) }))}
                    className="w-11 h-11 rounded-xl bg-[#F1F5F9] font-bold text-xl flex items-center justify-center hover:bg-[#E2E8F0]">−</button>
                  <input type="number" value={checkin.weight} onChange={e => setCheckin(p => ({ ...p, weight: e.target.value }))}
                    placeholder="75.0" step="0.1"
                    className="flex-1 text-center text-3xl font-bold bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl py-3 focus:outline-none focus:border-[#16A34A]"/>
                  <button onClick={() => setCheckin(p => ({ ...p, weight: (parseFloat(p.weight || 0) + 0.1).toFixed(1) }))}
                    className="w-11 h-11 rounded-xl bg-[#F1F5F9] font-bold text-xl flex items-center justify-center hover:bg-[#E2E8F0]">+</button>
                </div>
              </div>
              {/* Horas sueño */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-xs text-[#64748B]">Horas de sueño</label>
                  <span className="text-sm font-semibold text-[#0F172A]">{checkin.sleepHours}h</span>
                </div>
                <input type="range" min="4" max="12" step="0.5" value={checkin.sleepHours}
                  onChange={e => setCheckin(p => ({ ...p, sleepHours: parseFloat(e.target.value) }))}
                  style={{ accentColor: '#16A34A' }} className="w-full h-5 cursor-pointer"/>
                <div className="flex justify-between text-xs text-[#94A3B8] mt-1"><span>4h</span><span>8h</span><span>12h</span></div>
              </div>
              {/* Calidad sueño */}
              <div>
                <label className="text-xs text-[#64748B] mb-2 block">Calidad del sueño</label>
                <div className="flex gap-2">
                  {SLEEP_EMOJIS.map((emoji, i) => (
                    <button key={i} onClick={() => setCheckin(p => ({ ...p, sleepQuality: i + 1 }))}
                      className={`flex-1 py-2.5 rounded-xl text-xl border transition-all ${checkin.sleepQuality === i + 1 ? 'bg-[#16A34A]/10 border-[#16A34A]/40 scale-105' : 'bg-[#F8FAFC] border-[#E2E8F0]'}`}
                    >{emoji}</button>
                  ))}
                </div>
              </div>
              <p className="text-xs text-[#94A3B8] text-center">Se guarda automáticamente</p>
            </div>
          )}
        </div>
      )}

      {/* ── SECCIÓN 2: Mis comidas ──────────────────────────────────── */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-[#0F172A] px-1">Mis comidas de hoy</h3>
        {MEALS.map(meal => {
          const mealFoods   = getMealFoods(meal.id)
          const mealKcal    = mealFoods.reduce((s, f) => s + (f.calories || 0), 0)
          const isExpanded  = !!expandedMeals[meal.id]
          const isAdding    = addingToMeal === meal.id

          return (
            <div key={meal.id} className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
              <button className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#F8FAFC]"
                onClick={() => setExpandedMeals(p => ({ ...p, [meal.id]: !isExpanded }))}>
                <div className="flex items-center gap-2">
                  <span>{meal.emoji}</span>
                  <span className="text-sm font-medium text-[#0F172A]">{meal.label}</span>
                  {mealFoods.length > 0 && <span className="text-xs bg-[#F1F5F9] text-[#64748B] px-1.5 py-0.5 rounded-full">{mealFoods.length}</span>}
                </div>
                <div className="flex items-center gap-3">
                  {mealKcal > 0 && <span className="text-sm font-bold text-[#16A34A]">{mealKcal} kcal</span>}
                  <span className="text-[#94A3B8] text-xs">{isExpanded ? '▲' : '▼'}</span>
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-[#E2E8F0]">
                  {mealFoods.map(f => (
                    <div key={f.id} className="flex items-center justify-between px-4 py-2.5 border-b border-[#F1F5F9] hover:bg-[#F8FAFC]">
                      <div className="flex-1 min-w-0 mr-3">
                        <div className="text-sm text-[#0F172A] truncate">{f.food_name}</div>
                        <div className="text-xs text-[#94A3B8]">{f.quantity_grams}g · P:{parseFloat(f.protein).toFixed(1)} C:{parseFloat(f.carbs).toFixed(1)} G:{parseFloat(f.fat).toFixed(1)}</div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm font-semibold text-[#16A34A]">{f.calories}</span>
                        <button onClick={() => removeFoodEntry(f.id)} className="text-[#CBD5E1] hover:text-red-400 w-6 h-6 flex items-center justify-center">✕</button>
                      </div>
                    </div>
                  ))}
                  {!isAdding ? (
                    <button onClick={() => setAddingToMeal(meal.id)}
                      className="w-full py-3 px-4 text-sm text-[#16A34A] font-medium hover:bg-[#16A34A]/5 flex items-center justify-center gap-1">
                      <span className="text-lg leading-none">+</span> Añadir alimento
                    </button>
                  ) : (
                    <MealInputPro mealId={meal.id} addFoodEntry={addFoodEntry} addFoodEntries={addFoodEntries} onClose={() => setAddingToMeal(null)}/>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── SECCIÓN 3: Ejercicio del día ────────────────────────────── */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E2E8F0]">
          <h3 className="text-sm font-semibold text-[#0F172A]">Ejercicio de hoy</h3>
          <button onClick={() => setShowWorkoutModal(true)}
            className="text-xs bg-[#E2E8F0] hover:bg-[#CBD5E1] text-[#64748B] px-3 py-1.5 rounded-lg font-medium">
            + Libre
          </button>
        </div>

        {hasTodayWorkout && isToday && (
          <div className="px-4 py-3 border-b border-[#F1F5F9] bg-[#16A34A]/5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-[#0F172A]">💪 {todayPlanSession?.name || 'Entrenamiento planificado'}</div>
                <div className="text-xs text-[#64748B] mt-0.5">
                  {todayPlanSession?.exercises?.length || 0} ejercicios · {todayPlanSession?.duration_minutes || 60} min
                </div>
              </div>
              <button onClick={onGoToWorkout}
                className="text-xs bg-[#16A34A] hover:bg-[#15803D] text-white px-3 py-2 rounded-lg font-semibold shrink-0 ml-3">
                Ir a entrenar →
              </button>
            </div>
          </div>
        )}

        {workoutEntries.length === 0 ? (
          <div className="py-5 text-center text-sm text-[#94A3B8]">Sin actividad libre registrada hoy</div>
        ) : (
          workoutEntries.map(w => (
            <div key={w.id} className="flex items-center justify-between px-4 py-3 border-b border-[#F1F5F9] last:border-0 hover:bg-[#F8FAFC]">
              <div>
                <div className="text-sm font-medium text-[#0F172A]">{WORKOUT_TYPE_LABELS[w.workout_type] || w.workout_type}</div>
                <div className="text-xs text-[#94A3B8]">{w.duration_minutes} min · {w.calories_burned} kcal quemadas</div>
              </div>
              <button onClick={() => removeWorkoutEntry(w.id)} className="text-[#CBD5E1] hover:text-red-400 w-7 h-7 flex items-center justify-center">✕</button>
            </div>
          ))
        )}
      </div>

      {/* ── SECCIÓN 4: Feedback IA (siempre visible) ────────────────── */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
        <h3 className="text-sm font-semibold text-[#0F172A] mb-3">¿Qué dice FORJA sobre tu día?</h3>
        <button onClick={getFeedback} disabled={loadingFeedback}
          className="w-full bg-[#0F172A] hover:bg-[#1E293B] text-white py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
          {loadingFeedback
            ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Analizando...</>
            : '🤖 Ver feedback de la IA'}
        </button>
        {aiFeedback && (
          <div className={`mt-3 rounded-xl p-4 border space-y-2 ${
            aiFeedback.status === 'excellent' ? 'bg-[#16A34A]/10 border-[#16A34A]/30' :
            aiFeedback.status === 'good'      ? 'bg-green-50 border-green-200' :
            aiFeedback.status === 'attention' ? 'bg-orange-50 border-orange-200' :
            'bg-[#F8FAFC] border-[#E2E8F0]'
          }`}>
            <p className="text-sm text-[#0F172A] leading-relaxed">{aiFeedback.message}</p>
            {aiFeedback.nextMealSuggestion && <p className="text-xs text-[#64748B]"><span className="font-semibold">Próxima comida:</span> {aiFeedback.nextMealSuggestion}</p>}
            {aiFeedback.motivation && <p className="text-xs text-[#16A34A] font-medium italic">{aiFeedback.motivation}</p>}
          </div>
        )}
      </div>

      {/* Modal actividad libre */}
      {showWorkoutModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end justify-center p-4" onClick={() => setShowWorkoutModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-[#0F172A]">Registrar actividad libre</h3>
              <button onClick={() => setShowWorkoutModal(false)} className="text-[#94A3B8] text-2xl leading-none">✕</button>
            </div>
            <div className="flex bg-[#F1F5F9] rounded-xl p-1">
              {[['ai','✨ IA'],['manual','⚙️ Manual']].map(([m, lbl]) => (
                <button key={m} onClick={() => setWorkoutModalMode(m)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${workoutModalMode === m ? 'bg-white text-[#0F172A] shadow-sm' : 'text-[#64748B]'}`}
                >{lbl}</button>
              ))}
            </div>
            {workoutModalMode === 'ai' ? (
              <AIActivity userWeight={userData?.current_weight || 75}
                onAddAll={async (activities) => {
                  for (const act of activities) await addWorkoutEntry({ workout_type: act.name, duration_minutes: act.duration_minutes, calories_burned: act.calories_burned })
                  setShowWorkoutModal(false)
                }}
              />
            ) : (
              <>
                <div>
                  <label className="text-xs text-[#64748B] mb-1.5 block">Tipo de actividad</label>
                  <select value={newWorkout.type} onChange={e => setNewWorkout(w => ({ ...w, type: e.target.value }))}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm focus:outline-none">
                    {Object.entries(WORKOUT_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[#64748B] mb-1.5 block">Duración (minutos)</label>
                  <input type="number" value={newWorkout.duration} onChange={e => setNewWorkout(w => ({ ...w, duration: Number(e.target.value) }))}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm focus:outline-none"/>
                </div>
                <div className="bg-[#F8FAFC] rounded-xl p-3 text-center text-sm">
                  <span className="text-[#64748B]">Estimación: </span>
                  <span className="text-[#16A34A] font-bold">{estimateCaloriesBurned(newWorkout.type, newWorkout.duration, userData?.current_weight || 75)} kcal</span>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowWorkoutModal(false)} className="flex-1 py-3 rounded-xl bg-[#E2E8F0] text-sm text-[#64748B]">Cancelar</button>
                  <button onClick={handleAddWorkout} disabled={savingWorkout}
                    className="flex-1 py-3 rounded-xl bg-[#16A34A] text-white font-semibold text-sm disabled:opacity-50">
                    {savingWorkout ? 'Guardando...' : 'Registrar ✓'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
