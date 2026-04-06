'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

// ─── Alimentos (kcal / p / c / f por 100g) ───────────────────────────────────
const FOODS = [
  { name: 'Pechuga de pollo',      cal: 165, p: 31,  c: 0,    f: 3.6 },
  { name: 'Muslo de pollo',        cal: 209, p: 26,  c: 0,    f: 11  },
  { name: 'Huevo entero',          cal: 155, p: 13,  c: 1.1,  f: 11  },
  { name: 'Clara de huevo',        cal: 52,  p: 11,  c: 0.7,  f: 0.2 },
  { name: 'Atún en agua',          cal: 116, p: 26,  c: 0,    f: 1   },
  { name: 'Salmón fresco',         cal: 208, p: 20,  c: 0,    f: 13  },
  { name: 'Sardinas',              cal: 208, p: 25,  c: 0,    f: 12  },
  { name: 'Ternera magra',         cal: 180, p: 26,  c: 0,    f: 8   },
  { name: 'Lomo de cerdo',         cal: 190, p: 25,  c: 0,    f: 10  },
  { name: 'Jamón serrano',         cal: 241, p: 30,  c: 0,    f: 13  },
  { name: 'Gambas',                cal: 85,  p: 18,  c: 1,    f: 1   },
  { name: 'Tofu',                  cal: 76,  p: 8,   c: 2,    f: 4   },
  { name: 'Proteína whey',         cal: 400, p: 80,  c: 8,    f: 6   },
  { name: 'Leche entera',          cal: 61,  p: 3.2, c: 4.8,  f: 3.3 },
  { name: 'Leche semidesnatada',   cal: 46,  p: 3.4, c: 4.9,  f: 1.6 },
  { name: 'Yogur natural',         cal: 59,  p: 3.5, c: 4.7,  f: 2.5 },
  { name: 'Yogur griego',          cal: 97,  p: 9,   c: 4,    f: 5   },
  { name: 'Queso fresco',          cal: 90,  p: 11,  c: 2,    f: 4   },
  { name: 'Requesón',              cal: 72,  p: 11,  c: 3,    f: 1.5 },
  { name: 'Queso manchego',        cal: 392, p: 26,  c: 0,    f: 32  },
  { name: 'Arroz blanco cocido',   cal: 130, p: 2.7, c: 28,   f: 0.3 },
  { name: 'Pasta cocida',          cal: 131, p: 5,   c: 25,   f: 1   },
  { name: 'Pan blanco',            cal: 265, p: 9,   c: 51,   f: 2   },
  { name: 'Pan integral',          cal: 247, p: 9,   c: 41,   f: 3   },
  { name: 'Patata cocida',         cal: 77,  p: 2,   c: 17,   f: 0.1 },
  { name: 'Boniato cocido',        cal: 86,  p: 1.6, c: 20,   f: 0.1 },
  { name: 'Avena',                 cal: 379, p: 13,  c: 68,   f: 6   },
  { name: 'Quinoa cocida',         cal: 120, p: 4.4, c: 22,   f: 1.9 },
  { name: 'Lentejas cocidas',      cal: 116, p: 9,   c: 20,   f: 0.4 },
  { name: 'Garbanzos cocidos',     cal: 164, p: 9,   c: 27,   f: 2.6 },
  { name: 'Lechuga',               cal: 15,  p: 1.4, c: 2.2,  f: 0.2 },
  { name: 'Tomate',                cal: 18,  p: 0.9, c: 3.9,  f: 0.2 },
  { name: 'Pepino',                cal: 15,  p: 0.7, c: 3.6,  f: 0.1 },
  { name: 'Brócoli',               cal: 34,  p: 2.8, c: 7,    f: 0.4 },
  { name: 'Espinacas',             cal: 23,  p: 2.9, c: 3.6,  f: 0.4 },
  { name: 'Zanahoria',             cal: 41,  p: 0.9, c: 10,   f: 0.2 },
  { name: 'Pimiento rojo',         cal: 31,  p: 1,   c: 6,    f: 0.3 },
  { name: 'Cebolla',               cal: 40,  p: 1.1, c: 9,    f: 0.1 },
  { name: 'Champiñones',           cal: 22,  p: 3.1, c: 3.3,  f: 0.3 },
  { name: 'Aguacate',              cal: 160, p: 2,   c: 9,    f: 15  },
  { name: 'Manzana',               cal: 52,  p: 0.3, c: 14,   f: 0.2 },
  { name: 'Plátano',               cal: 89,  p: 1.1, c: 23,   f: 0.3 },
  { name: 'Naranja',               cal: 47,  p: 0.9, c: 12,   f: 0.1 },
  { name: 'Fresas',                cal: 32,  p: 0.7, c: 7.7,  f: 0.3 },
  { name: 'Arándanos',             cal: 57,  p: 0.7, c: 14,   f: 0.3 },
  { name: 'Kiwi',                  cal: 61,  p: 1.1, c: 15,   f: 0.5 },
  { name: 'Aceite de oliva',       cal: 884, p: 0,   c: 0,    f: 100 },
  { name: 'Almendras',             cal: 579, p: 21,  c: 22,   f: 50  },
  { name: 'Nueces',                cal: 654, p: 15,  c: 14,   f: 65  },
  { name: 'Mantequilla cacahuete', cal: 588, p: 25,  c: 20,   f: 50  },
  { name: 'Chocolate negro 70%',   cal: 600, p: 8,   c: 46,   f: 44  },
  { name: 'Miel',                  cal: 304, p: 0.3, c: 82,   f: 0   },
]

