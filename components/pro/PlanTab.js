'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DAYS_ES } from '@/lib/utils'

const MUSCLE_GROUPS = [
  { id: '', label: 'Todos' },
  { id: 'chest', label: 'Pecho' }, { id: 'back', label: 'Espalda' },
  { id: 'shoulders', label: 'Hombros' }, { id: 'biceps', label: 'Bíceps' },
  { id: 'triceps', label: 'Tríceps' }, { id: 'legs', label: 'Piernas' },
  { id: 'glutes', label: 'Glúteos' }, { id: 'core', label: 'Core' },
  { id: 'cardio', label: 'Cardio' }, { id: 'full_body', label: 'Cuerpo completo' },
]

const EQUIPMENT_TYPES = [
  { id: '', label: 'Todo' },
  { id: 'barbell', label: 'Barra' }, { id: 'dumbbell', label: 'Mancuernas' },
  { id: 'machine', label: 'Máquina' }, { id: 'cable', label: 'Cable' },
  { id: 'bodyweight', label: 'Peso corporal' }, { id: 'kettlebell', label: 'Kettlebell' },
  { id: 'resistance_band', label: 'Banda' },
]

const SESSION_COLORS = {
  strength: '#16A34A', running: '#3B82F6', hiit: '#F97316',
  cardio: '#3B82F6', rest: '#CBD5E1', yoga: '#A78BFA',
  cycling: '#06B6D4', other: '#64748B',
}

const REST_DURATIONS = [60, 90, 120, 180]

// ── RestTimer ─────────────────────────────────────────────────────────────────
function RestTimer({ seconds, onDone }) {
  const [remaining, setRemaining] = useState(seconds)
  useEffect(() => {
    if (remaining <= 0) { onDone?.(); return }
    const t = setTimeout(() => setRemaining(r => r - 1), 1000)
    return () => clearTimeout(t)
  }, [remaining])
  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60
  const pct  = ((seconds - remaining) / seconds) * 100
  return (
    <div className="flex items-center gap-3 bg-[#0F172A] text-white rounded-xl px-4 py-3">
      <div className="relative w-12 h-12 shrink-0">
        <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1E293B" strokeWidth="3"/>
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#16A34A" strokeWidth="3"
            strokeDasharray={`${pct} 100`} strokeLinecap="round" pathLength="100"/>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-xs font-bold">
          {mins}:{String(secs).padStart(2,'0')}
        </div>
      </div>
      <div className="flex-1">
        <div className="text-sm font-semibold">Descansando...</div>
        <div className="text-xs text-white/60">Siguiente serie en {mins}:{String(secs).padStart(2,'0')}</div>
      </div>
      <button onClick={onDone} className="text-xs text-white/50 hover:text-white px-2 py-1 rounded-lg border border-white/20">Saltar</button>
    </div>
  )
}

