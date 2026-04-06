'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

// ─── Base de datos de alimentos (kcal / proteína / carbos / grasa por 100g) ──
const FOODS = [
  { name: 'Pechuga de pollo', cal: 165, p: 31, c: 0,    f: 3.6 },
  { name: 'Muslo de pollo',   cal: 209, p: 26, c: 0,    f: 11  },
  { name: 'Huevo entero',     cal: 155, p: 13, c: 1.1,  f: 11  },
  { name: 'Clara de huevo',   cal: 52,  p: 11, c: 0.7,  f: 0.2 },
  { name: 'Atún en agua',     cal: 116, p: 26, c: 0,    f: 1   },
  { name: 'Salmón fresco',    cal: 208, p: 20, c: 0,    f: 13  },
  { name: 'Sardinas',         cal: 208, p: 25, c: 0,    f: 12  },
  { name: 'Ternera magra',    cal: 180, p: 26, c: 0,    f: 8   },
  { name: 'Lomo de cerdo',    cal: 190, p: 25, c: 0,    f: 10  },
  { name: 'Jamón serrano',    cal: 241, p: 30, c: 0,    f: 13  },
  { name: 'Gambas',           cal: 85,  p: 18, c: 1,    f: 1   },
  { name: 'Tofu',             cal: 76,  p: 8,  c: 2,    f: 4   },
  { name: 'Proteína whey',    cal: 400, p: 80, c: 8,    f: 6   },
  { name: 'Leche entera',     cal: 61,  p: 3.2,c: 4.8,  f: 3.3 },
  { name: 'Leche semidesnatada', cal: 46, p: 3.4, c: 4.9, f: 1.6 },
  { name: 'Yogur natural',    cal: 59,  p: 3.5,c: 4.7,  f: 2.5 },
  { name: 'Yogur griego',     cal: 97,  p: 9,  c: 4,    f: 5   },
  { name: 'Queso fresco',     cal: 90,  p: 11, c: 2,    f: 4   },
  { name: 'Requesón',         cal: 72,  p: 11, c: 3,    f: 1.5 },
  { name: 'Queso manchego',   cal: 392, p: 26, c: 0,    f: 32  },
  { name: 'Arroz blanco cocido', cal: 130, p: 2.7, c: 28, f: 0.3 },
  { name: 'Pasta cocida',     cal: 131, p: 5,  c: 25,   f: 1   },
  { name: 'Pan blanco',       cal: 265, p: 9,  c: 51,   f: 2   },
  { name: 'Pan integral',     cal: 247, p: 9,  c: 41,   f: 3   },
  { name: 'Patata cocida',    cal: 77,  p: 2,  c: 17,   f: 0.1 },
  { name: 'Boniato cocido',   cal: 86,  p: 1.6,c: 20,   f: 0.1 },
  { name: 'Avena',            cal: 379, p: 13, c: 68,   f: 6   },
  { name: 'Quinoa cocida',    cal: 120, p: 4.4,c: 22,   f: 1.9 },
  { name: 'Lentejas cocidas', cal: 116, p: 9,  c: 20,   f: 0.4 },
  { name: 'Garbanzos cocidos',cal: 164, p: 9,  c: 27,   f: 2.6 },
  { name: 'Lechuga',          cal: 15,  p: 1.4,c: 2.2,  f: 0.2 },
  { name: 'Tomate',           cal: 18,  p: 0.9,c: 3.9,  f: 0.2 },
  { name: 'Pepino',           cal: 15,  p: 0.7,c: 3.6,  f: 0.1 },
  { name: 'Brócoli',          cal: 34,  p: 2.8,c: 7,    f: 0.4 },
  { name: 'Espinacas',        cal: 23,  p: 2.9,c: 3.6,  f: 0.4 },
  { name: 'Zanahoria',        cal: 41,  p: 0.9,c: 10,   f: 0.2 },
  { name: 'Pimiento rojo',    cal: 31,  p: 1,  c: 6,    f: 0.3 },
  { name: 'Cebolla',          cal: 40,  p: 1.1,c: 9,    f: 0.1 },
  { name: 'Champiñones',      cal: 22,  p: 3.1,c: 3.3,  f: 0.3 },
  { name: 'Aguacate',         cal: 160, p: 2,  c: 9,    f: 15  },
  { name: 'Manzana',          cal: 52,  p: 0.3,c: 14,   f: 0.2 },
  { name: 'Plátano',          cal: 89,  p: 1.1,c: 23,   f: 0.3 },
  { name: 'Naranja',          cal: 47,  p: 0.9,c: 12,   f: 0.1 },
  { name: 'Fresas',           cal: 32,  p: 0.7,c: 7.7,  f: 0.3 },
  { name: 'Arándanos',        cal: 57,  p: 0.7,c: 14,   f: 0.3 },
  { name: 'Kiwi',             cal: 61,  p: 1.1,c: 15,   f: 0.5 },
  { name: 'Aceite de oliva',  cal: 884, p: 0,  c: 0,    f: 100 },
  { name: 'Almendras',        cal: 579, p: 21, c: 22,   f: 50  },
  { name: 'Nueces',           cal: 654, p: 15, c: 14,   f: 65  },
  { name: 'Mantequilla cacahuete', cal: 588, p: 25, c: 20, f: 50 },
  { name: 'Chocolate negro 70%', cal: 600, p: 8, c: 46, f: 44 },
  { name: 'Miel',             cal: 304, p: 0.3,c: 82,   f: 0   },
]