const WORKOUT_TYPES = [
  { value: 'weights',    label: 'Pesas',        emoji: '🏋️', met: 5.0  },
  { value: 'running',    label: 'Correr',       emoji: '🏃', met: 9.8  },
  { value: 'hiit',       label: 'HIIT',         emoji: '⚡', met: 10.0 },
  { value: 'cycling',    label: 'Ciclismo',     emoji: '🚴', met: 7.5  },
  { value: 'swimming',   label: 'Natación',     emoji: '🏊', met: 7.0  },
  { value: 'walking',    label: 'Caminar',      emoji: '🚶', met: 3.5  },
  { value: 'elliptical', label: 'Elíptica',     emoji: '⭕', met: 5.0  },
  { value: 'yoga',       label: 'Yoga',         emoji: '🧘', met: 2.5  },
  { value: 'other',      label: 'Otro',         emoji: '💪', met: 5.0  },
]

const MEALS = [
  { key: 'breakfast',       label: 'Desayuno',     emoji: '🌅', pct: 0.25 },
  { key: 'morning_snack',   label: 'Media mañana', emoji: '🍎', pct: 0.10 },
  { key: 'lunch',           label: 'Comida',       emoji: '🍽️', pct: 0.35 },
  { key: 'afternoon_snack', label: 'Merienda',     emoji: '🍊', pct: 0.10 },
  { key: 'dinner',          label: 'Cena',         emoji: '🌙', pct: 0.20 },
]

const SLEEP_EMOJIS = ['😴', '😑', '🙂', '😊', '🔥']

const EMPTY_DATA = () => ({
  checkin: { weight: '', sleep_hours: 7, sleep_quality: 2 },
  meals: { breakfast: [], morning_snack: [], lunch: [], afternoon_snack: [], dinner: [] },
  workouts: [],
})

function localToday() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function todayKey() {
  return `forja_tracker_${localToday()}`
}
function r1(n) { return Math.round(n * 10) / 10 }
function mealMacros(items) {
  return items.reduce(
    (a, it) => ({ cal: a.cal + it.calories, p: a.p + it.protein, c: a.c + it.carbs, f: a.f + it.fat }),
    { cal: 0, p: 0, c: 0, f: 0 }
  )
}