// ── ExerciseDetailModal ───────────────────────────────────────────────────────
function ExerciseDetailModal({ exercise, onClose }) {
  if (!exercise) return null
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white p-4 border-b border-[#E2E8F0] flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-[#0F172A]">{exercise.name_es || exercise.name}</h3>
            <p className="text-xs text-[#64748B] mt-0.5">{exercise.muscle_group} · {exercise.equipment} · {exercise.difficulty}</p>
          </div>
          <button onClick={onClose} className="text-[#94A3B8] text-2xl leading-none ml-4">✕</button>
        </div>
        <div className="p-4 space-y-4">
          {exercise.instructions?.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-[#0F172A] mb-2">Cómo se hace</h4>
              <ol className="space-y-2">
                {exercise.instructions.map((step, i) => (
                  <li key={i} className="flex gap-2.5 text-sm text-[#0F172A]">
                    <span className="w-5 h-5 bg-[#16A34A] text-white rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5">{i+1}</span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
          {exercise.common_mistakes?.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-[#0F172A] mb-2">Errores comunes</h4>
              <ul className="space-y-1.5">
                {exercise.common_mistakes.map((m, i) => (
                  <li key={i} className="flex gap-2 text-sm text-[#64748B]">
                    <span className="text-orange-400 shrink-0 mt-0.5">⚠</span><span>{m}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {exercise.tips?.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-[#0F172A] mb-2">Consejos</h4>
              <ul className="space-y-1.5">
                {exercise.tips.map((t, i) => (
                  <li key={i} className="flex gap-2 text-sm text-[#64748B]">
                    <span className="text-[#16A34A] shrink-0">→</span><span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Sub-tab 1: Calendario ─────────────────────────────────────────────────────
function PlanCalendarSub({ plan, user }) {
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

  // Construir grid lunes-primero
  const firstDay   = new Date(year, month, 1)
  const lastDay    = new Date(year, month + 1, 0)
  const startOffset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1
  const days = []
  for (let i = 0; i < startOffset; i++) days.push(null)
  for (let i = 1; i <= lastDay.getDate(); i++) days.push(i)
  while (days.length % 7 !== 0) days.push(null)

  const todayStr = `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}-${String(new Date().getDate()).padStart(2,'0')}`

  const getSessionForDay = (day) => {
    if (!day) return null
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
    return sessions.find(s => s.session_date === dateStr)
  }

  const getPlanForDay = (day) => {
    if (!day) return null
    const date    = new Date(year, month, day)
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
    return plan?.training_plan?.[dayName]
  }

  const getDayStatus = (day) => {
    if (!day) return null
    const session = getSessionForDay(day)
    if (session) return session.completed ? 'completed' : 'started'
    const planned = getPlanForDay(day)
    if (!planned || planned.type === 'rest') return 'rest'
    return 'planned'
  }

  const dayColors = { completed: '#16A34A', started: '#22C55E', planned: '#93C5FD', rest: '#E2E8F0' }

  const selectedSession = selectedDay ? getSessionForDay(selectedDay) : null
  const selectedPlan    = selectedDay ? getPlanForDay(selectedDay) : null

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))

  return (
    <div className="space-y-4">
      {/* Cabecera mes */}
      <div className="flex items-center justify-between bg-white border border-[#E2E8F0] rounded-xl px-4 py-3">
        <button onClick={prevMonth} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[#F1F5F9] text-[#64748B] text-lg">‹</button>
        <span className="text-sm font-semibold text-[#0F172A] capitalize">
          {currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
        </span>
        <button onClick={nextMonth} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[#F1F5F9] text-[#64748B] text-lg">›</button>
      </div>

      {/* Grid días de la semana */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
        <div className="grid grid-cols-7 border-b border-[#E2E8F0]">
          {['L','M','X','J','V','S','D'].map(d => (
            <div key={d} className="text-center text-xs text-[#94A3B8] py-2 font-medium">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day, i) => {
            if (!day) return <div key={i} className="aspect-square"/>
            const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
            const isToday = dateStr === todayStr
            const status  = getDayStatus(day)
            const color   = dayColors[status]
            const isSelected = selectedDay === day

            return (
              <button key={i} onClick={() => setSelectedDay(isSelected ? null : day)}
                className={`aspect-square flex flex-col items-center justify-center gap-0.5 transition-colors ${isSelected ? 'bg-[#16A34A]/10' : 'hover:bg-[#F8FAFC]'}`}>
                <span className={`text-xs font-medium leading-none ${isToday ? 'text-[#16A34A] font-bold' : 'text-[#0F172A]'}`}>{day}</span>
                {status && (
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }}/>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex gap-4 px-1 text-xs text-[#64748B]">
        <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#16A34A]"/>Completado</div>
        <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#93C5FD]"/>Planificado</div>
        <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#E2E8F0]"/>Descanso</div>
      </div>

      {/* Panel día seleccionado */}
      {selectedDay && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
          <h4 className="text-sm font-semibold text-[#0F172A] mb-3">
            {new Date(year, month, selectedDay).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
          </h4>
          {selectedSession ? (
            <div className="space-y-2">
              <div className={`flex items-center gap-2 ${selectedSession.completed ? 'text-[#16A34A]' : 'text-[#64748B]'}`}>
                <span>{selectedSession.completed ? '✅' : '🔄'}</span>
                <span className="text-sm font-medium">{selectedSession.session_name}</span>
              </div>
              {selectedSession.duration_minutes && <p className="text-xs text-[#64748B]">⏱ {selectedSession.duration_minutes} minutos</p>}
              {selectedSession.workout_sets?.length > 0 && (
                <p className="text-xs text-[#64748B]">📊 {selectedSession.workout_sets.length} series registradas</p>
              )}
            </div>
          ) : selectedPlan && selectedPlan.type !== 'rest' ? (
            <div className="space-y-2">
              <p className="text-sm text-[#64748B]">💪 {selectedPlan.name || 'Entrenamiento planificado'}</p>
              <p className="text-xs text-[#94A3B8]">{selectedPlan.exercises?.length || 0} ejercicios · {selectedPlan.duration_minutes || 60} min</p>
            </div>
          ) : (
            <p className="text-sm text-[#94A3B8]">🛌 Día de descanso</p>
          )}
        </div>
      )}
    </div>
  )
}

// ── Sub-tab 2: Entrenar hoy ───────────────────────────────────────────────────
function WorkoutTodaySub({ plan, user }) {
  const today      = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
  const session    = plan?.training_plan?.[today]
  const exercises  = session?.exercises || []
  const isRestDay  = !session || session.type === 'rest'

  const supabase   = createClient()
  const startTimeRef = useRef(null)

  // Estado de la sesión
  const [sessionState, setSessionState] = useState('idle')  // idle | active | done
  const [sessionId,    setSessionId]    = useState(null)
  // { 'ex0_s1': { weight: '80', reps: '10', done: false } }
  const [setLogs,      setSetLogs]      = useState({})
  // Temporizador activo
  const [timer,        setTimer]        = useState(null)    // null | { seconds: 90 }
  const [restDuration, setRestDuration] = useState(90)
  // Récords personales y alertas
  const [prRecords,    setPrRecords]    = useState({})
  const [prAlerts,     setPrAlerts]     = useState({})      // { key: true } — muestra badge 3s
  // Modal de ejercicio
  const [exerciseModal, setExerciseModal] = useState(null)
  const [saving,         setSaving]       = useState(false)

  const startWorkout = async () => {
    // Cargar récords personales
    const { data: progress } = await supabase
      .from('exercise_progress')
      .select('exercise_name, max_weight_kg, max_reps')
      .eq('user_id', user.id)

    const records = {}
    progress?.forEach(p => { records[p.exercise_name] = p })
    setPrRecords(records)

    // Crear sesión en DB
    const today2  = new Date()
    const dateStr = `${today2.getFullYear()}-${String(today2.getMonth()+1).padStart(2,'0')}-${String(today2.getDate()).padStart(2,'0')}`
    try {
      const res  = await fetch('/api/workout-session', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start',
          session_data: {
            session_date: dateStr,
            day_of_week:  today,
            session_name: session.name || 'Entrenamiento del día',
            session_type: session.type || 'strength',
            plan_id: plan.id,
          },
        }),
      })
      const data = await res.json()
      setSessionId(data.session?.id || null)
    } catch {}
    startTimeRef.current = Date.now()
    setSessionState('active')
  }

  const updateSet = (exIdx, setIdx, field, value) => {
    const key = `ex${exIdx}_s${setIdx}`
    setSetLogs(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } }))
  }

  const markSetDone = (exIdx, setIdx, exName) => {
    const key = `ex${exIdx}_s${setIdx}`
    const log = setLogs[key] || {}
    setSetLogs(prev => ({ ...prev, [key]: { ...prev[key], done: true } }))

    // Detectar PR
    const weightKg  = parseFloat(log.weight || 0)
    const prevRecord = prRecords[exName]
    if (weightKg > 0 && (!prevRecord || weightKg > parseFloat(prevRecord.max_weight_kg || 0))) {
      setPrAlerts(prev => ({ ...prev, [key]: true }))
      setTimeout(() => setPrAlerts(prev => ({ ...prev, [key]: false })), 3000)
    }

    // Arrancar temporizador de descanso
    setTimer({ seconds: restDuration })
  }

  const showExerciseDetail = async (exName) => {
    try {
      const res  = await fetch(`/api/exercises?search=${encodeURIComponent(exName)}`)
      const data = await res.json()
      if (data.exercises?.[0]) setExerciseModal(data.exercises[0])
      else setExerciseModal({ name_es: exName, instructions: ['Consulta a tu entrenador o busca en YouTube.'], common_mistakes: [], tips: [] })
    } catch { setExerciseModal({ name_es: exName, instructions: [], common_mistakes: [], tips: [] }) }
  }

  const finishWorkout = async () => {
    setSaving(true)
    const durationMs  = startTimeRef.current ? Date.now() - startTimeRef.current : 0
    const durationMin = Math.max(1, Math.round(durationMs / 60000))

    // Loggear cada serie completada
    for (let exIdx = 0; exIdx < exercises.length; exIdx++) {
      const ex      = exercises[exIdx]
      const numSets = ex.sets || 3
      for (let setIdx = 0; setIdx < numSets; setIdx++) {
        const key = `ex${exIdx}_s${setIdx}`
        const log = setLogs[key]
        if (!log?.done) continue
        try {
          await fetch('/api/workout-session', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'log_set',
              session_id: sessionId,
              set_data: {
                exercise_name: ex.name,
                set_number:    setIdx + 1,
                reps_target:   ex.reps ? parseInt(ex.reps) || null : null,
                reps_done:     parseInt(log.reps) || null,
                weight_kg:     parseFloat(log.weight) || null,
                rest_seconds:  ex.rest_seconds || restDuration,
                completed:     true,
              },
            }),
          })
        } catch {}
      }
    }

    // Completar sesión
    if (sessionId) {
      try {
        await fetch('/api/workout-session', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'complete', session_id: sessionId, set_data: { duration_minutes: durationMin } }),
        })
      } catch {}
    }
    setSaving(false)
    setSessionState('done')
  }

  const completedSets  = Object.values(setLogs).filter(s => s.done).length
  const totalSetsCount = exercises.reduce((s, ex) => s + (ex.sets || 3), 0)

  if (isRestDay) {
    return (
      <div className="text-center py-16 space-y-3">
        <div className="text-6xl">🛌</div>
        <h3 className="font-semibold text-[#0F172A]">Día de descanso</h3>
        <p className="text-sm text-[#64748B]">Hoy toca recuperar. El descanso es parte del entrenamiento.</p>
      </div>
    )
  }

  if (sessionState === 'done') {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="text-6xl">🏆</div>
        <h3 className="font-display text-2xl text-[#0F172A]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>¡ENTRENAMIENTO COMPLETADO!</h3>
        <p className="text-sm text-[#64748B]">{completedSets} de {totalSetsCount} series registradas</p>
        <button onClick={() => { setSessionState('idle'); setSetLogs({}) }}
          className="mt-4 px-6 py-3 bg-[#16A34A] text-white rounded-xl text-sm font-semibold">
          Volver al inicio
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header del entrenamiento */}
      <div className={`rounded-xl border p-4 ${sessionState === 'active' ? 'bg-[#16A34A]/5 border-[#16A34A]/30' : 'bg-white border-[#E2E8F0]'}`}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-xs text-[#94A3B8] uppercase tracking-wider mb-1">HOY</div>
            <h3 className="font-semibold text-[#0F172A] text-lg leading-tight">{session.name || 'Entrenamiento'}</h3>
            <p className="text-xs text-[#64748B] mt-1">{exercises.length} ejercicios · ~{session.duration_minutes || 60} min</p>
          </div>
          {sessionState === 'active' && (
            <span className="text-xs bg-[#16A34A]/10 text-[#16A34A] px-2 py-1 rounded-full font-medium">
              {completedSets}/{totalSetsCount} series
            </span>
          )}
        </div>

        {/* Configurar descanso */}
        {sessionState !== 'idle' && (
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-[#64748B]">Descanso:</span>
            {REST_DURATIONS.map(s => (
              <button key={s} onClick={() => setRestDuration(s)}
                className={`text-xs px-2 py-1 rounded-lg font-medium transition-all ${restDuration === s ? 'bg-[#0F172A] text-white' : 'bg-[#F1F5F9] text-[#64748B]'}`}>
                {s}s
              </button>
            ))}
          </div>
        )}

        {sessionState === 'idle' ? (
          <button onClick={startWorkout}
            className="w-full py-3.5 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold rounded-xl text-sm transition-colors">
            EMPEZAR ENTRENAMIENTO
          </button>
        ) : (
          <button onClick={finishWorkout} disabled={saving}
            className="w-full py-3 bg-[#0F172A] hover:bg-[#1E293B] text-white font-semibold rounded-xl text-sm disabled:opacity-50">
            {saving ? 'Guardando...' : '✓ Finalizar entrenamiento'}
          </button>
        )}
      </div>

      {/* Temporizador de descanso */}
      {timer && (
        <RestTimer seconds={timer.seconds} onDone={() => setTimer(null)}/>
      )}

      {/* Lista de ejercicios */}
      {sessionState === 'active' && exercises.map((ex, exIdx) => {
        const numSets = ex.sets || 3
        const repsTarget = ex.reps || '?'

        return (
          <div key={exIdx} className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
            {/* Cabecera ejercicio */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#F1F5F9]">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-[#0F172A] text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">{exIdx+1}</span>
                  <span className="text-sm font-semibold text-[#0F172A] truncate">{ex.name}</span>
                </div>
                <p className="text-xs text-[#64748B] mt-1 pl-8">{numSets} series × {repsTarget} reps{ex.rest_seconds ? ` · ${ex.rest_seconds}s descanso` : ''}</p>
              </div>
              <button onClick={() => showExerciseDetail(ex.name)}
                className="text-xs text-[#16A34A] bg-[#16A34A]/10 px-2.5 py-1.5 rounded-lg font-medium shrink-0 ml-2">
                ℹ Ver
              </button>
            </div>

            {/* Grid de series */}
            <div className="p-3">
              <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(numSets, 4)}, 1fr)` }}>
                {Array.from({ length: numSets }, (_, setIdx) => {
                  const key  = `ex${exIdx}_s${setIdx}`
                  const log  = setLogs[key] || {}
                  const done = !!log.done
                  const pr   = prAlerts[key]

                  return (
                    <div key={setIdx} className={`rounded-xl p-2 border transition-all ${done ? 'bg-[#16A34A]/10 border-[#16A34A]/30' : 'bg-[#F8FAFC] border-[#E2E8F0]'}`}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold text-[#64748B]">S{setIdx+1}</span>
                        {done ? (
                          <span className="text-[10px] text-[#16A34A] font-bold">✓</span>
                        ) : (
                          <button onClick={() => markSetDone(exIdx, setIdx, ex.name)}
                            className="text-[10px] text-[#94A3B8] hover:text-[#16A34A] transition-colors">✓</button>
                        )}
                      </div>
                      <input
                        type="number" placeholder="kg" value={log.weight || ''} disabled={done}
                        onChange={e => updateSet(exIdx, setIdx, 'weight', e.target.value)}
                        className={`w-full text-center text-xs font-bold rounded-lg py-1 mb-1 focus:outline-none border ${done ? 'bg-[#16A34A]/5 border-transparent text-[#16A34A]' : 'bg-white border-[#E2E8F0] focus:border-[#16A34A]'}`}
                      />
                      <input
                        type="number" placeholder="reps" value={log.reps || ''} disabled={done}
                        onChange={e => updateSet(exIdx, setIdx, 'reps', e.target.value)}
                        className={`w-full text-center text-xs rounded-lg py-1 focus:outline-none border ${done ? 'bg-[#16A34A]/5 border-transparent text-[#64748B]' : 'bg-white border-[#E2E8F0] focus:border-[#16A34A]'}`}
                      />
                      {pr && (
                        <div className="mt-1 text-center text-[10px] font-bold text-amber-500 animate-bounce">🏆 PR!</div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Notas del ejercicio */}
            {ex.notes && (
              <div className="px-4 pb-3">
                <p className="text-xs text-[#64748B] italic">💡 {ex.notes}</p>
              </div>
            )}
          </div>
        )
      })}

      {/* Modal detalle ejercicio */}
      <ExerciseDetailModal exercise={exerciseModal} onClose={() => setExerciseModal(null)}/>
    </div>
  )
}

// ── Sub-tab 3: Biblioteca de ejercicios ───────────────────────────────────────
function ExerciseLibrarySub() {
  const [exercises,     setExercises]     = useState([])
  const [loading,       setLoading]       = useState(true)
  const [search,        setSearch]        = useState('')
  const [muscleFilter,  setMuscleFilter]  = useState('')
  const [equipFilter,   setEquipFilter]   = useState('')
  const [selectedEx,    setSelectedEx]    = useState(null)
  const searchTimeout = useRef(null)

  const fetchExercises = (s, m, eq) => {
    setLoading(true)
    const params = new URLSearchParams()
    if (m)  params.set('muscle_group', m)
    if (eq) params.set('equipment', eq)
    if (s)  params.set('search', s)
    fetch(`/api/exercises?${params}`)
      .then(r => r.json())
      .then(d => { setExercises(d.exercises || []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { fetchExercises('', '', '') }, [])

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => fetchExercises(search, muscleFilter, equipFilter), 400)
    return () => clearTimeout(searchTimeout.current)
  }, [search, muscleFilter, equipFilter])

  const DIFF_COLORS = { beginner: '#16A34A', intermediate: '#F97316', advanced: '#EF4444' }

  return (
    <div className="space-y-3">
      {/* Buscador */}
      <input value={search} onChange={e => setSearch(e.target.value)}
        placeholder="🔍 Buscar ejercicio..."
        className="w-full bg-white border border-[#E2E8F0] focus:border-[#16A34A] rounded-xl px-4 py-2.5 text-sm focus:outline-none"/>

      {/* Filtros */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <select value={muscleFilter} onChange={e => setMuscleFilter(e.target.value)}
          className="shrink-0 bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs focus:outline-none text-[#0F172A]">
          {MUSCLE_GROUPS.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
        </select>
        <select value={equipFilter} onChange={e => setEquipFilter(e.target.value)}
          className="shrink-0 bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs focus:outline-none text-[#0F172A]">
          {EQUIPMENT_TYPES.map(e => <option key={e.id} value={e.id}>{e.label}</option>)}
        </select>
      </div>

      {/* Lista de ejercicios */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="w-7 h-7 border-2 border-t-[#16A34A] border-[#E2E8F0] rounded-full animate-spin"/></div>
      ) : exercises.length === 0 ? (
        <div className="text-center py-12 text-sm text-[#94A3B8]">Sin resultados</div>
      ) : (
        <div className="space-y-2">
          {exercises.map(ex => (
            <button key={ex.id} onClick={() => setSelectedEx(ex)}
              className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-3 text-left hover:border-[#16A34A]/30 hover:bg-[#F8FAFC] transition-all">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-[#0F172A] truncate">{ex.name_es}</div>
                  <div className="text-xs text-[#64748B] mt-0.5">{ex.muscle_group} · {ex.equipment}</div>
                </div>
                <div className="flex items-center gap-2 ml-2 shrink-0">
                  {ex.difficulty && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                      style={{ color: DIFF_COLORS[ex.difficulty], backgroundColor: DIFF_COLORS[ex.difficulty] + '20' }}>
                      {ex.difficulty}
                    </span>
                  )}
                  <span className="text-[#94A3B8] text-sm">›</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <ExerciseDetailModal exercise={selectedEx} onClose={() => setSelectedEx(null)}/>
    </div>
  )
}

// ── PlanTab (main export) ─────────────────────────────────────────────────────
export default function PlanTab({ plan, user, initialSubTab = 'calendar', onSubTabChange }) {
  const [subTab, setSubTab] = useState(initialSubTab)

  useEffect(() => {
    if (initialSubTab && initialSubTab !== subTab) setSubTab(initialSubTab)
  }, [initialSubTab])

  const changeSubTab = (tab) => {
    setSubTab(tab)
    onSubTabChange?.(tab)
  }

  const SUB_TABS = [
    { id: 'calendar', label: 'Calendario', emoji: '📅' },
    { id: 'workout',  label: 'Entrenar hoy', emoji: '💪' },
    { id: 'library',  label: 'Ejercicios', emoji: '📚' },
  ]

  return (
    <div className="space-y-4">
      {/* Sub-navegación */}
      <div className="flex bg-[#F1F5F9] rounded-xl p-1">
        {SUB_TABS.map(t => (
          <button key={t.id} onClick={() => changeSubTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-semibold transition-all ${subTab === t.id ? 'bg-white text-[#0F172A] shadow-sm' : 'text-[#64748B]'}`}>
            <span>{t.emoji}</span><span>{t.label}</span>
          </button>
        ))}
      </div>

      {subTab === 'calendar' && <PlanCalendarSub plan={plan} user={user}/>}
      {subTab === 'workout'  && <WorkoutTodaySub plan={plan} user={user}/>}
      {subTab === 'library'  && <ExerciseLibrarySub/>}
    </div>
  )
}