const WORKOUT_TYPES = [
  { value: 'weights',   label: 'Pesas / Gym',    met: 5.0  },
  { value: 'running',   label: 'Correr',          met: 9.8  },
  { value: 'hiit',      label: 'HIIT',            met: 10.0 },
  { value: 'cycling',   label: 'Ciclismo',        met: 7.5  },
  { value: 'swimming',  label: 'Natación',        met: 7.0  },
  { value: 'walking',   label: 'Caminar',         met: 3.5  },
  { value: 'elliptical',label: 'Elíptica',        met: 5.0  },
  { value: 'yoga',      label: 'Yoga / Pilates',  met: 2.5  },
  { value: 'other',     label: 'Otro',            met: 5.0  },
]

const MEALS = [
  { key: 'breakfast',       label: 'Desayuno',      emoji: '🌅' },
  { key: 'morning_snack',   label: 'Media mañana',  emoji: '🍎' },
  { key: 'lunch',           label: 'Comida',        emoji: '🍽️' },
  { key: 'afternoon_snack', label: 'Merienda',      emoji: '🍊' },
  { key: 'dinner',          label: 'Cena',          emoji: '🌙' },
]

const SLEEP_EMOJIS = ['😴', '😑', '🙂', '😊', '🔥']

const EMPTY_DATA = () => ({
  checkin: { weight: '', sleep_hours: 7, sleep_quality: 2 },
  meals: { breakfast: [], morning_snack: [], lunch: [], afternoon_snack: [], dinner: [] },
  workouts: [],
})

function todayKey() {
  return `forja_tracker_${new Date().toISOString().split('T')[0]}`
}

function r1(n) { return Math.round(n * 10) / 10 }

function mealMacros(items) {
  return items.reduce(
    (a, it) => ({ cal: a.cal + it.calories, p: a.p + it.protein, c: a.c + it.carbs, f: a.f + it.fat }),
    { cal: 0, p: 0, c: 0, f: 0 }
  )
}

