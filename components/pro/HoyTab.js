'use client'

import { useMemo } from 'react'
import { useTracker } from '@/hooks/useTracker'

// ── RingProgress ──────────────────────────────────────────────────────────────
function RingProgress({ value, max, size = 82, stroke = 7, color, label, sublabel }) {
  const pct  = Math.min(100, Math.max(0, max > 0 ? (value / max) * 100 : 0))
  const r    = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} className="stroke-forja-softFill" strokeWidth={stroke} fill="none"/>
        <circle cx={size/2} cy={size/2} r={r} stroke={color} strokeWidth={stroke} fill="none"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"/>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-forja-text" style={{ fontSize: 22, letterSpacing: 1, lineHeight: 1 }}>
          {label}
        </span>
        <span className="text-forja-muted uppercase tracking-wider" style={{ fontSize: 9, fontWeight: 600 }}>
          {sublabel}
        </span>
      </div>
    </div>
  )
}

// ── WeightSpark ───────────────────────────────────────────────────────────────
function WeightSpark({ data }) {
  if (!data || data.length < 2) return null
  const W = 320, H = 60, P = 4
  const vals  = data.map(d => d.w)
  const min   = Math.min(...vals)
  const max   = Math.max(...vals)
  const range = max - min || 1
  const pts   = data.map((d, i) => [
    P + (i / (data.length - 1)) * (W - 2 * P),
    P + (1 - (d.w - min) / range) * (H - 2 * P),
  ])
  const path = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p.join(',')).join(' ')
  const area = path + ` L ${W-P},${H-P} L ${P},${H-P} Z`
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="block">
      <defs>
        <linearGradient id="hoySparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#0F7A3A" stopOpacity="0.18"/>
          <stop offset="100%" stopColor="#0F7A3A" stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={area} fill="url(#hoySparkFill)"/>
      <path d={path} fill="none" stroke="#0F7A3A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      {pts.map(([x, y], i) => i === pts.length - 1 && (
        <circle key={i} cx={x} cy={y} r="3" fill="#0F7A3A" stroke="white" strokeWidth="1.5"/>
      ))}
    </svg>
  )
}

