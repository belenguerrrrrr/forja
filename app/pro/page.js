'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogoNav, LogoIcon } from '@/components/shared/Logo'
import BottomNav from '@/components/shared/BottomNav'

import HoyTab      from '@/components/pro/HoyTab'
import TrackerTab  from '@/components/pro/TrackerTab'
import PlanTab     from '@/components/pro/PlanTab'
import CalendarTab from '@/components/pro/CalendarTab'
import CoachTab    from '@/components/pro/CoachTab'
import LabTab      from '@/components/pro/LabTab'

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
          <HoyTab user={user} plan={plan} userData={userData} logs={logs} setActiveTab={setActiveTab}/>
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
            onPlanUpdate={setPlan}
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