// ─── CalorieRing ──────────────────────────────────────────────────────────────
function CalorieRing({ consumed, target }) {
  const size = 200
  const sw   = 16
  const r    = (size - sw) / 2
  const circ = 2 * Math.PI * r
  const pct  = target > 0 ? Math.min(consumed / target, 1) : 0
  const over = target > 0 && consumed > target
  const ringColor = over ? '#DC2626' : pct > 0.88 ? '#F59E0B' : '#16A34A'
  const remaining = Math.max(target - Math.round(consumed), 0)

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="absolute inset-0 -rotate-90">
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#E2E8F0" strokeWidth={sw} />
          <circle
            cx={size/2} cy={size/2} r={r} fill="none"
            stroke={ringColor} strokeWidth={sw} strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - pct)}
            style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(.4,0,.2,1), stroke 0.4s' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div
            className="leading-none font-bold"
            style={{ fontSize: '2.8rem', color: ringColor, fontFamily: "'Bebas Neue', sans-serif" }}
          >
            {Math.round(consumed)}
          </div>
          <div className="text-xs text-[#94A3B8] mt-0.5 tracking-wide">kcal</div>
          <div className="text-[11px] text-[#CBD5E1] mt-1">de {target}</div>
        </div>
      </div>
      <div className="mt-1 text-sm font-medium" style={{ color: ringColor }}>
        {over
          ? `+${Math.round(consumed - target)} sobre objetivo`
          : remaining === 0 ? '¡Objetivo alcanzado! 🎯'
          : `${remaining} kcal restantes`}
      </div>
    </div>
  )
}

