'use client'

import { useState, useEffect } from 'react'

export default function CalendarTab({ user, plan, userData, logs }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [sessions,    setSessions]    = useState([])
  const [selectedDay, setSelectedDay] = useState(null)
  const [loading,     setLoading]     = useState(false)

  const year     = currentDate.getFullYear()
  const month    = currentDate.getMonth()
  const monthStr = `${year}-${String(month + 1).padStart(2,'0')}`

  useEffect(() => {
    setLoading(true)
    fetch(`/api/workout-session?month=${monthStr}`)
      .then(r => r.json())
      .then(d => { setSessions(d.sessions || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [monthStr])

  // Grid lunes-primero
  const firstDay   = new Date(year, month, 1)
  const lastDay    = new Date(year, month + 1, 0)
  const startOff   = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1
  const days = []
  for (let i = 0; i < startOff; i++) days.push(null)
  for (let i = 1; i <= lastDay.getDate(); i++) days.push(i)
  while (days.length % 7 !== 0) days.push(null)

  const todayStr = new Date().toISOString().split('T')[0]

  const dateStr = (day) => `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`

  const getSession = (day) => day ? sessions.find(s => s.session_date === dateStr(day)) : null
  const getLog     = (day) => day ? (logs || []).find(l => l.log_date === dateStr(day))  : null
  const getPlan    = (day) => {
    if (!day) return null
    const name = new Date(year, month, day).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
    return plan?.training_plan?.[name]
  }

  // Estadísticas del mes
  const monthLogs      = (logs || []).filter(l => l.log_date?.startsWith(monthStr))
  const trainedDays    = sessions.filter(s => s.completed).length
  const logsWithCal    = monthLogs.filter(l => l.calories_consumed > 0)
  const adherentDays   = plan?.daily_calories
    ? logsWithCal.filter(l => Math.abs(l.calories_consumed - plan.daily_calories) <= plan.daily_calories * 0.15).length
    : 0
  const adherencePct   = logsWithCal.length > 0 ? Math.round((adherentDays / logsWithCal.length) * 100) : null

  // Racha actual (días consecutivos con registro desde hoy hacia atrás)
  const streak = (() => {
    if (!logs?.length) return 0
    const sorted = [...logs].sort((a, b) => b.log_date.localeCompare(a.log_date))
    let count = 0
    for (const l of sorted) {
      if ((l.calories_consumed > 0) || l.weight_morning != null) count++
      else break
    }
    return count
  })()

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))

  const selSession = selectedDay ? getSession(selectedDay) : null
  const selLog     = selectedDay ? getLog(selectedDay) : null
  const selPlan    = selectedDay ? getPlan(selectedDay) : null

  return (
    <div className="space-y-4 pb-8">

      {/* Estadísticas del mes */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-[#16A34A]">{trainedDays}</div>
          <div className="text-[10px] text-[#94A3B8] mt-0.5">días entrenados</div>
        </div>
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-[#16A34A]">{adherencePct !== null ? `${adherencePct}%` : '—'}</div>
          <div className="text-[10px] text-[#94A3B8] mt-0.5">adherencia kcal</div>
        </div>
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-[#16A34A]">{streak}</div>
          <div className="text-[10px] text-[#94A3B8] mt-0.5">racha actual 🔥</div>
        </div>
      </div>

      {/* Navegación mes */}
      <div className="flex items-center justify-between bg-white border border-[#E2E8F0] rounded-xl px-4 py-3">
        <button onClick={prevMonth} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[#F1F5F9] text-[#64748B] text-lg">‹</button>
        <span className="text-sm font-semibold text-[#0F172A] capitalize">
          {currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
        </span>
        <button onClick={nextMonth} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[#F1F5F9] text-[#64748B] text-lg">›</button>
      </div>

      {/* Grid calendario */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
        <div className="grid grid-cols-7 border-b border-[#E2E8F0]">
          {['L','M','X','J','V','S','D'].map(d => (
            <div key={d} className="text-center text-[10px] text-[#94A3B8] py-2 font-medium">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day, i) => {
            if (!day) return <div key={i} className="aspect-square"/>
            const ds         = dateStr(day)
            const isToday    = ds === todayStr
            const session    = getSession(day)
            const log        = getLog(day)
            const plannedSes = getPlan(day)
            const isSelected = selectedDay === day

            // Punto de entrenamiento
            let workoutDot = null
            if (session?.completed) workoutDot = '#16A34A'
            else if (session && !session.completed) workoutDot = '#22C55E'
            else if (plannedSes && plannedSes.type !== 'rest') workoutDot = '#93C5FD'

            // Barra de nutrición
            let nutritionColor = null
            if (log?.calories_consumed > 0 && plan?.daily_calories) {
              const diff = Math.abs(log.calories_consumed - plan.daily_calories) / plan.daily_calories
              nutritionColor = diff <= 0.15 ? '#16A34A' : diff <= 0.30 ? '#F97316' : '#EF4444'
            }

            return (
              <button key={i} onClick={() => setSelectedDay(isSelected ? null : day)}
                className={`aspect-square flex flex-col items-center justify-center gap-0.5 transition-colors ${isSelected ? 'bg-[#16A34A]/10' : 'hover:bg-[#F8FAFC]'}`}>
                <span className={`text-xs leading-none ${isToday ? 'text-[#16A34A] font-bold' : 'text-[#0F172A] font-medium'}`}>{day}</span>
                <div className="flex gap-0.5 items-center">
                  {workoutDot  && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: workoutDot }}/>}
                  {nutritionColor && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: nutritionColor }}/>}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 px-1 text-[10px] text-[#64748B]">
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]"/>Entrenado</span>
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#93C5FD]"/>Planificado</span>
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]"/>Kcal en objetivo</span>
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#F97316]"/>Kcal pasado</span>
      </div>

      {/* Detalle del día seleccionado */}
      {selectedDay && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 space-y-3">
          <h4 className="text-sm font-semibold text-[#0F172A]">
            {new Date(year, month, selectedDay).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
          </h4>

          {/* Entrenamiento */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-[#64748B] uppercase tracking-wider">Entrenamiento</p>
            {selSession ? (
              <div className={`flex items-center gap-2 p-2 rounded-xl ${selSession.completed ? 'bg-[#16A34A]/5' : 'bg-[#F8FAFC]'}`}>
                <span>{selSession.completed ? '✅' : '🔄'}</span>
                <div>
                  <p className="text-sm font-medium text-[#0F172A]">{selSession.session_name}</p>
                  {selSession.duration_minutes && <p className="text-xs text-[#64748B]">{selSession.duration_minutes} min</p>}
                </div>
              </div>
            ) : selPlan && selPlan.type !== 'rest' ? (
              <div className="flex items-center gap-2 p-2 bg-[#F8FAFC] rounded-xl">
                <span>📋</span>
                <p className="text-sm text-[#64748B]">{selPlan.name || 'Entrenamiento planificado'}</p>
              </div>
            ) : (
              <p className="text-sm text-[#94A3B8] p-2">🛌 Día de descanso</p>
            )}
          </div>

          {/* Nutrición */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-[#64748B] uppercase tracking-wider">Nutrición</p>
            {selLog?.calories_consumed > 0 ? (
              <div className="bg-[#F8FAFC] rounded-xl p-3 grid grid-cols-4 gap-2 text-center">
                <div>
                  <div className="text-sm font-bold text-[#0F172A]">{selLog.calories_consumed}</div>
                  <div className="text-[10px] text-[#94A3B8]">kcal</div>
                </div>
                <div>
                  <div className="text-sm font-bold text-[#16A34A]">{Math.round(selLog.protein_consumed || 0)}g</div>
                  <div className="text-[10px] text-[#94A3B8]">prot.</div>
                </div>
                <div>
                  <div className="text-sm font-bold text-[#15803D]">{Math.round(selLog.carbs_consumed || 0)}g</div>
                  <div className="text-[10px] text-[#94A3B8]">carbos</div>
                </div>
                <div>
                  <div className="text-sm font-bold text-[#22C55E]">{Math.round(selLog.fat_consumed || 0)}g</div>
                  <div className="text-[10px] text-[#94A3B8]">grasas</div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-[#94A3B8] p-2">Sin registros de comida</p>
            )}
          </div>

          {/* Peso */}
          {selLog?.weight_morning && (
            <div className="flex items-center justify-between bg-[#F8FAFC] rounded-xl px-3 py-2">
              <span className="text-xs text-[#64748B]">Peso registrado</span>
              <span className="text-sm font-bold text-[#0F172A]">{selLog.weight_morning} kg</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
