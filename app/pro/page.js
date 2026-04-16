'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DAYS_ES, GOALS_ES } from '@/lib/utils'
import { LogoNav, LogoIcon } from '@/components/shared/Logo'
import BottomNav from '@/components/shared/BottomNav'

import TrackerTab  from '@/components/pro/TrackerTab'
import PlanTab     from '@/components/pro/PlanTab'
import CalendarTab from '@/components/pro/CalendarTab'
import CoachTab    from '@/components/pro/CoachTab'
import LabTab      from '@/components/pro/LabTab'

// ── DashboardTab (inline — pequeño y sin dependencias extra) ──────────────────
function DashboardTab({ plan, userData, logs, setActiveTab }) {
  const weightData = useMemo(() =>
    (logs || []).filter(l => l.weight_morning != null).map(l => ({
      date: l.log_date, weight: parseFloat(l.weight_morning),
    })), [logs])

  const weightToday   = weightData[weightData.length - 1]?.weight ?? null
  const weightInitial = userData?.current_weight ? parseFloat(userData.current_weight) : null
  const weightTarget  = userData?.target_weight  ? parseFloat(userData.target_weight)  : null
  const weightChange  = weightToday != null && weightInitial != null
    ? (weightToday - weightInitial).toFixed(1) : null

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

  const adherence7 = useMemo(() => {
    if (!logs?.length || !plan?.daily_calories) return null
    const last7 = logs.slice(-7).filter(l => l.calories_consumed > 0)
    if (!last7.length) return null
    const ok = last7.filter(l => Math.abs(l.calories_consumed - plan.daily_calories) <= plan.daily_calories * 0.15)
    return Math.round((ok.length / last7.length) * 100)
  }, [logs, plan])

  const lastSummary = useMemo(() =>
    [...(logs || [])].reverse().find(l => l.ai_summary_night)?.ai_summary_night ?? null, [logs])

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
          {[
            { label: 'Hoy', value: weightToday, color: 'text-[#0F172A]', bg: 'bg-[#F8FAFC]' },
            { label: 'Inicial', value: weightInitial, color: 'text-[#64748B]', bg: 'bg-[#F8FAFC]' },
            { label: 'Objetivo', value: weightTarget, color: 'text-[#16A34A]', bg: 'bg-[#16A34A]/10' },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className={`${bg} rounded-xl p-3`}>
              <div className="text-xs text-[#94A3B8] mb-1">{label}</div>
              <div className={`text-xl font-bold ${color}`}>{value ?? '–'}</div>
              <div className="text-xs text-[#94A3B8]">kg</div>
            </div>
          ))}
        </div>
        {weightData.length > 1 && (
          <>
            <div className="flex items-end gap-0.5 h-16">
              {weightData.slice(-30).map((w, i) => {
                const vals  = weightData.slice(-30).map(x => x.weight)
                const min   = Math.min(...vals); const max = Math.max(...vals)
                const range = max - min || 1
                const pct   = ((w.weight - min) / range) * 100
                return (
                  <div key={i} className="flex-1 flex flex-col justify-end">
                    <div className="rounded-sm bg-[#16A34A]/60 min-h-[4px]" style={{ height: `${Math.max(8, pct)}%` }}/>
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
        {[
          { label: 'Racha actual', value: streak, unit: 'días registrados 🔥' },
          { label: 'Adherencia 7 días', value: adherence7 !== null ? `${adherence7}%` : '–', unit: 'días en objetivo' },
          { label: 'Puntuación plan', value: plan?.health_score ?? '–', unit: '/ 100' },
          { label: 'Kcal objetivo', value: plan?.daily_calories ?? '–', unit: 'kcal/día' },
        ].map(({ label, value, unit }) => (
          <div key={label} className="bg-white border border-[#E2E8F0] rounded-xl p-4">
            <div className="text-xs text-[#94A3B8] mb-1">{label}</div>
            <div className="text-2xl font-bold text-[#16A34A]">{value}</div>
            <div className="text-xs text-[#94A3B8]">{unit}</div>
          </div>
        ))}
      </div>

      {lastSummary && (
        <div className="bg-[#0F172A] text-white rounded-xl p-5">
          <div className="text-xs text-white/50 mb-2 uppercase tracking-wider">Último resumen nocturno</div>
          <p className="text-sm text-white/80 leading-relaxed">{lastSummary}</p>
        </div>
      )}

      <button onClick={() => setActiveTab('tracker')}
        className="w-full bg-[#16A34A] hover:bg-[#15803D] text-white font-semibold py-4 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
        🍽️ Abrir Tracker de hoy
      </button>
    </div>
  )
}

// ── ProContent ────────────────────────────────────────────────────────────────
function ProContent() {
  const router   = useRouter()
  const supabase = createClient()

  const [user,      setUser]      = useState(null)
  const [plan,      setPlan]      = useState(null)
  const [userData,  setUserData]  = useState(null)
  const [logs,      setLogs]      = useState([])
  const [loading,   setLoading]   = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  // Sub-tab del Plan — permite navegar desde Tracker directamente a "workout"
  const [planSubTab, setPlanSubTab] = useState('calendar')

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) { router.push('/auth'); return }

        const { data: profile } = await supabase.from('profiles').select('plan,subscription_status').eq('id', session.user.id).maybeSingle()
        const isPro = ['pro_monthly','pro_annual','lifetime'].includes(profile?.plan)
        if (!isPro) { setLoading(false); return }

        const uid = session.user.id
        setUser(session.user)

        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        const since = thirtyDaysAgo.toISOString().split('T')[0]

        const [{ data: planData }, { data: ud }, { data: logsData }] = await Promise.all([
          supabase.from('plans').select('*').eq('user_id', uid).eq('is_active', true).order('created_at', { ascending: false }).limit(1).maybeSingle(),
          supabase.from('user_data').select('*').eq('user_id', uid).maybeSingle(),
          supabase.from('daily_logs').select('*').eq('user_id', uid).gte('log_date', since).order('log_date', { ascending: true }),
        ])
        setPlan(planData); setUserData(ud); setLogs(logsData || [])
      } catch (err) {
        console.error('Error loading pro dashboard:', err)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  const TABS = [
    { id: 'dashboard', label: 'Dashboard',  emoji: '📊' },
    { id: 'tracker',   label: 'Tracker',    emoji: '🍽️' },
    { id: 'plan',      label: 'Mi Plan',    emoji: '📋' },
    { id: 'calendar',  label: 'Calendario', emoji: '📅' },
    { id: 'coach',     label: 'Coach',      emoji: '🤖' },
    { id: 'lab',       label: 'Lab',        emoji: '🧪' },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-t-[#16A34A] border-[#E2E8F0] rounded-full animate-spin mx-auto mb-4"/>
          <LogoIcon size={36}/>
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
          <p className="text-[#64748B] mb-8 leading-relaxed">Completa el diagnóstico para que la IA genere tu plan personalizado.</p>
          <button onClick={() => router.push('/onboarding')}
            className="bg-[#16A34A] hover:bg-[#15803D] text-white font-semibold px-8 py-4 rounded-xl">
            Generar mi plan →
          </button>
          <button onClick={async () => { await supabase.auth.signOut(); router.push('/') }}
            className="block mx-auto mt-4 text-sm text-[#64748B] hover:text-[#0F172A]">
            Cerrar sesión
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header + tabs */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-[#E2E8F0]">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <LogoNav/>
            <button onClick={async () => { await supabase.auth.signOut(); router.push('/') }}
              className="text-xs text-[#64748B] hover:text-[#0F172A]">Salir</button>
          </div>
          <div className="flex overflow-x-auto gap-1 pb-2 scrollbar-hide">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === tab.id ? 'bg-[#16A34A] text-white' : 'text-[#64748B] hover:text-[#0F172A]'}`}>
                <span>{tab.emoji}</span><span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
        {activeTab === 'dashboard' && (
          <DashboardTab plan={plan} userData={userData} logs={logs} setActiveTab={setActiveTab}/>
        )}
        {activeTab === 'tracker' && (
          <TrackerTab
            user={user} plan={plan} userData={userData}
            onGoToWorkout={() => { setActiveTab('plan'); setPlanSubTab('workout') }}
          />
        )}
        {activeTab === 'plan' && (
          <PlanTab
            plan={plan} user={user}
            initialSubTab={planSubTab}
            onSubTabChange={setPlanSubTab}
          />
        )}
        {activeTab === 'calendar' && (
          <CalendarTab user={user} plan={plan} userData={userData} logs={logs}/>
        )}
        {activeTab === 'coach' && <CoachTab user={user}/>}
        {activeTab === 'lab'   && <LabTab plan={plan} userData={userData}/>}
      </div>
      <BottomNav isPro/>
    </div>
  )
}

export default function ProPage() {
  return (
    <Suspense>
      <ProContent/>
    </Suspense>
  )
}