// ─── MacroStrip ───────────────────────────────────────────────────────────────
function MacroStrip({ label, current, target, color }) {
  const pct  = target > 0 ? Math.min((current / target) * 100, 100) : 0
  const over = current > target
  return (
    <div className="flex-1 min-w-0">
      <div className="flex justify-between items-baseline mb-1">
        <span className="text-xs font-bold" style={{ color }}>{label}</span>
        <span className="text-[11px] text-[#94A3B8]">/{target}g</span>
      </div>
      <div className="h-2 bg-[#E2E8F0] rounded-full overflow-hidden mb-1">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: over ? '#DC2626' : color }}
        />
      </div>
      <div className="text-xs font-semibold" style={{ color: over ? '#DC2626' : '#0F172A' }}>
        {Math.round(current)}g
      </div>
    </div>
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
    onAdd({ id: Date.now(), name: selected.name, grams: g,
      calories: r1(selected.cal * g / 100), protein: r1(selected.p * g / 100),
      carbs:    r1(selected.c   * g / 100), fat:     r1(selected.f * g / 100),
    })
    setQuery(''); setSelected(null); setGrams('100')
  }

  return (
    <div className="space-y-2">
      {!selected ? (
        <div className="relative">
          <input type="text" value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Buscar alimento..."
            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#16A34A] transition-colors"
          />
          {results.length > 0 && (
            <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-white border border-[#E2E8F0] rounded-xl shadow-lg overflow-hidden">
              {results.map(f => (
                <button key={f.name} onClick={() => { setSelected(f); setQuery(f.name) }}
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
            <button onClick={() => { setSelected(null); setQuery('') }} className="text-[#94A3B8] text-xs flex-shrink-0">✕</button>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input type="number" inputMode="decimal" value={grams} onChange={e => setGrams(e.target.value)} min="1"
                className="w-full bg-white border border-[#BBF7D0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#16A34A]"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#94A3B8]">g</span>
            </div>
            <span className="text-xs text-[#64748B] flex-shrink-0">= {r1(selected.cal * Number(grams || 0) / 100)} kcal</span>
            <button onClick={handleAdd} className="bg-[#16A34A] hover:bg-[#15803D] text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors flex-shrink-0">+</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── AIDescribe ───────────────────────────────────────────────────────────────
function AIDescribe({ onAddAll }) {
  const [text, setText]       = useState('')
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState(null)
  const [error, setError]     = useState('')

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

  const confirm = () => {
    preview.forEach((item, i) => onAddAll({ id: Date.now() + i, ...item }))
    setText(''); setPreview(null)
  }

  if (preview) {
    const total = preview.reduce((a, it) => ({
      cal: a.cal + it.calories, p: a.p + it.protein,
      c: a.c + it.carbs,        f: a.f + it.fat,
    }), { cal: 0, p: 0, c: 0, f: 0 })

    return (
      <div className="space-y-2">
        {preview.map((item, i) => (
          <div key={i} className="flex items-center justify-between bg-[#F8FAFC] rounded-xl px-3 py-2.5">
            <div className="flex-1 min-w-0 mr-3">
              <div className="text-sm font-medium text-[#0F172A] truncate">{item.name}</div>
              <div className="text-xs text-[#94A3B8]">~{item.grams}g estimados</div>
            </div>
            <div className="text-right flex-shrink-0">
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
        <div className="flex gap-2 pt-1">
          <button onClick={() => setPreview(null)} className="flex-1 py-2.5 rounded-xl border border-[#E2E8F0] text-sm text-[#64748B] hover:bg-[#F8FAFC] transition-colors">Editar</button>
          <button onClick={confirm} className="flex-1 py-2.5 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-sm font-bold transition-colors">Añadir al registro ✓</button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <textarea value={text} onChange={e => setText(e.target.value)} rows={3}
        placeholder={'Describe lo que has comido...\nEj: 2 tostadas de pan integral con AOVE y 30g de pavo, café con leche'}
        className="w-full bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#16A34A] rounded-xl px-4 py-3 text-sm resize-none focus:outline-none transition-colors leading-relaxed"
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      <button onClick={analyze} disabled={!text.trim() || loading}
        className={`w-full py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
          text.trim() && !loading ? 'bg-[#0F172A] hover:bg-[#1E293B] text-white' : 'bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed'
        }`}
      >
        {loading
          ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Analizando...</>
          : '✨ Calcular macros con IA'}
      </button>
    </div>
  )
}

// ─── MealInput (tabs) ─────────────────────────────────────────────────────────
function MealInput({ onAdd }) {
  const [mode, setMode] = useState('ai')
  return (
    <div className="mt-3">
      <div className="flex bg-[#F1F5F9] rounded-xl p-1 mb-3">
        {[['ai', '✨ Describir con IA'], ['search', '🔍 Buscar']].map(([m, lbl]) => (
          <button key={m} onClick={() => setMode(m)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              mode === m ? 'bg-white text-[#0F172A] shadow-sm' : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >{lbl}</button>
        ))}
      </div>
      {mode === 'ai' ? <AIDescribe onAddAll={onAdd} /> : <FoodSearch onAdd={onAdd} />}
    </div>
  )
}

// ─── WorkoutModal ─────────────────────────────────────────────────────────────
function WorkoutModal({ show, onClose, onAdd, userWeight }) {
  const [type, setType]         = useState('weights')
  const [duration, setDuration] = useState(45)
  if (!show) return null
  const wt  = WORKOUT_TYPES.find(w => w.value === type)
  const cal = Math.round(wt.met * (userWeight || 75) * (duration / 60))
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-[#0F172A] text-lg">Añadir entrenamiento</h3>
          <button onClick={onClose} className="text-[#94A3B8] hover:text-[#0F172A] text-2xl leading-none">✕</button>
        </div>
        <div className="space-y-5">
          <div>
            <label className="text-xs text-[#64748B] font-semibold uppercase tracking-wider mb-2 block">Actividad</label>
            <div className="grid grid-cols-3 gap-2">
              {WORKOUT_TYPES.map(w => (
                <button key={w.value} onClick={() => setType(w.value)}
                  className={`py-2.5 px-1 rounded-xl text-xs font-medium transition-all flex flex-col items-center gap-1 ${
                    type === w.value ? 'bg-[#16A34A] text-white shadow-sm' : 'bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]'
                  }`}
                >
                  <span className="text-base">{w.emoji}</span>{w.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-[#64748B] font-semibold uppercase tracking-wider mb-2 block">
              Duración: <span className="text-[#0F172A] normal-case font-bold">{duration} min</span>
            </label>
            <input type="range" min={10} max={180} step={5} value={duration}
              onChange={e => setDuration(Number(e.target.value))} className="w-full accent-[#16A34A]"
            />
            <div className="flex justify-between text-xs text-[#94A3B8] mt-1"><span>10 min</span><span>180 min</span></div>
          </div>
          <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-2xl p-4 text-center">
            <div className="text-4xl font-bold text-[#16A34A]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>~{cal} kcal</div>
            <div className="text-xs text-[#64748B] mt-0.5">gasto estimado · {wt.emoji} {duration} min</div>
          </div>
          <button
            onClick={() => { onAdd({ id: Date.now(), type, label: wt.label, emoji: wt.emoji, duration_minutes: duration, calories_burned: cal }); onClose() }}
            className="w-full bg-[#16A34A] hover:bg-[#15803D] text-white font-bold py-4 rounded-xl transition-colors"
          >Guardar entrenamiento</button>
        </div>
      </div>
    </div>
  )
}

// ─── MealCard ─────────────────────────────────────────────────────────────────
function MealCard({ mealKey, label, emoji, items, onAdd, onRemove, mealTarget }) {
  const [open, setOpen] = useState(false)
  const mac  = mealMacros(items)
  const pct  = mealTarget > 0 ? Math.min((mac.cal / mealTarget) * 100, 100) : 0
  const over = mac.cal > mealTarget && mealTarget > 0
  const barColor = over ? '#DC2626' : pct > 85 ? '#F59E0B' : '#16A34A'

  return (
    <div className={`bg-white rounded-2xl border transition-all duration-200 ${open ? 'border-[#16A34A]/30 shadow-md' : 'border-[#E2E8F0]'}`}>
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-4 text-left"
      >
        {/* Emoji bubble */}
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 transition-colors ${open ? 'bg-[#F0FDF4]' : 'bg-[#F8FAFC]'}`}>
          {emoji}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-semibold text-sm text-[#0F172A]">{label}</span>
            <div className="flex items-center gap-2">
              {mac.cal > 0 && (
                <span className="text-sm font-bold" style={{ color: barColor }}>
                  {Math.round(mac.cal)} <span className="text-[#94A3B8] font-normal text-xs">kcal</span>
                </span>
              )}
              <span className="text-[#CBD5E1] text-xs">{open ? '▲' : '▼'}</span>
            </div>
          </div>
          {/* Barra de progreso de la comida */}
          <div className="h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, backgroundColor: barColor }}
            />
          </div>
          {mac.cal === 0 && (
            <div className="text-xs text-[#CBD5E1] mt-1">Objetivo: ~{Math.round(mealTarget)} kcal</div>
          )}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-[#F8FAFC]">
          {/* Lista de ítems */}
          {items.length > 0 && (
            <div className="mt-3 space-y-1.5 mb-3">
              {items.map(item => (
                <div key={item.id} className="flex items-center justify-between bg-[#F8FAFC] rounded-xl px-3 py-2.5 group">
                  <div className="flex-1 min-w-0 mr-2">
                    <div className="text-sm font-medium text-[#0F172A] truncate">{item.name}</div>
                    <div className="text-[11px] text-[#94A3B8]">{item.grams}g · P{Math.round(item.protein)} C{Math.round(item.carbs)} G{Math.round(item.fat)}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-sm font-bold text-[#0F172A]">{Math.round(item.calories)}</span>
                    <span className="text-[11px] text-[#94A3B8]">kcal</span>
                    <button onClick={() => onRemove(item.id)} className="text-[#E2E8F0] hover:text-[#DC2626] text-xl leading-none transition-colors ml-1">×</button>
                  </div>
                </div>
              ))}
              {/* Totales de la comida */}
              {items.length > 1 && (
                <div className="flex gap-1.5 pt-1">
                  {[['P', Math.round(mac.p), '#16A34A'], ['C', Math.round(mac.c), '#3B82F6'], ['G', Math.round(mac.f), '#F59E0B']].map(([l, v, c]) => (
                    <div key={l} className="flex-1 text-center rounded-lg py-1.5 text-xs font-bold" style={{ backgroundColor: `${c}12`, color: c }}>
                      {l} {v}g
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          <MealInput onAdd={onAdd} />
        </div>
      )}
    </div>
  )
}

// ─── Helpers de fecha ─────────────────────────────────────────────────────────
function offsetDate(base, days) {
  const d = new Date(base + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function formatDate(dateStr) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('es-ES', {
    weekday: 'short', day: 'numeric', month: 'short',
  })
}

// ─── TrackerPage ──────────────────────────────────────────────────────────────
export default function TrackerPage() {
  const router = useRouter()
  const [data, setData]                 = useState(EMPTY_DATA())
  const [plan, setPlan]                 = useState(null)
  const [userWeight, setUserWeight]     = useState(75)
  const [mounted, setMounted]           = useState(false)
  const [showWorkout, setShowWorkout]   = useState(false)
  const [checkinSaved, setCheckinSaved] = useState(false)
  const [viewDate, setViewDate]         = useState('')
  // Ref para que el auto-save siempre use la fecha activa sin crear race conditions
  const viewDateRef = useRef('')

  useEffect(() => {
    const today = localToday()
    viewDateRef.current = today
    setViewDate(today)
    try { const s = localStorage.getItem(`forja_tracker_${today}`); if (s) setData(JSON.parse(s)) } catch {}
    try { const p = localStorage.getItem('forja_plan_preview'); if (p) setPlan(JSON.parse(p)) } catch {}
    try {
      const od = JSON.parse(localStorage.getItem('forja_onboarding_data') || '{}')
      if (od.current_weight) setUserWeight(Number(od.current_weight))
    } catch {}
    setMounted(true)
  }, [])

  // Auto-save: usa ref para evitar guardar en la fecha equivocada durante navegación
  useEffect(() => {
    if (!mounted || !viewDateRef.current) return
    localStorage.setItem(`forja_tracker_${viewDateRef.current}`, JSON.stringify(data))
  }, [data, mounted])

  // Navegar a otra fecha
  const goToDate = (date) => {
    const today = localToday()
    if (date > today) return  // no navegar al futuro
    viewDateRef.current = date
    setViewDate(date)
    try {
      const s = localStorage.getItem(`forja_tracker_${date}`)
      setData(s ? JSON.parse(s) : EMPTY_DATA())
    } catch { setData(EMPTY_DATA()) }
  }

  const addFood      = (k, item) => setData(d => ({ ...d, meals: { ...d.meals, [k]: [...d.meals[k], item] } }))
  const removeFood   = (k, id)   => setData(d => ({ ...d, meals: { ...d.meals, [k]: d.meals[k].filter(i => i.id !== id) } }))
  const addWorkout   = (w)       => setData(d => ({ ...d, workouts: [...d.workouts, w] }))
  const removeWorkout = (id)     => setData(d => ({ ...d, workouts: d.workouts.filter(w => w.id !== id) }))

  const saveCheckin = () => { setCheckinSaved(true); setTimeout(() => setCheckinSaved(false), 2000) }

  // Totals
  const allItems  = Object.values(data.meals).flat()
  const consumed  = allItems.reduce((a, i) => a + i.calories, 0)
  const burned    = data.workouts.reduce((a, w) => a + w.calories_burned, 0)
  const totalP    = allItems.reduce((a, i) => a + i.protein, 0)
  const totalC    = allItems.reduce((a, i) => a + i.carbs, 0)
  const totalF    = allItems.reduce((a, i) => a + i.fat, 0)
  const targetCal = plan?.daily_calories || 2000
  const net       = consumed - burned
  const pctHeader = targetCal > 0 ? Math.min((consumed / targetCal) * 100, 100) : 0

  const today   = mounted ? localToday() : ''
  const isToday = viewDate === today
  const dateStr = viewDate ? formatDate(viewDate) : ''

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-[#F8FAFC]" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Sticky header con navegación de fechas ── */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0]">
        <div className="max-w-lg mx-auto px-3 py-2 flex items-center gap-2">
          {/* Volver al plan */}
          <button onClick={() => router.push('/diagnostico')} className="text-[#94A3B8] hover:text-[#0F172A] transition-colors text-sm px-1 flex-shrink-0">
            ←
          </button>

          {/* Navegación de fechas */}
          <div className="flex-1 flex items-center justify-center gap-1">
            <button
              onClick={() => goToDate(offsetDate(viewDate, -1))}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-[#94A3B8] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-colors text-sm"
            >‹</button>

            <button
              onClick={() => !isToday && goToDate(today)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                isToday
                  ? 'text-[#16A34A] bg-[#F0FDF4]'
                  : 'text-[#0F172A] bg-[#F1F5F9] hover:bg-[#E2E8F0]'
              }`}
            >
              <span className="capitalize">{dateStr}</span>
              {!isToday && <span className="text-[#94A3B8] ml-1 normal-case">· hoy →</span>}
            </button>

            <button
              onClick={() => goToDate(offsetDate(viewDate, +1))}
              disabled={isToday}
              className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm transition-colors ${
                isToday ? 'text-[#E2E8F0] cursor-not-allowed' : 'text-[#94A3B8] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
              }`}
            >›</button>
          </div>

          {/* Kcal del día */}
          <div className="text-sm font-bold flex-shrink-0" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            {Math.round(consumed)}<span className="text-xs text-[#94A3B8] font-normal">kcal</span>
          </div>
        </div>

        {/* Línea de progreso */}
        <div className="h-0.5 bg-[#E2E8F0]">
          <div className="h-full transition-all duration-700"
            style={{ width: `${pctHeader}%`, backgroundColor: pctHeader > 100 ? '#DC2626' : pctHeader > 88 ? '#F59E0B' : '#16A34A' }}
          />
        </div>
      </div>

      {/* Banner día pasado */}
      {!isToday && (
        <div className="bg-[#FFF7ED] border-b border-[#FED7AA] px-4 py-2 text-center">
          <span className="text-xs text-[#92400E] font-medium">
            📅 Viendo historial · {formatDate(viewDate)}
          </span>
        </div>
      )}

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">

        {/* ── Hero: ring + macros ── */}
        <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-sm p-6">
          <div className="flex justify-center mb-5">
            <CalorieRing consumed={consumed} target={targetCal} />
          </div>

          {/* Stats: quemado + neto */}
          <div className="flex gap-3 mb-5">
            <div className="flex-1 bg-[#EFF6FF] rounded-2xl px-4 py-3 text-center">
              <div className="text-xl font-bold text-[#3B82F6]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                {Math.round(burned)}
              </div>
              <div className="text-[11px] text-[#93C5FD] uppercase tracking-wide">🔥 quemadas</div>
            </div>
            <div className={`flex-1 rounded-2xl px-4 py-3 text-center ${net > targetCal ? 'bg-[#FEF2F2]' : 'bg-[#F0FDF4]'}`}>
              <div className={`text-xl font-bold ${net > targetCal ? 'text-[#DC2626]' : 'text-[#16A34A]'}`} style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                {Math.round(net)}
              </div>
              <div className={`text-[11px] uppercase tracking-wide ${net > targetCal ? 'text-[#FCA5A5]' : 'text-[#86EFAC]'}`}>
                ⚖️ neto
              </div>
            </div>
          </div>

          {/* Macros */}
          {plan && (
            <div className="flex gap-4">
              <MacroStrip label="Proteína"  current={totalP} target={plan.protein_grams} color="#16A34A" />
              <MacroStrip label="Carbos"    current={totalC} target={plan.carbs_grams}   color="#3B82F6" />
              <MacroStrip label="Grasas"    current={totalF} target={plan.fat_grams}     color="#F59E0B" />
            </div>
          )}
        </div>

        {/* ── Check-in matutino (compacto) ── */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
          <button
            onClick={() => {}} // expandible en el futuro
            className="w-full px-4 pt-4 pb-1 flex items-center justify-between"
          >
            <span className="font-bold text-[#0F172A] flex items-center gap-2"><span>🌤️</span> Check-in matutino</span>
            {data.checkin.weight && (
              <span className="text-xs text-[#94A3B8]">{data.checkin.weight} kg · {data.checkin.sleep_hours}h {SLEEP_EMOJIS[data.checkin.sleep_quality]}</span>
            )}
          </button>
          <div className="px-4 pb-4 pt-3 space-y-4">
            {/* Peso + sueño en fila */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-[10px] text-[#94A3B8] uppercase tracking-wider font-semibold mb-1 block">Peso</label>
                <div className="relative">
                  <input type="number" inputMode="decimal" value={data.checkin.weight}
                    onChange={e => setData(d => ({ ...d, checkin: { ...d.checkin, weight: e.target.value } }))}
                    placeholder="75.0"
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#16A34A] rounded-xl px-3 py-2.5 text-xl font-bold text-[#0F172A] focus:outline-none transition-colors pr-8"
                    style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#94A3B8]">kg</span>
                </div>
              </div>
              <div className="flex-1">
                <label className="text-[10px] text-[#94A3B8] uppercase tracking-wider font-semibold mb-1 block">
                  Sueño · <span className="text-[#0F172A]">{data.checkin.sleep_hours}h</span>
                </label>
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-2.5">
                  <input type="range" min={4} max={12} step={0.5}
                    value={data.checkin.sleep_hours}
                    onChange={e => setData(d => ({ ...d, checkin: { ...d.checkin, sleep_hours: Number(e.target.value) } }))}
                    className="w-full accent-[#16A34A] h-1.5"
                  />
                </div>
              </div>
            </div>
            {/* Calidad del sueño */}
            <div>
              <label className="text-[10px] text-[#94A3B8] uppercase tracking-wider font-semibold mb-2 block">Calidad del sueño</label>
              <div className="flex gap-2">
                {SLEEP_EMOJIS.map((em, i) => (
                  <button key={i} onClick={() => setData(d => ({ ...d, checkin: { ...d.checkin, sleep_quality: i } }))}
                    className={`flex-1 py-2 rounded-xl text-xl transition-all ${
                      data.checkin.sleep_quality === i ? 'bg-[#16A34A]/10 ring-2 ring-[#16A34A] scale-105' : 'bg-[#F8FAFC] hover:bg-[#F0FDF4]'
                    }`}
                  >{em}</button>
                ))}
              </div>
            </div>
            <button onClick={saveCheckin}
              className={`w-full py-3 rounded-xl text-sm font-bold transition-all ${
                checkinSaved ? 'bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]' : 'bg-[#0F172A] hover:bg-[#1E293B] text-white'
              }`}
            >{checkinSaved ? '✓ Guardado' : 'Guardar check-in'}</button>
          </div>
        </div>

        {/* ── Comidas ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-bold text-[#0F172A]">Comidas del día</h2>
            <span className="text-sm font-bold text-[#16A34A]">
              {Math.round(consumed)} <span className="text-[#94A3B8] font-normal text-xs">/ {targetCal} kcal</span>
            </span>
          </div>
          {MEALS.map(meal => (
            <MealCard
              key={meal.key}
              mealKey={meal.key}
              label={meal.label}
              emoji={meal.emoji}
              items={data.meals[meal.key]}
              onAdd={item => addFood(meal.key, item)}
              onRemove={id => removeFood(meal.key, id)}
              mealTarget={targetCal * meal.pct}
            />
          ))}
        </div>

        {/* ── Ejercicio ── */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[#0F172A]">Ejercicio</h2>
            <button onClick={() => setShowWorkout(true)}
              className="bg-[#16A34A] hover:bg-[#15803D] text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <span>+</span> Añadir
            </button>
          </div>

          {data.workouts.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">🏃</div>
              <p className="text-sm text-[#CBD5E1]">Sin entrenamientos hoy</p>
            </div>
          ) : (
            <div className="space-y-2">
              {data.workouts.map(w => (
                <div key={w.id} className="flex items-center gap-3 bg-[#F8FAFC] rounded-2xl px-4 py-3">
                  <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] flex items-center justify-center text-xl flex-shrink-0">
                    {w.emoji || '💪'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-[#0F172A]">{w.label}</div>
                    <div className="text-xs text-[#94A3B8]">{w.duration_minutes} min</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-base font-bold text-[#3B82F6]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                      -{w.calories_burned}
                    </div>
                    <div className="text-[11px] text-[#94A3B8]">kcal</div>
                  </div>
                  <button onClick={() => removeWorkout(w.id)} className="text-[#E2E8F0] hover:text-[#DC2626] text-xl leading-none transition-colors ml-1">×</button>
                </div>
              ))}
              <div className="flex items-center justify-end gap-1 text-sm pt-1 pr-1">
                <span className="text-[#94A3B8]">Total quemado:</span>
                <span className="font-bold text-[#3B82F6]">{burned} kcal</span>
              </div>
            </div>
          )}
        </div>

        <div className="pb-6" />
      </div>

      <WorkoutModal show={showWorkout} onClose={() => setShowWorkout(false)} onAdd={addWorkout} userWeight={userWeight} />
    </div>
  )
}
