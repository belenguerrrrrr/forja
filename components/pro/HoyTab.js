'use client'

import { useMemo } from 'react'
import { useTracker } from '@/hooks/useTracker'

// ── Sub-componentes ───────────────────────────────────────────────────────────

function RingProgress({ value, max, size = 82, stroke = 7, color, label, sublabel }) {
  const pct  = Math.min(100, Math.max(0, max > 0 ? (value / max) * 100 : 0))
  const r    = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} stroke="#EFEFEA" strokeWidth={stroke} fill="none"/>
        <circle cx={size/2} cy={size/2} r={r} stroke={color}   strokeWidth={stroke} fill="none"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"/>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, letterSpacing: 1, lineHeight: 1, color: '#0E1015' }}>
          {label}
        </span>
        <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase', color: '#6B6B6F', marginTop: 2 }}>
          {sublabel}
        </span>
      </div>
    </div>
  )
}

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
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="hoySparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#0F7A3A" stopOpacity="0.18"/>
          <stop offset="100%" stopColor="#0F7A3A" stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={area} fill="url(#hoySparkFill)"/>
      <path d={path} fill="none" stroke="#0F7A3A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      {pts.map(([x, y], i) => i === pts.length - 1 && (
        <circle key={i} cx={x} cy={y} r="3" fill="#0F7A3A" stroke="#FFFFFF" strokeWidth="1.5"/>
      ))}
    </svg>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const BEBAS = { fontFamily: "'Bebas Neue',sans-serif" }
const EYEBROW = {
  fontSize: 10, fontWeight: 700, letterSpacing: 1.2,
  textTransform: 'uppercase', color: '#6B6B6F',
}
const EYEBROW_PRIMARY = { ...EYEBROW, color: '#0F7A3A' }
const EYEBROW_ACCENT  = { ...EYEBROW, letterSpacing: 1.4, color: '#0F7A3A' }

function Card({ children, hero = false, style = {}, pad = 18 }) {
  return (
    <div style={{
      background:   hero ? '#0E1015' : '#FFFFFF',
      color:        hero ? '#fff'    : '#0E1015',
      borderRadius: 20,
      padding:      pad,
      border:       hero ? 'none' : '0.5px solid rgba(14,16,21,0.08)',
      boxShadow:    hero ? 'none' : '0 1px 2px rgba(15,23,42,0.04)',
      ...style,
    }}>
      {children}
    </div>
  )
}