// ── HoyTab ────────────────────────────────────────────────────────────────────
export default function HoyTab({ user, plan, userData, logs, setActiveTab }) {
  const { foodEntries, workoutEntries } = useTracker(user?.id)

  // Fecha y semana
  const todayKey  = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
  const dateLabel = new Date().toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'short',
  }).toUpperCase()
  const weekNum = (() => {
    const d = new Date()
    const yd = new Date(d.getFullYear(), 0, 1)
    return String(Math.ceil(((d - yd) / 86400000 + yd.getDay() + 1) / 7)).padStart(2, '0')
  })()

  // Sesión de hoy
  const session = plan?.training_plan?.[todayKey] ?? null

  // Macros del día
  const macros = useMemo(() =>
    (foodEntries || []).reduce((a, e) => ({
      cal:     a.cal     + (e.calories || 0),
      protein: a.protein + (e.protein  || 0),
    }), { cal: 0, protein: 0 }),
    [foodEntries],
  )
  const burned     = useMemo(() => (workoutEntries || []).reduce((a, w) => a + (w.calories_burned || 0), 0), [workoutEntries])
  const calTarget  = plan?.daily_calories ?? 2200
  const protTarget = plan?.protein_grams  ?? 165
  const net        = Math.round(macros.cal)
  const remaining  = calTarget - (net - burned)

  // Peso 14 días — fallback a current_weight del perfil si no hay check-ins
  const weightData = useMemo(() => {
    const fromLogs = (logs || [])
      .filter(l => l.weight_morning != null)
      .slice(-14)
      .map(l => ({ d: l.log_date, w: parseFloat(l.weight_morning) }))
    if (fromLogs.length > 0) return fromLogs
    // Sin historial: un único punto del peso del perfil
    const cw = userData?.current_weight ? parseFloat(userData.current_weight) : null
    return cw ? [{ d: new Date().toISOString().split('T')[0], w: cw }] : []
  }, [logs, userData])
  const weightNow    = weightData[weightData.length - 1]?.w ?? null
  const weightFirst  = weightData[0]?.w ?? null
  const weightChange = weightData.length > 1 && weightNow != null && weightFirst != null
    ? (weightNow - weightFirst).toFixed(1) : null
  const weightTarget = userData?.target_weight ? parseFloat(userData.target_weight) : null

  // Racha
  const streak = useMemo(() => {
    if (!logs?.length) return 0
    const sorted = [...logs].sort((a, b) => new Date(b.log_date) - new Date(a.log_date))
    let count = 0
    for (const l of sorted) {
      if (l.calories_consumed > 0 || l.weight_morning != null) count++
      else break
    }
    return count
  }, [logs])

  // Adherencia 7 días
  const adherence = useMemo(() => {
    if (!logs?.length || !calTarget) return null
    const last7 = logs.slice(-7).filter(l => l.calories_consumed > 0)
    if (!last7.length) return null
    const ok = last7.filter(l => Math.abs(l.calories_consumed - calTarget) <= calTarget * 0.15)
    return Math.round((ok.length / last7.length) * 100)
  }, [logs, calTarget])

  // Nota del coach
  const coachNote = useMemo(
    () => [...(logs || [])].reverse().find(l => l.ai_summary_night)?.ai_summary_night ?? null,
    [logs],
  )

  // Nombre de usuario
  const firstName = (userData?.name || user?.email || '').split(/[\s@]/)[0].toUpperCase() || 'ATLETA'

  return (
    <div className="pb-2">

      {/* ── Header ── */}
      <div className="pt-3 pb-5">
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-forja-primary text-[11px] font-semibold uppercase mb-1.5" style={{ letterSpacing: 1.4 }}>
              {dateLabel} · SEMANA {weekNum}
            </p>
            <h1 className="font-display text-[34px] text-forja-text leading-none truncate" style={{ letterSpacing: 1.2 }}>
              HOLA, {firstName}
            </h1>
          </div>
          <div className="w-10 h-10 rounded-full bg-forja-softFill flex items-center justify-center flex-shrink-0 font-display text-forja-text text-base" style={{ letterSpacing: 1 }}>
            {firstName.slice(0, 2)}
          </div>
        </div>
      </div>

      {/* ── Hero: hoy toca ── */}
      <div className="mb-3.5">
        <div className="bg-forja-text rounded-[20px] p-5">
          <div className="flex justify-between items-start gap-3 mb-3.5">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase mb-1" style={{ letterSpacing: 1.4, color: 'rgba(255,255,255,0.5)' }}>
                Hoy toca
              </p>
              <p className="font-display text-[26px] text-white leading-none" style={{ letterSpacing: 1 }}>
                {session ? (session.name || session.type || 'ENTRENAMIENTO').toUpperCase() : 'DESCANSO ACTIVO'}
              </p>
              <p className="text-[12px] mt-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>
                {session
                  ? `${session.exercises?.length ?? '—'} ejercicios · ~${session.duration_minutes ?? 55} min`
                  : 'Sin sesión programada hoy'}
              </p>
            </div>
            <div className="w-[42px] h-[42px] rounded-[10px] flex-shrink-0 bg-forja-primary flex items-center justify-center font-display text-white text-[13px]" style={{ letterSpacing: 1 }}>
              W{weekNum}
            </div>
          </div>
          {session && (
            <button
              onClick={() => setActiveTab('plan')}
              className="w-full bg-forja-primary text-white rounded-[14px] py-3.5 font-body font-bold text-sm transition-colors hover:bg-forja-primary-hover"
              style={{ letterSpacing: 0.3 }}
            >
              Empezar entrenamiento →
            </button>
          )}
        </div>
      </div>

      {/* ── Balance del día ── */}
      <div className="mb-3.5">
        <div className="bg-forja-surface rounded-[20px] p-[18px]" style={{ border: '0.5px solid rgba(14,16,21,0.08)', boxShadow: '0 1px 2px rgba(15,23,42,0.04)' }}>
          <div className="flex justify-between items-center mb-3">
            <span className="text-[13px] font-semibold text-forja-text">Balance del día</span>
            <span className="text-[11px] text-forja-muted">
              {remaining > 0 ? `+${remaining}` : remaining} kcal disponibles
            </span>
          </div>
          <div className="flex justify-around items-center py-1.5 pb-2.5">
            <RingProgress value={net} max={calTarget} color="#0F7A3A" label={net} sublabel="kcal"/>
            <RingProgress value={Math.round(macros.protein)} max={protTarget} color="#B8621B" label={`${Math.round(macros.protein)}g`} sublabel="Proteína"/>
            <RingProgress value={burned} max={500} color="#0E1015" label={burned} sublabel="Quemadas"/>
          </div>
          <button
            onClick={() => setActiveTab('tracker')}
            className="w-full mt-1 bg-transparent text-forja-text rounded-[12px] py-2.5 text-xs font-semibold transition-colors hover:bg-forja-softFill"
            style={{ border: '0.5px solid rgba(14,16,21,0.08)' }}
          >
            Registrar comida →
          </button>
        </div>
      </div>

      {/* ── Peso 14 días ── siempre visible */}
      <div className="mb-3.5">
        <div className="bg-forja-surface rounded-[20px] p-[18px]" style={{ border: '0.5px solid rgba(14,16,21,0.08)', boxShadow: '0 1px 2px rgba(15,23,42,0.04)' }}>
          <div className="flex justify-between mb-2.5">
            <div>
              <p className="text-forja-muted uppercase text-[10px] font-bold" style={{ letterSpacing: 1.2 }}>Peso · 14 días</p>
              <p className="font-display text-forja-text leading-none mt-1.5" style={{ fontSize: 32, letterSpacing: 1 }}>
                {weightNow ?? '–'}
                <span className="text-forja-muted ml-1" style={{ fontSize: 16 }}>kg</span>
              </p>
            </div>
            <div className="text-right">
              {weightChange !== null && (
                <span className="inline-flex items-center bg-forja-primary/[0.13] text-forja-primary rounded-full px-2 py-1 text-[10px] font-bold uppercase" style={{ letterSpacing: 0.8 }}>
                  {parseFloat(weightChange) > 0 ? '+' : ''}{weightChange} kg
                </span>
              )}
              {weightTarget && (
                <p className="text-forja-muted text-[11px] mt-1.5">Objetivo: {weightTarget} kg</p>
              )}
            </div>
          </div>
          {weightData.length > 1
            ? <WeightSpark data={weightData}/>
            : (
              <p className="text-forja-faint text-xs text-center py-4">
                Registra tu peso cada mañana para ver la evolución
              </p>
            )
          }
        </div>
      </div>

      {/* ── Racha + Adherencia ── */}
      <div className="grid grid-cols-2 gap-2.5 mb-3.5">
        <div className="bg-forja-surface rounded-[20px] p-4" style={{ border: '0.5px solid rgba(14,16,21,0.08)', boxShadow: '0 1px 2px rgba(15,23,42,0.04)' }}>
          <p className="text-forja-muted uppercase text-[10px] font-bold" style={{ letterSpacing: 1.2 }}>Racha</p>
          <p className="font-display text-forja-text leading-none my-2" style={{ fontSize: 42, letterSpacing: 1 }}>{streak}</p>
          <p className="text-forja-muted text-[11px]">días consecutivos</p>
        </div>
        <div className="bg-forja-surface rounded-[20px] p-4" style={{ border: '0.5px solid rgba(14,16,21,0.08)', boxShadow: '0 1px 2px rgba(15,23,42,0.04)' }}>
          <p className="text-forja-muted uppercase text-[10px] font-bold" style={{ letterSpacing: 1.2 }}>Adherencia 7d</p>
          <p className="font-display text-forja-primary leading-none my-2" style={{ fontSize: 42, letterSpacing: 1 }}>
            {adherence !== null ? <>{adherence}<span style={{ fontSize: 22 }}>%</span></> : '–'}
          </p>
          <p className="text-forja-muted text-[11px]">en objetivo</p>
        </div>
      </div>

      {/* ── Nota del coach ── */}
      {coachNote && (
        <div className="bg-forja-primaryDim rounded-[20px] p-4">
          <div className="flex gap-3 items-start">
            <div className="w-8 h-8 rounded-[10px] flex-shrink-0 bg-forja-primary flex items-center justify-center font-display text-white text-base" style={{ letterSpacing: 1 }}>F</div>
            <div>
              <p className="text-forja-primary uppercase text-[10px] font-bold mb-1" style={{ letterSpacing: 1.2 }}>Nota de tu coach</p>
              <p className="text-forja-text text-[13px] leading-relaxed">{coachNote}</p>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
