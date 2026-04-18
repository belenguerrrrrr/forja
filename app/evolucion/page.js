'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  loadRange, aggregateToWeeks, computeProjection,
  getWeekRange, getMonthRange, getYearRange,
} from '@/lib/evolution'

function localToday() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatShortDate(iso) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

const DAY_ABBR = ['D', 'L', 'M', 'X', 'J', 'V', 'S']

// ─── BarChart SVG ─────────────────────────────────────────────────────────────
function BarChart({ bars, targetCal, width = 340, height = 160, showLabels = true }) {
  const PAD = { top: 12, bottom: showLabels ? 28 : 8, left: 8, right: 8 }
  const chartW = width - PAD.left - PAD.right
  const chartH = height - PAD.top - PAD.bottom
  const maxVal = Math.max(targetCal * 1.25, ...bars.map(b => b.value), 100)
  const barW = Math.max(2, (chartW / bars.length) * 0.55)
  const slotW = chartW / bars.length
  const targetY = PAD.top + chartH * (1 - targetCal / maxVal)

  return (
    <svg width={width} height={height} className="w-full overflow-visible">
      {/* Target line */}
      {targetCal > 0 && (
        <line
          x1={PAD.left} y1={targetY} x2={PAD.left + chartW} y2={targetY}
          stroke="#16A34A" strokeWidth={1} strokeDasharray="4 3" opacity={0.6}
        />
      )}
      {/* Bars */}
      {bars.map((bar, i) => {
        const pct = bar.value / maxVal
        const bh = Math.max(2, chartH * pct)
        const bx = PAD.left + slotW * i + (slotW - barW) / 2
        const by = PAD.top + chartH - bh
        const color = bar.value === 0 ? '#E2E8F0'
          : bar.value > targetCal ? '#DC2626'
          : bar.value > targetCal * 0.88 ? '#F59E0B'
          : '#16A34A'
        const labelDay = bar.date ? DAY_ABBR[new Date(bar.date + 'T12:00:00').getDay()] : bar.label || ''

        return (
          <g key={i}>
            <rect x={bx} y={by} width={barW} height={bh} rx={2} fill={color} opacity={bar.value === 0 ? 0.4 : 1} />
            {showLabels && (
              <text
                x={PAD.left + slotW * i + slotW / 2}
                y={height - 4}
                textAnchor="middle"
                fontSize={bars.length > 20 ? 7 : 9}
                fill={bar.isToday ? '#0F172A' : '#94A3B8'}
                fontWeight={bar.isToday ? 'bold' : 'normal'}
              >{labelDay}</text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

// ─── WeightLine SVG ───────────────────────────────────────────────────────────
function WeightLine({ snapshots, width = 340, height = 80 }) {
  const withWeight = snapshots.map((s, i) => ({ ...s, idx: i })).filter(s => s.weight !== null)
  if (withWeight.length < 2) return null

  const weights = withWeight.map(s => s.weight)
  const minW = Math.min(...weights) - 0.5
  const maxW = Math.max(...weights) + 0.5
  const PAD = { top: 12, bottom: 20, left: 8, right: 8 }
  const chartW = width - PAD.left - PAD.right
  const chartH = height - PAD.top - PAD.bottom
  const n = snapshots.length

  const toX = (idx) => PAD.left + (idx / (n - 1)) * chartW
  const toY = (w) => PAD.top + chartH * (1 - (w - minW) / (maxW - minW))

  const points = withWeight.map(s => `${toX(s.idx)},${toY(s.weight)}`).join(' ')

  return (
    <svg width={width} height={height} className="w-full overflow-visible">
      <polyline points={points} fill="none" stroke="#F59E0B" strokeWidth={2} strokeLinejoin="round" />
      {withWeight.map((s, i) => (
        <g key={i}>
          <circle cx={toX(s.idx)} cy={toY(s.weight)} r={3} fill="white" stroke="#F59E0B" strokeWidth={2} />
        </g>
      ))}
      {/* Min/max labels */}
      <text x={PAD.left} y={height - 4} fontSize={8} fill="#94A3B8">{minW.toFixed(1)}</text>
      <text x={PAD.left + chartW} y={height - 4} fontSize={8} fill="#94A3B8" textAnchor="end">{maxW.toFixed(1)} kg</text>
    </svg>
  )
}

// ─── ProjectionCard ───────────────────────────────────────────────────────────
function ProjectionCard({ projection, goal }) {
  if (!projection) {
    return (
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 text-center">
        <div className="text-2xl mb-2">📊</div>
        <p className="text-sm text-[#94A3B8]">Registra al menos 3 días para ver proyecciones</p>
      </div>
    )
  }

  const { avgDailyBalance, kgPerWeek, projectedWeight4w, projectedWeight12w, latestWeight, dataPoints } = projection
  const isDeficit = avgDailyBalance < -50
  const isSurplus = avgDailyBalance > 50
  const wantLoss = goal === 'lose_weight' || goal === 'lose_fat'
  const wantGain = goal === 'gain_muscle' || goal === 'gain_weight'
  const isGood = (isDeficit && wantLoss) || (isSurplus && wantGain) || (!isDeficit && !isSurplus)

  const balanceColor = isDeficit ? '#16A34A' : isSurplus ? '#DC2626' : '#3B82F6'
  const trendColor = kgPerWeek < -0.05 ? '#16A34A' : kgPerWeek > 0.05 ? '#DC2626' : '#3B82F6'

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-[#0F172A]">Proyección</h3>
        <span className="text-xs text-[#94A3B8]">Basada en {dataPoints} días</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#F8FAFC] rounded-xl p-3">
          <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider mb-1">Balance diario</div>
          <div className="text-xl font-bold" style={{ color: balanceColor, fontFamily: "'Bebas Neue', sans-serif" }}>
            {avgDailyBalance > 0 ? '+' : ''}{avgDailyBalance} kcal
          </div>
        </div>
        <div className="bg-[#F8FAFC] rounded-xl p-3">
          <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider mb-1">Tendencia</div>
          <div className="text-xl font-bold" style={{ color: trendColor, fontFamily: "'Bebas Neue', sans-serif" }}>
            {kgPerWeek > 0 ? '+' : ''}{kgPerWeek} kg/sem
          </div>
        </div>
      </div>

      {latestWeight && (
        <div className="space-y-2">
          <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Peso proyectado</div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'En 4 semanas', w: projectedWeight4w, delta: projectedWeight4w !== null ? projectedWeight4w - latestWeight : null },
              { label: 'En 12 semanas', w: projectedWeight12w, delta: projectedWeight12w !== null ? projectedWeight12w - latestWeight : null },
            ].map(({ label, w, delta }) => (
              <div key={label} className="bg-[#F8FAFC] rounded-xl p-3">
                <div className="text-[10px] text-[#94A3B8] mb-1">{label}</div>
                <div className="text-lg font-bold text-[#0F172A]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                  {w !== null ? `${w} kg` : '—'}
                </div>
                {delta !== null && (
                  <div className="text-xs font-medium mt-0.5" style={{ color: delta < 0 ? '#16A34A' : delta > 0 ? '#DC2626' : '#94A3B8' }}>
                    {delta > 0 ? '+' : ''}{delta.toFixed(1)} kg
                  </div>
                )}
              </div>
            ))}
          </div>
          <p className="text-[10px] text-[#CBD5E1] text-center pt-1">
            Estimación orientativa · Regla 7700 kcal = 1 kg
          </p>
        </div>
      )}
    </div>
  )
}

// ─── DayPill ─────────────────────────────────────────────────────────────────
function DayPill({ snap, targetCal, isToday }) {
  const d = new Date(snap.date + 'T12:00:00')
  const dayAbbr = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][d.getDay()]
  const dayNum = d.getDate()
  const pct = targetCal > 0 ? snap.kcal / targetCal : 0
  const color = snap.kcal === 0 ? '#CBD5E1' : pct > 1 ? '#DC2626' : pct > 0.88 ? '#F59E0B' : '#16A34A'

  return (
    <div className={`flex flex-col items-center rounded-xl p-2 min-w-0 ${isToday ? 'bg-[#F0FDF4] ring-1 ring-[#16A34A]' : 'bg-[#F8FAFC]'}`}>
      <div className="text-[9px] text-[#94A3B8] font-medium">{dayAbbr}</div>
      <div className="text-xs font-bold text-[#0F172A]">{dayNum}</div>
      <div className="text-xs font-bold mt-0.5" style={{ color }}>
        {snap.kcal > 0 ? snap.kcal : '—'}
      </div>
      {snap.weight && <div className="text-[9px] text-[#F59E0B] mt-0.5">{snap.weight}kg</div>}
    </div>
  )
}

// ─── WeekView ─────────────────────────────────────────────────────────────────
function WeekView({ snapshots, targetCal }) {
  const today = localToday()
  const bars = snapshots.map(s => ({ date: s.date, value: s.kcal, isToday: s.date === today }))

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4">
        <div className="text-xs text-[#94A3B8] mb-3 font-medium">Calorías consumidas (kcal)</div>
        <BarChart bars={bars} targetCal={targetCal} height={140} />
      </div>

      {snapshots.some(s => s.weight !== null) && (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4">
          <div className="text-xs text-[#94A3B8] mb-2 font-medium">Peso (kg)</div>
          <WeightLine snapshots={snapshots} height={80} />
        </div>
      )}

      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4">
        <div className="grid grid-cols-7 gap-1.5">
          {snapshots.map(s => (
            <DayPill key={s.date} snap={s} targetCal={targetCal} isToday={s.date === today} />
          ))}
        </div>
      </div>

      {/* Resumen semanal */}
      <WeekSummaryRow snapshots={snapshots} targetCal={targetCal} />
    </div>
  )
}

function WeekSummaryRow({ snapshots, targetCal }) {
  const active = snapshots.filter(s => s.hasData)
  if (active.length === 0) return null
  const avgKcal = Math.round(active.reduce((a, s) => a + s.kcal, 0) / active.length)
  const avgBurned = Math.round(active.reduce((a, s) => a + s.burned, 0) / active.length)
  const compliance = targetCal > 0 ? Math.round((avgKcal / targetCal) * 100) : null

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4">
      <div className="text-xs text-[#64748B] font-bold uppercase tracking-wider mb-3">Resumen semana</div>
      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <div className="text-xl font-bold text-[#0F172A]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>{avgKcal}</div>
          <div className="text-[10px] text-[#94A3B8]">Media kcal</div>
        </div>
        <div>
          <div className="text-xl font-bold text-[#3B82F6]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>{avgBurned}</div>
          <div className="text-[10px] text-[#94A3B8]">Media quemadas</div>
        </div>
        <div>
          <div className="text-xl font-bold" style={{ fontFamily: "'Bebas Neue', sans-serif", color: compliance > 105 ? '#DC2626' : compliance > 88 ? '#F59E0B' : '#16A34A' }}>
            {compliance !== null ? `${compliance}%` : '—'}
          </div>
          <div className="text-[10px] text-[#94A3B8]">Cumpl. objetivo</div>
        </div>
      </div>
    </div>
  )
}

// ─── MonthView ────────────────────────────────────────────────────────────────
function MonthView({ snapshots, targetCal }) {
  const today = localToday()
  const bars = snapshots.map(s => ({
    date: s.date,
    value: s.kcal,
    isToday: s.date === today,
    label: new Date(s.date + 'T12:00:00').getDate().toString(),
  }))

  const active = snapshots.filter(s => s.hasData)
  const avgKcal = active.length ? Math.round(active.reduce((a, s) => a + s.kcal, 0) / active.length) : 0
  const daysLogged = active.length
  const bestDay = active.reduce((best, s) => (!best || Math.abs(s.kcal - targetCal) < Math.abs(best.kcal - targetCal)) ? s : best, null)

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4">
        <div className="text-xs text-[#94A3B8] mb-3 font-medium">Calorías diarias (mes)</div>
        <BarChart bars={bars} targetCal={targetCal} height={140} />
      </div>

      {snapshots.some(s => s.weight !== null) && (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4">
          <div className="text-xs text-[#94A3B8] mb-2 font-medium">Evolución de peso</div>
          <WeightLine snapshots={snapshots} height={90} />
        </div>
      )}

      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4">
        <div className="text-xs text-[#64748B] font-bold uppercase tracking-wider mb-3">Resumen mes</div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-xl font-bold text-[#0F172A]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>{avgKcal}</div>
            <div className="text-[10px] text-[#94A3B8]">Media kcal</div>
          </div>
          <div>
            <div className="text-xl font-bold text-[#16A34A]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>{daysLogged}</div>
            <div className="text-[10px] text-[#94A3B8]">Días registrados</div>
          </div>
          <div>
            <div className="text-xl font-bold text-[#F59E0B]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
              {bestDay ? formatShortDate(bestDay.date) : '—'}
            </div>
            <div className="text-[10px] text-[#94A3B8]">Mejor día</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── YearView ─────────────────────────────────────────────────────────────────
function YearView({ snapshots, targetCal }) {
  const weeks = aggregateToWeeks(snapshots)
  const bars = weeks.map(w => ({
    date: w.monday,
    value: w.avgKcal,
    label: w.label,
    isToday: false,
  }))

  const withAvgWeight = weeks.filter(w => w.avgWeight !== null)

  const totalLogged = snapshots.filter(s => s.hasData).length
  const bestWeek = weeks.filter(w => w.activeDays > 0).reduce((best, w) => {
    if (!best) return w
    return Math.abs(w.avgKcal - targetCal) < Math.abs(best.avgKcal - targetCal) ? w : best
  }, null)

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4">
        <div className="text-xs text-[#94A3B8] mb-3 font-medium">Media semanal de calorías</div>
        <BarChart bars={bars} targetCal={targetCal} height={140} showLabels={bars.length <= 26} />
      </div>

      {withAvgWeight.length >= 2 && (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4">
          <div className="text-xs text-[#94A3B8] mb-2 font-medium">Peso medio semanal</div>
          <WeightLine
            snapshots={weeks.map(w => ({ date: w.monday, weight: w.avgWeight }))}
            height={90}
          />
        </div>
      )}

      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4">
        <div className="text-xs text-[#64748B] font-bold uppercase tracking-wider mb-3">Resumen año</div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-xl font-bold text-[#0F172A]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>{totalLogged}</div>
            <div className="text-[10px] text-[#94A3B8]">Días registrados</div>
          </div>
          <div>
            <div className="text-xl font-bold text-[#16A34A]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>{weeks.filter(w => w.activeDays > 0).length}</div>
            <div className="text-[10px] text-[#94A3B8]">Semanas activas</div>
          </div>
          <div>
            <div className="text-xl font-bold text-[#F59E0B]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
              {bestWeek ? bestWeek.label : '—'}
            </div>
            <div className="text-[10px] text-[#94A3B8]">Mejor semana</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── EvolucionPage ────────────────────────────────────────────────────────────
export default function EvolucionPage() {
  const router = useRouter()
  const [period, setPeriod]       = useState('week')
  const [plan, setPlan]           = useState(null)
  const [snapshots, setSnapshots] = useState([])
  const [projection, setProjection] = useState(null)
  const [mounted, setMounted]     = useState(false)

  useEffect(() => {
    const today = localToday()
    try { const p = localStorage.getItem('forja_plan_preview'); if (p) setPlan(JSON.parse(p)) } catch {}
    setMounted(true)
    // Cargar proyección siempre sobre los últimos 30 días
    try {
      const from30 = new Date(today + 'T12:00:00')
      from30.setDate(from30.getDate() - 29)
      const from30iso = from30.toISOString().split('T')[0]
      const last30 = loadRange(from30iso, today)
      const planData = (() => { try { return JSON.parse(localStorage.getItem('forja_plan_preview') || '{}') } catch { return {} } })()
      setProjection(computeProjection(last30, planData.daily_calories || 2000))
    } catch {}
  }, [])

  useEffect(() => {
    if (!mounted) return
    const today = localToday()
    try {
      let start, end
      if (period === 'week')  [start, end] = getWeekRange(today)
      if (period === 'month') [start, end] = getMonthRange(today)
      if (period === 'year')  [start, end] = getYearRange(today)
      setSnapshots(loadRange(start, end))
    } catch {}
  }, [period, mounted])

  if (!mounted) return null

  const targetCal = plan?.daily_calories || 2000

  return (
    <div className="min-h-screen bg-[#F8FAFC]" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0]">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => router.push('/pro')} className="text-[#94A3B8] hover:text-[#0F172A] transition-colors text-lg">←</button>
          <h1 className="font-bold text-[#0F172A] text-lg flex-1">Evolución</h1>
          <div className="text-xs text-[#94A3B8]">Objetivo: {targetCal} kcal</div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">

        {/* Period tabs */}
        <div className="flex bg-white rounded-xl border border-[#E2E8F0] p-1">
          {[['week', 'Semana'], ['month', 'Mes'], ['year', 'Año']].map(([p, lbl]) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                period === p ? 'bg-[#0F172A] text-white shadow-sm' : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >{lbl}</button>
          ))}
        </div>

        {/* Chart view */}
        {period === 'week'  && <WeekView  snapshots={snapshots} targetCal={targetCal} />}
        {period === 'month' && <MonthView snapshots={snapshots} targetCal={targetCal} />}
        {period === 'year'  && <YearView  snapshots={snapshots} targetCal={targetCal} />}

        {/* Projection (always) */}
        <div>
          <h2 className="font-bold text-[#0F172A] px-1 mb-3">Proyección de peso</h2>
          <ProjectionCard projection={projection} goal={plan?.goal} />
        </div>

        <div className="pb-8" />
      </div>
    </div>
  )
}