function StatusPill({ children, primary = false }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      background: primary ? '#0F7A3A22' : '#EFEFEA',
      color:      primary ? '#0F7A3A'   : '#6B6B6F',
      fontSize: 10, fontWeight: 700, letterSpacing: 0.8,
      textTransform: 'uppercase',
      padding: '4px 8px', borderRadius: 999,
      fontFamily: "'DM Sans',sans-serif",
    }}>
      {children}
    </span>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function HoyTab({ user, plan, userData, logs, setActiveTab }) {
  const { foodEntries, workoutEntries } = useTracker(user?.id)

  // ── Fecha ─────────────────────────────────────────────────────────────────
  const todayKey = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
  const dateLabel = new Date().toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'short',
  }).toUpperCase()

  // ── Sesión de hoy del training_plan ───────────────────────────────────────
  const session = plan?.training_plan?.[todayKey] ?? null

  // ── Macros de hoy (de food_entries) ──────────────────────────────────────
  const macros = useMemo(() => {
    const base = { cal: 0, protein: 0 }
    return (foodEntries || []).reduce((a, e) => ({
      cal:     a.cal     + (e.calories || 0),
      protein: a.protein + (e.protein  || 0),
    }), base)
  }, [foodEntries])

  const burned = useMemo(
    () => (workoutEntries || []).reduce((a, w) => a + (w.calories_burned || 0), 0),
    [workoutEntries],
  )

  const calTarget  = plan?.daily_calories    ?? 2200
  const protTarget = plan?.protein_grams     ?? 165
  const net        = Math.round(macros.cal)
  const remaining  = calTarget - (net - burned)

  // ── Datos de peso (últimos 14 días) ───────────────────────────────────────
  const weightData = useMemo(() =>
    (logs || [])
      .filter(l => l.weight_morning != null)
      .slice(-14)
      .map(l => ({ d: l.log_date, w: parseFloat(l.weight_morning) })),
    [logs],
  )
  const weightNow    = weightData[weightData.length - 1]?.w ?? null
  const weightFirst  = weightData[0]?.w                    ?? null
  const weightChange = weightNow != null && weightFirst != null
    ? (weightNow - weightFirst).toFixed(1) : null
  const weightTarget = userData?.target_weight ? parseFloat(userData.target_weight) : null

  // ── Racha ─────────────────────────────────────────────────────────────────
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

  // ── Adherencia 7 días ────────────────────────────────────────────────────
  const adherence = useMemo(() => {
    if (!logs?.length || !calTarget) return null
    const last7 = logs.slice(-7).filter(l => l.calories_consumed > 0)
    if (!last7.length) return null
    const ok = last7.filter(l => Math.abs(l.calories_consumed - calTarget) <= calTarget * 0.15)
    return Math.round((ok.length / last7.length) * 100)
  }, [logs, calTarget])

  // ── Nota del coach ────────────────────────────────────────────────────────
  const coachNote = useMemo(
    () => [...(logs || [])].reverse().find(l => l.ai_summary_night)?.ai_summary_night ?? null,
    [logs],
  )

  // ── Nombre del usuario ────────────────────────────────────────────────────
  const firstName = (userData?.name || user?.email || '').split(/[\s@]/)[0].toUpperCase() || 'ATLETA'

  // ── Semana (número de semana del año) ────────────────────────────────────
  const weekNum = (() => {
    const d  = new Date()
    const yd = new Date(d.getFullYear(), 0, 1)
    return String(Math.ceil(((d - yd) / 86400000 + yd.getDay() + 1) / 7)).padStart(2, '0')
  })()

  return (
    <div style={{ paddingBottom: 8 }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={{ padding: '14px 0 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ ...EYEBROW_ACCENT, marginBottom: 6 }}>
              {dateLabel} · SEMANA {weekNum}
            </div>
            <h1 style={{
              ...BEBAS, fontSize: 34, letterSpacing: 1.2, lineHeight: 1,
              margin: 0, color: '#0E1015', whiteSpace: 'nowrap',
              overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              HOLA, {firstName}
            </h1>
          </div>
          <div style={{
            width: 40, height: 40, borderRadius: 999, background: '#EFEFEA', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            ...BEBAS, fontSize: 16, letterSpacing: 1, color: '#0E1015',
          }}>
            {firstName.slice(0, 2)}
          </div>
        </div>
      </div>

      {/* ── Hero: hoy toca ──────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 14 }}>
        <Card hero pad={20}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.4, textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
                Hoy toca
              </div>
              <div style={{ ...BEBAS, fontSize: 26, letterSpacing: 1, lineHeight: 1 }}>
                {session ? (session.name || session.type || 'ENTRENAMIENTO').toUpperCase() : 'DESCANSO ACTIVO'}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 6 }}>
                {session
                  ? `${session.exercises?.length ?? '—'} ejercicios · ~${session.duration_minutes ?? 55} min`
                  : 'Sin sesión programada hoy'}
              </div>
            </div>
            <div style={{
              width: 42, height: 42, borderRadius: 10, flexShrink: 0,
              background: '#0F7A3A',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              ...BEBAS, fontSize: 13, letterSpacing: 1, color: '#fff',
            }}>
              W{weekNum}
            </div>
          </div>
          {session && (
            <button
              onClick={() => setActiveTab('plan')}
              style={{
                width: '100%', background: '#0F7A3A', color: '#fff',
                border: 'none', borderRadius: 14, padding: '14px',
                fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 14,
                letterSpacing: 0.3, cursor: 'pointer',
              }}
            >
              Empezar entrenamiento →
            </button>
          )}
        </Card>
      </div>

      {/* ── Balance del día ─────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 14 }}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#0E1015' }}>Balance del día</span>
            <span style={{ fontSize: 11, color: '#6B6B6F' }}>
              {remaining > 0 ? `+${remaining}` : remaining} kcal disponibles
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '6px 0 10px' }}>
            <RingProgress
              value={net} max={calTarget} color="#0F7A3A"
              label={net} sublabel="kcal"
            />
            <RingProgress
              value={Math.round(macros.protein)} max={protTarget} color="#B8621B"
              label={`${Math.round(macros.protein)}g`} sublabel="Proteína"
            />
            <RingProgress
              value={burned} max={500} color="#0E1015"
              label={burned} sublabel="Quemadas"
            />
          </div>
          <button
            onClick={() => setActiveTab('tracker')}
            style={{
              width: '100%', marginTop: 4, background: 'transparent',
              border: '0.5px solid rgba(14,16,21,0.08)', borderRadius: 12,
              padding: '10px', color: '#0E1015',
              fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 12,
              cursor: 'pointer',
            }}
          >
            Registrar comida →
          </button>
        </Card>
      </div>

      {/* ── Peso · 14 días ──────────────────────────────────────────────────── */}
      {weightData.length > 1 && (
        <div style={{ marginBottom: 14 }}>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <div>
                <div style={EYEBROW}>Peso · 14 días</div>
                <div style={{ ...BEBAS, fontSize: 32, letterSpacing: 1, color: '#0E1015', lineHeight: 1, marginTop: 6 }}>
                  {weightNow}
                  <span style={{ fontSize: 16, color: '#6B6B6F', letterSpacing: 0.5, marginLeft: 4 }}>kg</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                {weightChange !== null && (
                  <StatusPill primary>
                    {parseFloat(weightChange) > 0 ? '+' : ''}{weightChange} kg
                  </StatusPill>
                )}
                {weightTarget && (
                  <div style={{ fontSize: 11, color: '#6B6B6F', marginTop: 6 }}>
                    Objetivo: {weightTarget} kg
                  </div>
                )}
              </div>
            </div>
            <WeightSpark data={weightData}/>
          </Card>
        </div>
      )}

      {/* ── Racha + Adherencia ──────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
        <Card pad={16}>
          <div style={EYEBROW}>Racha</div>
          <div style={{ ...BEBAS, fontSize: 42, letterSpacing: 1, color: '#0E1015', lineHeight: 1, margin: '8px 0 4px' }}>
            {streak}
          </div>
          <div style={{ fontSize: 11, color: '#6B6B6F' }}>días consecutivos</div>
        </Card>
        <Card pad={16}>
          <div style={EYEBROW}>Adherencia 7d</div>
          <div style={{ ...BEBAS, fontSize: 42, letterSpacing: 1, color: '#0F7A3A', lineHeight: 1, margin: '8px 0 4px' }}>
            {adherence !== null ? <>{adherence}<span style={{ fontSize: 22 }}>%</span></> : '–'}
          </div>
          <div style={{ fontSize: 11, color: '#6B6B6F' }}>en objetivo</div>
        </Card>
      </div>

      {/* ── Nota del coach ──────────────────────────────────────────────────── */}
      {coachNote && (
        <Card pad={16} style={{ background: '#DDECE2', border: 'none' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10, flexShrink: 0,
              background: '#0F7A3A', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              ...BEBAS, fontSize: 16, letterSpacing: 1,
            }}>F</div>
            <div>
              <div style={{ ...EYEBROW_PRIMARY, marginBottom: 4 }}>Nota de tu coach</div>
              <div style={{ fontSize: 13, color: '#0E1015', lineHeight: 1.5 }}>{coachNote}</div>
            </div>
          </div>
        </Card>
      )}

    </div>
  )
}
