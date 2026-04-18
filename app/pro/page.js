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

  // Tabs principales del bottom bar (4 del diseño) + extra tabs accesibles desde arriba
  const BOTTOM_TABS = [
    {
      id: 'dashboard', label: 'Hoy',
      icon: (active) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M3 11l9-7 9 7v9a2 2 0 01-2 2h-3v-7h-8v7H5a2 2 0 01-2-2v-9z"
            stroke={active ? '#0F7A3A' : 'rgba(107,107,111,0.9)'} strokeWidth="1.8" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      id: 'tracker', label: 'Tracker',
      icon: (active) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke={active ? '#0F7A3A' : 'rgba(107,107,111,0.9)'} strokeWidth="1.8"/>
          <circle cx="12" cy="12" r="4" stroke={active ? '#0F7A3A' : 'rgba(107,107,111,0.9)'} strokeWidth="1.8"/>
        </svg>
      ),
    },
    {
      id: 'plan', label: 'Entrenar',
      icon: (active) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M3 9v6M7 6v12M17 6v12M21 9v6M7 12h10"
            stroke={active ? '#0F7A3A' : 'rgba(107,107,111,0.9)'} strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      id: 'coach', label: 'Coach',
      icon: (active) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M4 6a2 2 0 012-2h12a2 2 0 012 2v9a2 2 0 01-2 2h-8l-4 4v-4H6a2 2 0 01-2-2V6z"
            stroke={active ? '#0F7A3A' : 'rgba(107,107,111,0.9)'} strokeWidth="1.8" strokeLinejoin="round"/>
        </svg>
      ),
    },
  ]

  // Tabs extra (calendario, lab) accesibles desde un mini header cuando no es dashboard
  const EXTRA_TABS = [
    { id: 'calendar', label: 'Calendario' },
    { id: 'lab',      label: 'Lab'        },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-forja-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-t-forja-primary border-forja-softFill rounded-full animate-spin mx-auto mb-4"/>
          <LogoIcon size={36}/>
        </div>
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-forja-bg flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">📋</div>
          <h2 className="font-display text-3xl text-forja-text mb-3" style={{ letterSpacing: '0.05em' }}>
            NO TIENES UN PLAN AÚN
          </h2>
          <p className="text-forja-muted mb-8 leading-relaxed">Completa el diagnóstico para que la IA genere tu plan personalizado.</p>
          <button onClick={() => router.push('/onboarding')}
            className="bg-forja-primary hover:bg-forja-primary-hover text-white font-semibold px-8 py-4 rounded-xl">
            Generar mi plan →
          </button>
          <button onClick={async () => { await supabase.auth.signOut(); router.push('/') }}
            className="block mx-auto mt-4 text-sm text-forja-muted hover:text-forja-text">
            Cerrar sesión
          </button>
        </div>
      </div>
    )
  }

  const isBottomTab = BOTTOM_TABS.some(t => t.id === activeTab)

  return (
    <div className="min-h-screen bg-forja-bg text-forja-text font-body">

      {/* Mini header: solo para tabs extra (calendario, lab) */}
      {!isBottomTab && (
        <div className="sticky top-0 z-40 bg-forja-tabBarBg backdrop-blur-xl border-b border-forja-hairline">
          <div className="max-w-2xl mx-auto px-5 h-12 flex items-center justify-between">
            <div className="flex gap-1">
              {[...BOTTOM_TABS, ...EXTRA_TABS].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${activeTab === tab.id ? 'bg-forja-primary text-white' : 'text-forja-muted hover:text-forja-text'}`}>
                  {tab.label || BOTTOM_TABS.find(t => t.id === tab.id)?.label}
                </button>
              ))}
            </div>
            <button onClick={async () => { await supabase.auth.signOut(); router.push('/') }}
              className="text-xs text-forja-muted hover:text-forja-text">Salir</button>
          </div>
        </div>
      )}

      {/* Contenido */}
      <div className="max-w-2xl mx-auto px-5 pb-28">
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

      {/* Bottom tab bar editorial */}
      <nav className="fixed bottom-0 left-0 right-0 z-40"
        style={{
          background: 'rgba(245,245,242,0.92)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          borderTop: '0.5px solid rgba(14,16,21,0.08)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}>
        <div className="max-w-2xl mx-auto flex justify-around items-end px-3 pt-2 pb-2">
          {BOTTOM_TABS.map(tab => {
            const active = activeTab === tab.id
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="flex flex-col items-center gap-0.5 px-4 py-1 min-w-[56px]">
                {tab.icon(active)}
                <span className="text-[10px] font-semibold" style={{ color: active ? '#0F7A3A' : 'rgba(107,107,111,0.9)' }}>
                  {tab.label}
                </span>
              </button>
            )
          })}
        </div>
      </nav>

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
