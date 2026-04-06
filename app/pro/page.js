'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DAYS_ES, GOALS_ES, estimateCaloriesBurned } from '@/lib/utils'

// ─── Base de alimentos comunes en España ─────────────────────────────────────
const FOOD_DB = [
  // Proteínas
  { name: 'Pechuga de pollo', kcal: 165, protein: 31, carbs: 0, fat: 3.6 },
  { name: 'Atún al natural (lata)', kcal: 116, protein: 26, carbs: 0, fat: 1 },
  { name: 'Salmón', kcal: 208, protein: 20, carbs: 0, fat: 13 },
  { name: 'Huevo entero', kcal: 155, protein: 13, carbs: 1.1, fat: 11, unit: 'ud', per: 60 },
  { name: 'Clara de huevo', kcal: 52, protein: 11, carbs: 0.7, fat: 0.2 },
  { name: 'Ternera magra', kcal: 158, protein: 26, carbs: 0, fat: 5.4 },
  { name: 'Jamón york', kcal: 107, protein: 17, carbs: 2, fat: 3.5 },
  { name: 'Pavo en fiambre', kcal: 109, protein: 20, carbs: 1, fat: 3 },
  { name: 'Merluza', kcal: 82, protein: 17, carbs: 0, fat: 1 },
  // Lácteos
  { name: 'Leche entera', kcal: 61, protein: 3.2, carbs: 4.7, fat: 3.3 },
  { name: 'Leche desnatada', kcal: 35, protein: 3.4, carbs: 4.9, fat: 0.2 },
  { name: 'Yogur natural', kcal: 59, protein: 3.8, carbs: 4.7, fat: 3.3, unit: 'ud', per: 125 },
  { name: 'Queso fresco 0%', kcal: 49, protein: 9, carbs: 2.7, fat: 0.2 },
  { name: 'Requesón', kcal: 74, protein: 11, carbs: 3.6, fat: 1.5 },
  { name: 'Queso manchego', kcal: 390, protein: 27, carbs: 0.5, fat: 32 },
  // Carbohidratos
  { name: 'Arroz blanco (cocido)', kcal: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  { name: 'Pasta cocida', kcal: 131, protein: 5, carbs: 25, fat: 1.1 },
  { name: 'Pan de molde integral', kcal: 247, protein: 9, carbs: 41, fat: 4, unit: 'rebanada', per: 30 },
  { name: 'Avena en copos', kcal: 389, protein: 17, carbs: 66, fat: 7 },
  { name: 'Patata cocida', kcal: 87, protein: 1.9, carbs: 20, fat: 0.1 },
  { name: 'Boniato', kcal: 86, protein: 1.6, carbs: 20, fat: 0.1 },
  { name: 'Pan baguette', kcal: 270, protein: 9, carbs: 53, fat: 1.6 },
  // Verduras
  { name: 'Brócoli', kcal: 34, protein: 2.8, carbs: 7, fat: 0.4 },
  { name: 'Espinacas', kcal: 23, protein: 2.9, carbs: 3.6, fat: 0.4 },
  { name: 'Tomate', kcal: 18, protein: 0.9, carbs: 3.9, fat: 0.2 },
  { name: 'Lechuga', kcal: 15, protein: 1.4, carbs: 2.9, fat: 0.2 },
  { name: 'Pimiento rojo', kcal: 31, protein: 1, carbs: 6, fat: 0.3 },
  { name: 'Zanahoria', kcal: 41, protein: 0.9, carbs: 10, fat: 0.2 },
  // Frutas
  { name: 'Plátano', kcal: 89, protein: 1.1, carbs: 23, fat: 0.3, unit: 'ud', per: 120 },
  { name: 'Manzana', kcal: 52, protein: 0.3, carbs: 14, fat: 0.2, unit: 'ud', per: 150 },
  { name: 'Naranja', kcal: 47, protein: 0.9, carbs: 12, fat: 0.1, unit: 'ud', per: 130 },
  { name: 'Fresas', kcal: 32, protein: 0.7, carbs: 7.7, fat: 0.3 },
  // Grasas saludables
  { name: 'Aceite de oliva', kcal: 884, protein: 0, carbs: 0, fat: 100 },
  { name: 'Aguacate', kcal: 160, protein: 2, carbs: 9, fat: 15, unit: 'ud', per: 150 },
  { name: 'Almendras', kcal: 579, protein: 21, carbs: 22, fat: 50 },
  { name: 'Nueces', kcal: 654, protein: 15, carbs: 14, fat: 65 },
  // Otros comunes
  { name: 'Lentejas cocidas', kcal: 116, protein: 9, carbs: 20, fat: 0.4 },
  { name: 'Garbanzos cocidos', kcal: 164, protein: 9, carbs: 27, fat: 2.6 },
  { name: 'Proteína en polvo (whey)', kcal: 370, protein: 75, carbs: 6, fat: 6, unit: 'scoop', per: 30 },
]

// ─── Componente MacroBar ──────────────────────────────────────────────────────
function MacroBar({ label, current, target, color }) {
  const pct = Math.min(100, Math.round((current / target) * 100))
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
function DashboardTab({ user, plan, userData, logs, weights }) {
  const todayLog = logs?.[logs.length - 1]
  const streak = logs?.filter(l => l.workout_done).length || 0
  const weightChange = weights?.length >= 2
    ? (weights[weights.length - 1].weight - weights[0].weight).toFixed(1)
    : null

  return (
    <div className="space-y-4">
      {/* Bienvenida */}
      <div>
        <h2 className="font-display text-4xl text-[#0F172A] tracking-wide" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
          BUENOS DÍAS 🔥
        </h2>
        <p className="text-[#64748B] text-sm mt-1">
          {userData ? GOALS_ES[userData.goal] || userData.goal : 'Tu plan está activo'}
        </p>
      </div>

      {/* Métricas rápidas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Puntuación', value: plan?.health_score || '–', unit: '/100', color: '#16A34A' },
          { label: 'Racha', value: streak, unit: 'días 🔥', color: '#15803D' },
          { label: 'Kcal objetivo', value: plan?.daily_calories || '–', unit: 'kcal', color: '#22C55E' },
          { label: 'Cambio peso', value: weightChange !== null ? (weightChange > 0 ? `+${weightChange}` : weightChange) : '–', unit: 'kg', color: weightChange < 0 ? '#22C55E' : '#15803D' },
        ].map((m) => (
          <div key={m.label} className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-4">
            <div className="text-[#64748B] text-xs mb-1">{m.label}</div>
            <div className="text-2xl font-bold" style={{ color: m.color }}>{m.value}</div>
            <div className="text-[#64748B] text-xs">{m.unit}</div>
          </div>
        ))}
      </div>

      {/* Calorías hoy */}
      {todayLog && (
        <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-5">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium text-[#0F172A]">Calorías hoy</span>
            <span className="text-xs text-[#64748B]">
              {todayLog.calories_consumed} / {plan?.daily_calories} kcal
            </span>
          </div>
          <div className="h-3 bg-[#E2E8F0] rounded-full overflow-hidden mb-4">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.min(100, Math.round((todayLog.calories_consumed / plan?.daily_calories) * 100))}%`,
                background: 'linear-gradient(90deg, #16A34A, #15803D)',
              }}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <MacroBar label="Proteína" current={todayLog.protein_consumed} target={plan?.protein_grams} color="#16A34A" />
            <MacroBar label="Carbos" current={todayLog.carbs_consumed} target={plan?.carbs_grams} color="#15803D" />
            <MacroBar label="Grasas" current={todayLog.fat_consumed} target={plan?.fat_grams} color="#22C55E" />
          </div>
        </div>
      )}

      {/* Progreso de peso — mini gráfico */}
      {weights?.length > 1 && (
        <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-5">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium text-[#0F172A]">Evolución de peso</span>
            <span className="text-xs text-[#22C55E]">
              {weightChange > 0 ? '+' : ''}{weightChange}kg
            </span>
          </div>
          <div className="flex items-end gap-1 h-16">
            {weights.slice(-14).map((w, i) => {
              const vals = weights.slice(-14).map(x => x.weight)
              const min = Math.min(...vals)
              const max = Math.max(...vals)
              const range = max - min || 1
              const pct = ((w.weight - min) / range) * 100
              return (
                <div key={i} className="flex-1 flex flex-col justify-end">
                  <div
                    className="rounded-sm bg-[#16A34A]/60 min-h-[4px] transition-all"
                    style={{ height: `${Math.max(8, pct)}%` }}
                  />
                </div>
              )
            })}
          </div>
          <div className="flex justify-between text-xs text-[#64748B] mt-2">
            <span>{weights[weights.length - 14]?.weight || weights[0].weight}kg</span>
            <span>{weights[weights.length - 1].weight}kg</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Tab: Tracker ─────────────────────────────────────────────────────────────
function TrackerTab({ user, plan, userData }) {
  const [date] = useState(new Date().toISOString().split('T')[0])
  const [foods, setFoods] = useState([])
  const [log, setLog] = useState(null)
  const [search, setSearch] = useState('')
  const [quantity, setQuantity] = useState(100)
  const [selectedFood, setSelectedFood] = useState(null)
  const [meal, setMeal] = useState('lunch')
  const [showWorkout, setShowWorkout] = useState(false)
  const [workout, setWorkout] = useState({ type: 'strength', duration: 60 })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`/api/tracker?date=${date}`)
      .then(r => r.json())
      .then(d => { setFoods(d.foods || []); setLog(d.log) })
  }, [date])

  const filtered = search.length > 1
    ? FOOD_DB.filter(f => f.name.toLowerCase().includes(search.toLowerCase())).slice(0, 6)
    : []

  const totalKcal = foods.reduce((s, f) => s + f.calories, 0)

  const addFood = async () => {
    if (!selectedFood) return
    const ratio = quantity / 100
    const entry = {
      food_name: selectedFood.name,
      quantity_grams: quantity,
      calories: Math.round(selectedFood.kcal * ratio),
      protein: parseFloat((selectedFood.protein * ratio).toFixed(1)),
      carbs: parseFloat((selectedFood.carbs * ratio).toFixed(1)),
      fat: parseFloat((selectedFood.fat * ratio).toFixed(1)),
      meal_type: meal,
    }
    setSaving(true)
    const res = await fetch('/api/tracker', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'food', date, ...entry }),
    })
    const data = await res.json()
    if (data.entry) setFoods(prev => [...prev, data.entry])
    setSearch(''); setSelectedFood(null); setQuantity(100)
    setSaving(false)

    // Refresh log
    fetch(`/api/tracker?date=${date}`).then(r => r.json()).then(d => setLog(d.log))
  }

  const removeFood = async (id) => {
    await fetch('/api/tracker', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, date }),
    })
    setFoods(prev => prev.filter(f => f.id !== id))
    fetch(`/api/tracker?date=${date}`).then(r => r.json()).then(d => setLog(d.log))
  }

  const logWorkout = async () => {
    const burned = estimateCaloriesBurned(workout.type, workout.duration, userData?.current_weight || 75)
    setSaving(true)
    await fetch('/api/tracker', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'workout', date, workout_type: workout.type, workout_duration_minutes: workout.duration, calories_burned: burned }),
    })
    setShowWorkout(false)
    fetch(`/api/tracker?date=${date}`).then(r => r.json()).then(d => setLog(d.log))
    setSaving(false)
  }

  return (
    <div className="space-y-4">
      {/* Balance del día */}
      <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-5">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-2xl font-bold text-[#16A34A]">{totalKcal}</div>
            <div className="text-xs text-[#64748B]">Consumidas</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-[#22C55E]">{log?.calories_burned || 0}</div>
            <div className="text-xs text-[#64748B]">Quemadas</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-[#0F172A]">
              {plan?.daily_calories - totalKcal + (log?.calories_burned || 0)}
            </div>
            <div className="text-xs text-[#64748B]">Restantes</div>
          </div>
        </div>
      </div>

      {/* Añadir alimento */}
      <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-5 space-y-3">
        <h3 className="font-semibold text-sm text-[#0F172A]">Registrar alimento</h3>

        <div className="relative">
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setSelectedFood(null) }}
            placeholder="Buscar alimento... (ej: pollo, arroz)"
            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#16A34A] rounded-xl px-4 py-2.5 text-sm text-[#0F172A] placeholder-[#64748B] focus:outline-none"
          />
          {filtered.length > 0 && !selectedFood && (
            <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl overflow-hidden shadow-xl">
              {filtered.map(f => (
                <button
                  key={f.name}
                  onClick={() => { setSelectedFood(f); setSearch(f.name) }}
                  className="w-full text-left px-4 py-2.5 hover:bg-[#E2E8F0] transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[#0F172A]">{f.name}</span>
                    <span className="text-xs text-[#64748B]">{f.kcal} kcal/100g</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedFood && (
          <div className="space-y-3">
            <div className="bg-[#16A34A]/10 border border-[#16A34A]/20 rounded-xl p-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-[#0F172A]">{selectedFood.name}</span>
                <span className="text-sm text-[#16A34A] font-bold">
                  {Math.round(selectedFood.kcal * quantity / 100)} kcal
                </span>
              </div>
              <div className="flex gap-3 text-xs text-[#64748B] mt-1">
                <span>P: {(selectedFood.protein * quantity / 100).toFixed(1)}g</span>
                <span>C: {(selectedFood.carbs * quantity / 100).toFixed(1)}g</span>
                <span>G: {(selectedFood.fat * quantity / 100).toFixed(1)}g</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#64748B] mb-1 block">Cantidad (g)</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={e => setQuantity(Number(e.target.value))}
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm text-[#0F172A] focus:outline-none focus:border-[#16A34A]"
                />
              </div>
              <div>
                <label className="text-xs text-[#64748B] mb-1 block">Comida</label>
                <select
                  value={meal}
                  onChange={e => setMeal(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm text-[#0F172A] focus:outline-none"
                >
                  <option value="breakfast">Desayuno</option>
                  <option value="lunch">Comida</option>
                  <option value="dinner">Cena</option>
                  <option value="snack">Snack</option>
                </select>
              </div>
            </div>

            <button
              onClick={addFood}
              disabled={saving}
              className="w-full bg-[#16A34A] hover:bg-[#15803D] text-white font-semibold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Añadir alimento +'}
            </button>
          </div>
        )}
      </div>

      {/* Lista de alimentos del día */}
      {foods.length > 0 && (
        <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E2E8F0]">
            <h3 className="text-sm font-semibold text-[#0F172A]">Lo que has comido hoy</h3>
          </div>
          {foods.map(f => (
            <div key={f.id} className="flex items-center justify-between px-4 py-3 border-b border-[#E2E8F0] last:border-0 hover:bg-[#E2E8F0]/30 transition-colors">
              <div>
                <div className="text-sm text-[#0F172A]">{f.food_name}</div>
                <div className="text-xs text-[#64748B]">{f.quantity_grams}g · P:{f.protein}g C:{f.carbs}g G:{f.fat}g</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-[#16A34A]">{f.calories} kcal</span>
                <button onClick={() => removeFood(f.id)} className="text-[#64748B] hover:text-red-400 text-xs transition-colors">✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Registrar entrenamiento */}
      {!log?.workout_done ? (
        <button
          onClick={() => setShowWorkout(true)}
          className="w-full bg-[#FFFFFF] border border-dashed border-[#E2E8F0] hover:border-[#16A34A] rounded-xl p-4 text-sm text-[#64748B] hover:text-[#0F172A] transition-all"
        >
          + Registrar entrenamiento de hoy
        </button>
      ) : (
        <div className="bg-[#22C55E]/10 border border-[#22C55E]/20 rounded-xl p-4 flex items-center gap-3">
          <span className="text-xl">💪</span>
          <div>
            <div className="text-sm font-medium text-[#0F172A]">Entrenamiento registrado</div>
            <div className="text-xs text-[#64748B]">{log.workout_type} · {log.workout_duration_minutes}min · {log.calories_burned} kcal quemadas</div>
          </div>
          <span className="ml-auto text-[#22C55E]">✓</span>
        </div>
      )}

      {/* Modal workout */}
      {showWorkout && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-6 w-full max-w-md space-y-4">
            <h3 className="font-semibold text-[#0F172A]">Registrar entrenamiento</h3>
            <div>
              <label className="text-xs text-[#64748B] mb-1 block">Tipo de actividad</label>
              <select
                value={workout.type}
                onChange={e => setWorkout(w => ({ ...w, type: e.target.value }))}
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm text-[#0F172A] focus:outline-none"
              >
                <option value="strength">Fuerza / Musculación</option>
                <option value="running">Carrera</option>
                <option value="cycling">Ciclismo</option>
                <option value="swimming">Natación</option>
                <option value="hiit">HIIT</option>
                <option value="yoga">Yoga / Stretching</option>
                <option value="walking">Caminar</option>
                <option value="other">Otro</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-[#64748B] mb-1 block">Duración (minutos)</label>
              <input
                type="number"
                value={workout.duration}
                onChange={e => setWorkout(w => ({ ...w, duration: Number(e.target.value) }))}
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm text-[#0F172A] focus:outline-none"
              />
            </div>
            <div className="bg-[#F8FAFC] rounded-xl p-3 text-center">
              <span className="text-[#64748B] text-sm">Estimación: </span>
              <span className="text-[#16A34A] font-bold">
                {estimateCaloriesBurned(workout.type, workout.duration, userData?.current_weight || 75)} kcal quemadas
              </span>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowWorkout(false)} className="flex-1 py-3 rounded-xl bg-[#E2E8F0] text-sm text-[#64748B] hover:text-[#0F172A] transition-colors">
                Cancelar
              </button>
              <button onClick={logWorkout} disabled={saving} className="flex-1 py-3 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white font-semibold text-sm transition-colors disabled:opacity-50">
                {saving ? 'Guardando...' : 'Registrar ✓'}
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

      {/* Tips del plan */}
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
      {/* Mensajes */}
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

      {/* Sugerencias rápidas */}
      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {SUGGESTIONS.map(s => (
            <button
              key={s}
              onClick={() => { setInput(s); }}
              className="text-xs bg-[#FFFFFF] border border-[#E2E8F0] hover:border-[#16A34A] text-[#64748B] hover:text-[#0F172A] px-3 py-1.5 rounded-full transition-all"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
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
        <p className="text-xs text-[#64748B]">Ajusta las variables y ve cuándo alcanzarías tu objetivo según diferentes ritmos.</p>
      </div>

      {/* Controles */}
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
              type="range"
              min={s.min}
              max={s.max}
              step={s.step}
              value={scenario[s.key]}
              onChange={e => setScenario(prev => ({ ...prev, [s.key]: Number(e.target.value) }))}
              style={{ accentColor: '#16A34A' }}
              className="w-full"
            />
          </div>
        ))}
      </div>

      {/* Resultado */}
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
            <div className="text-xs text-[#64748B] mb-1">Fecha estimada de llegada</div>
            <div className="text-lg font-semibold text-[#22C55E]">{estimatedDate}</div>
          </div>
        )}

        {!weeksNeeded && (
          <p className="text-sm text-[#64748B] text-center">
            Aumenta el déficit calórico o añade más entrenamientos para ver una proyección.
          </p>
        )}

        <div className="mt-4 pt-4 border-t border-[#E2E8F0] text-xs text-[#64748B] leading-relaxed">
          ⚠️ Estimación basada en 7.700 kcal = 1kg. Los resultados reales varían según metabolismo, adherencia y otros factores.
        </div>
      </div>
    </div>
  )
}

// ─── Página principal Pro ─────────────────────────────────────────────────────
function ProContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [user, setUser] = useState(null)
  const [plan, setPlan] = useState(null)
  const [userData, setUserData] = useState(null)
  const [logs, setLogs] = useState([])
  const [weights, setWeights] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return // auth desactivada temporalmente
      setUser(user)

      const [{ data: plan }, { data: ud }, logsRes, weightsRes] = await Promise.all([
        supabase.from('plans').select('*').eq('user_id', user.id).eq('is_active', true).order('created_at', { ascending: false }).limit(1).single(),
        supabase.from('user_data').select('*').eq('user_id', user.id).single(),
        fetch('/api/tracker?range=week').then(r => r.json()),
        supabase.from('weight_logs').select('*').eq('user_id', user.id).order('logged_at').limit(30),
      ])

      setPlan(plan)
      setUserData(ud)
      setLogs(logsRes.logs || [])
      setWeights(weightsRes.data || [])
      setLoading(false)
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

          {/* Tabs */}
          <div className="flex overflow-x-auto gap-1 pb-2 scrollbar-hide">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-[#16A34A] text-white'
                    : 'text-[#64748B] hover:text-[#0F172A]'
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
        {activeTab === 'dashboard' && <DashboardTab user={user} plan={plan} userData={userData} logs={logs} weights={weights} />}
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