// ─── FoodSearch ───────────────────────────────────────────────────────────────
function FoodSearch({ onAdd }) {
  const [query, setQuery]       = useState('')
  const [selected, setSelected] = useState(null)
  const [grams, setGrams]       = useState('100')

  const results = query.length >= 2
    ? FOODS.filter(f => f.name.toLowerCase().includes(query.toLowerCase())).slice(0, 6)
    : []

  const handleAdd = () => {
    if (!selected || !grams || Number(grams) <= 0) return
    const g = Number(grams)
    onAdd({
      id: Date.now(),
      name: selected.name,
      grams: g,
      calories: r1(selected.cal * g / 100),
      protein:  r1(selected.p   * g / 100),
      carbs:    r1(selected.c   * g / 100),
      fat:      r1(selected.f   * g / 100),
    })
    setQuery(''); setSelected(null); setGrams('100')
  }

  return (
    <div className="mt-3 space-y-2">
      {!selected ? (
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar alimento..."
            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm text-[#0F172A] focus:outline-none focus:border-[#16A34A] transition-colors"
          />
          {results.length > 0 && (
            <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-white border border-[#E2E8F0] rounded-xl shadow-lg overflow-hidden">
              {results.map(f => (
                <button
                  key={f.name}
                  onClick={() => { setSelected(f); setQuery(f.name) }}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-[#F0FDF4] transition-colors flex items-center justify-between"
                >
                  <span className="text-[#0F172A]">{f.name}</span>
                  <span className="text-[#94A3B8] text-xs">{f.cal} kcal/100g</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[#15803D] truncate pr-2">{selected.name}</span>
            <button onClick={() => { setSelected(null); setQuery('') }} className="text-[#94A3B8] text-xs hover:text-[#0F172A] flex-shrink-0">✕</button>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="number"
                inputMode="decimal"
                value={grams}
                onChange={e => setGrams(e.target.value)}
                min="1"
                className="w-full bg-white border border-[#BBF7D0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#16A34A]"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#94A3B8]">g</span>
            </div>
            <span className="text-xs text-[#64748B] flex-shrink-0">
              = {r1(selected.cal * Number(grams || 0) / 100)} kcal
            </span>
            <button
              onClick={handleAdd}
              className="bg-[#16A34A] hover:bg-[#15803D] text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors flex-shrink-0"
            >
              +
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── MealAccordion ────────────────────────────────────────────────────────────
function MealAccordion({ mealKey, label, emoji, items, onAdd, onRemove }) {
  const [open, setOpen] = useState(false)
  const mac = mealMacros(items)

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0]">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-[#F8FAFC] transition-colors rounded-2xl"
      >
        <span className="text-xl">{emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm text-[#0F172A]">{label}</div>
          {mac.cal > 0 && (
            <div className="text-xs text-[#64748B] mt-0.5">
              {Math.round(mac.cal)} kcal · P {Math.round(mac.p)}g · C {Math.round(mac.c)}g · G {Math.round(mac.f)}g
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {items.length > 0 && (
            <span className="text-xs font-bold text-white bg-[#16A34A] rounded-full w-5 h-5 flex items-center justify-center">
              {items.length}
            </span>
          )}
          <span className="text-[#CBD5E1] text-xs">{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-[#F1F5F9]">
          {items.length > 0 && (
            <div className="mt-3 space-y-2">
              {items.map(item => (
                <div key={item.id} className="flex items-center justify-between bg-[#F8FAFC] rounded-xl px-3 py-2.5">
                  <div className="flex-1 min-w-0 mr-2">
                    <div className="text-sm font-medium text-[#0F172A] truncate">{item.name}</div>
                    <div className="text-xs text-[#94A3B8]">
                      {item.grams}g · {Math.round(item.calories)} kcal · P{Math.round(item.protein)} C{Math.round(item.carbs)} G{Math.round(item.fat)}
                    </div>
                  </div>
                  <button
                    onClick={() => onRemove(item.id)}
                    className="text-[#CBD5E1] hover:text-[#DC2626] text-xl leading-none transition-colors flex-shrink-0"
                  >
                    ×
                  </button>
                </div>
              ))}
              {/* Macros totales de la comida */}
              <div className="flex gap-2 pt-1">
                {[
                  { label: 'P', val: Math.round(mac.p), color: '#16A34A' },
                  { label: 'C', val: Math.round(mac.c), color: '#2563EB' },
                  { label: 'G', val: Math.round(mac.f), color: '#D97706' },
                ].map(m => (
                  <span key={m.label} className="flex-1 text-center text-xs font-semibold rounded-lg py-1" style={{ backgroundColor: `${m.color}15`, color: m.color }}>
                    {m.label} {m.val}g
                  </span>
                ))}
              </div>
            </div>
          )}
          <FoodSearch onAdd={onAdd} />
        </div>
      )}
    </div>
  )
}

// ─── WorkoutModal ─────────────────────────────────────────────────────────────
function WorkoutModal({ show, onClose, onAdd, userWeight }) {
  const [type, setType]         = useState('weights')
  const [duration, setDuration] = useState(45)

  if (!show) return null

  const wt = WORKOUT_TYPES.find(w => w.value === type)
  const cal = Math.round(wt.met * (userWeight || 75) * (duration / 60))

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-[#0F172A] text-lg">Añadir entrenamiento</h3>
          <button onClick={onClose} className="text-[#94A3B8] hover:text-[#0F172A] text-2xl leading-none transition-colors">✕</button>
        </div>

        <div className="space-y-5">
          <div>
            <label className="text-xs text-[#64748B] font-semibold uppercase tracking-wider mb-2 block">Actividad</label>
            <div className="grid grid-cols-3 gap-2">
              {WORKOUT_TYPES.map(w => (
                <button
                  key={w.value}
                  onClick={() => setType(w.value)}
                  className={`py-2 px-1 rounded-xl text-xs font-medium transition-all ${
                    type === w.value
                      ? 'bg-[#16A34A] text-white shadow-sm'
                      : 'bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]'
                  }`}
                >
                  {w.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-[#64748B] font-semibold uppercase tracking-wider mb-2 block">
              Duración: <span className="text-[#0F172A] normal-case font-bold">{duration} min</span>
            </label>
            <input
              type="range"
              min={10} max={180} step={5}
              value={duration}
              onChange={e => setDuration(Number(e.target.value))}
              className="w-full accent-[#16A34A]"
            />
            <div className="flex justify-between text-xs text-[#94A3B8] mt-1"><span>10 min</span><span>180 min</span></div>
          </div>

          <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-2xl p-4 text-center">
            <div className="text-4xl font-bold text-[#16A34A]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
              ~{cal} kcal
            </div>
            <div className="text-xs text-[#64748B] mt-0.5">gasto estimado</div>
          </div>

          <button
            onClick={() => {
              onAdd({ id: Date.now(), type, label: wt.label, duration_minutes: duration, calories_burned: cal })
              onClose()
            }}
            className="w-full bg-[#16A34A] hover:bg-[#15803D] text-white font-bold py-4 rounded-xl transition-colors"
          >
            Guardar entrenamiento
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── BottomBar ────────────────────────────────────────────────────────────────
function BottomBar({ consumed, burned, target }) {
  const net  = consumed - burned
  const pct  = target > 0 ? Math.min((consumed / target) * 100, 100) : 0
  const over = target > 0 && consumed > target

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E2E8F0] shadow-[0_-4px_24px_rgba(0,0,0,0.08)] px-4 pt-3 pb-5">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className={`font-bold ${over ? 'text-[#DC2626]' : 'text-[#16A34A]'}`}>
            {Math.round(consumed)} kcal consumidas
          </span>
          <span className="text-[#94A3B8]">obj. {target} kcal</span>
        </div>
        <div className="h-2.5 bg-[#E2E8F0] rounded-full overflow-hidden mb-3">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              backgroundColor: over ? '#DC2626' : pct > 85 ? '#D97706' : '#16A34A',
            }}
          />
        </div>
        <div className="grid grid-cols-3 gap-1 text-center">
          <div>
            <div className="text-base font-bold text-[#0F172A]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>{Math.round(consumed)}</div>
            <div className="text-[10px] text-[#94A3B8] uppercase tracking-wide">Consumidas</div>
          </div>
          <div>
            <div className="text-base font-bold text-[#2563EB]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>{Math.round(burned)}</div>
            <div className="text-[10px] text-[#94A3B8] uppercase tracking-wide">Quemadas</div>
          </div>
          <div>
            <div className={`text-base font-bold ${net <= target ? 'text-[#0F172A]' : 'text-[#DC2626]'}`} style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
              {Math.round(net)}
            </div>
            <div className="text-[10px] text-[#94A3B8] uppercase tracking-wide">Neto</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── TrackerPage ──────────────────────────────────────────────────────────────
export default function TrackerPage() {
  const router = useRouter()
  const [data, setData]               = useState(EMPTY_DATA())
  const [plan, setPlan]               = useState(null)
  const [userWeight, setUserWeight]   = useState(75)
  const [mounted, setMounted]         = useState(false)
  const [showWorkout, setShowWorkout] = useState(false)
  const [checkinSaved, setCheckinSaved] = useState(false)

  // Load from localStorage
  useEffect(() => {
    setMounted(true)
    try {
      const saved = localStorage.getItem(todayKey())
      if (saved) setData(JSON.parse(saved))
    } catch {}
    try {
      const savedPlan = localStorage.getItem('forja_plan_preview')
      if (savedPlan) setPlan(JSON.parse(savedPlan))
    } catch {}
    try {
      const od = JSON.parse(localStorage.getItem('forja_onboarding_data') || '{}')
      if (od.current_weight) setUserWeight(Number(od.current_weight))
    } catch {}
  }, [])

  // Auto-save on every change
  useEffect(() => {
    if (!mounted) return
    localStorage.setItem(todayKey(), JSON.stringify(data))
  }, [data, mounted])

  const addFood = (mealKey, item) =>
    setData(d => ({ ...d, meals: { ...d.meals, [mealKey]: [...d.meals[mealKey], item] } }))

  const removeFood = (mealKey, id) =>
    setData(d => ({ ...d, meals: { ...d.meals, [mealKey]: d.meals[mealKey].filter(i => i.id !== id) } }))

  const addWorkout = (w) =>
    setData(d => ({ ...d, workouts: [...d.workouts, w] }))

  const removeWorkout = (id) =>
    setData(d => ({ ...d, workouts: d.workouts.filter(w => w.id !== id) }))

  const saveCheckin = () => {
    setCheckinSaved(true)
    setTimeout(() => setCheckinSaved(false), 2000)
  }

  // Totals
  const allItems     = Object.values(data.meals).flat()
  const consumed     = allItems.reduce((a, i) => a + i.calories, 0)
  const burned       = data.workouts.reduce((a, w) => a + w.calories_burned, 0)
  const targetCal    = plan?.daily_calories || 2000

  const dateStr = mounted
    ? new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
    : ''

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-32" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* Sticky header */}
      <div className="sticky top-0 z-30 bg-white border-b border-[#E2E8F0] px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <button onClick={() => router.push('/diagnostico')} className="text-[#94A3B8] text-sm hover:text-[#0F172A] transition-colors">
            ← Plan
          </button>
          <span className="text-xl font-bold text-[#16A34A] tracking-widest" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            TRACKER
          </span>
          <span className="text-xs text-[#94A3B8] capitalize text-right leading-tight max-w-[100px]">{dateStr}</span>
        </div>
      </div>

      {/* Barra de objetivos */}
      {plan && (
        <div className="bg-[#0F172A] px-4 py-3">
          <div className="max-w-lg mx-auto flex items-center justify-around">
            {[
              { val: plan.daily_calories, unit: 'kcal',  color: '#4ADE80' },
              { val: `${plan.protein_grams}g`, unit: 'prot',  color: '#86EFAC' },
              { val: `${plan.carbs_grams}g`,   unit: 'carbos', color: '#60A5FA' },
              { val: `${plan.fat_grams}g`,     unit: 'grasas', color: '#FCD34D' },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="text-lg font-bold leading-none" style={{ color: item.color, fontFamily: "'Bebas Neue', sans-serif" }}>
                  {item.val}
                </div>
                <div className="text-[10px] text-[#475569] uppercase tracking-wide mt-0.5">{item.unit}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-lg mx-auto px-4 py-5 space-y-5">

        {/* ── Check-in matutino ── */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5">
          <h2 className="font-bold text-[#0F172A] mb-5 flex items-center gap-2">
            <span>🌤️</span> Check-in matutino
          </h2>

          {/* Peso */}
          <div className="mb-5">
            <label className="text-xs text-[#64748B] font-semibold uppercase tracking-wider mb-2 block">Peso del día</label>
            <div className="relative">
              <input
                type="number"
                inputMode="decimal"
                value={data.checkin.weight}
                onChange={e => setData(d => ({ ...d, checkin: { ...d.checkin, weight: e.target.value } }))}
                placeholder="75.0"
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#16A34A] rounded-xl px-4 py-3 text-3xl font-bold text-[#0F172A] focus:outline-none transition-colors pr-14"
                style={{ fontFamily: "'Bebas Neue', sans-serif" }}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8] font-medium">kg</span>
            </div>
          </div>

          {/* Horas de sueño */}
          <div className="mb-5">
            <label className="text-xs text-[#64748B] font-semibold uppercase tracking-wider mb-2 block">
              Horas de sueño: <span className="text-[#0F172A] normal-case font-bold">{data.checkin.sleep_hours}h</span>
            </label>
            <input
              type="range" min={4} max={12} step={0.5}
              value={data.checkin.sleep_hours}
              onChange={e => setData(d => ({ ...d, checkin: { ...d.checkin, sleep_hours: Number(e.target.value) } }))}
              className="w-full accent-[#16A34A]"
            />
            <div className="flex justify-between text-xs text-[#94A3B8] mt-1"><span>4h</span><span>12h</span></div>
          </div>

          {/* Calidad del sueño */}
          <div className="mb-5">
            <label className="text-xs text-[#64748B] font-semibold uppercase tracking-wider mb-3 block">Calidad del sueño</label>
            <div className="flex gap-2 justify-between">
              {SLEEP_EMOJIS.map((em, i) => (
                <button
                  key={i}
                  onClick={() => setData(d => ({ ...d, checkin: { ...d.checkin, sleep_quality: i } }))}
                  className={`flex-1 py-3 rounded-xl text-2xl transition-all ${
                    data.checkin.sleep_quality === i
                      ? 'bg-[#16A34A]/10 ring-2 ring-[#16A34A] scale-105'
                      : 'bg-[#F8FAFC] hover:bg-[#F0FDF4]'
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={saveCheckin}
            className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all ${
              checkinSaved
                ? 'bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]'
                : 'bg-[#16A34A] hover:bg-[#15803D] text-white'
            }`}
          >
            {checkinSaved ? '✓ Guardado' : 'Guardar check-in'}
          </button>
        </div>

        {/* ── Comidas ── */}
        <div className="space-y-3">
          <h2 className="font-bold text-[#0F172A] flex items-center gap-2 px-1">
            <span>🍽️</span> Mis comidas
          </h2>
          {MEALS.map(meal => (
            <MealAccordion
              key={meal.key}
              mealKey={meal.key}
              label={meal.label}
              emoji={meal.emoji}
              items={data.meals[meal.key]}
              onAdd={item => addFood(meal.key, item)}
              onRemove={id => removeFood(meal.key, id)}
            />
          ))}
        </div>

        {/* ── Ejercicio ── */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[#0F172A] flex items-center gap-2">
              <span>💪</span> Ejercicio
            </h2>
            <button
              onClick={() => setShowWorkout(true)}
              className="bg-[#16A34A] hover:bg-[#15803D] text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors"
            >
              + Añadir
            </button>
          </div>

          {data.workouts.length === 0 ? (
            <div className="text-center py-6">
              <div className="text-3xl mb-2">🏃</div>
              <p className="text-sm text-[#94A3B8]">Sin entrenamientos registrados hoy</p>
            </div>
          ) : (
            <div className="space-y-2">
              {data.workouts.map(w => (
                <div key={w.id} className="flex items-center justify-between bg-[#F8FAFC] rounded-xl px-4 py-3">
                  <div>
                    <div className="font-semibold text-sm text-[#0F172A]">{w.label}</div>
                    <div className="text-xs text-[#64748B]">{w.duration_minutes} min</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-[#2563EB]">−{w.calories_burned} kcal</span>
                    <button onClick={() => removeWorkout(w.id)} className="text-[#CBD5E1] hover:text-[#DC2626] text-xl leading-none transition-colors">×</button>
                  </div>
                </div>
              ))}
              <div className="text-right text-xs text-[#64748B] pt-1 pr-1">
                Total quemado: <span className="font-bold text-[#2563EB]">{burned} kcal</span>
              </div>
            </div>
          )}
        </div>

      </div>

      <WorkoutModal
        show={showWorkout}
        onClose={() => setShowWorkout(false)}
        onAdd={addWorkout}
        userWeight={userWeight}
      />

      <BottomBar consumed={consumed} burned={burned} target={targetCal} />
    </div>
  )
}
