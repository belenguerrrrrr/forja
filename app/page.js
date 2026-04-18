'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogoNav, LogoIcon } from '@/components/shared/Logo'

// ─── Datos ────────────────────────────────────────────────────────────────────

const FEATURES_FREE = [
  'Diagnóstico completo de tu condición física',
  'Puntuación de salud del 1 al 100',
  'Plan de entrenamiento básico semanal',
  'Objetivo calórico y distribución de macros',
  'Resumen personalizado generado por IA',
]

const FEATURES_PRO = [
  'Todo lo incluido en el plan gratuito',
  'Tracker diario de comidas y ejercicio',
  'Registro de peso y progreso diario',
  'AI Coach ilimitado disponible 24/7',
  'Ajuste automático del plan cada semana',
  'Informes semanales por email',
  'Historial completo de progreso',
]

const STEPS = [
  {
    num: '01',
    title: 'Cuéntanos quién eres',
    desc: '10 preguntas. Tu objetivo, tus datos físicos, tu disponibilidad, tus restricciones. La IA necesita conocerte para crear algo que funcione de verdad.',
    icon: '🎯',
    mockup: 'onboarding',
  },
  {
    num: '02',
    title: 'Recibe tu plan en 2 minutos',
    desc: 'Plan de entrenamiento semanal completo, objetivo calórico exacto y distribución de macros calculados específicamente para ti y tu objetivo.',
    icon: '⚡',
    mockup: 'diagnostico',
  },
  {
    num: '03',
    title: 'Registra, progresa, ajusta',
    desc: 'Registra lo que comes y entrenas cada día. Si no progresas al ritmo esperado, FORJA ajusta tu plan automáticamente. Sin excusas.',
    icon: '🔥',
    mockup: 'tracker',
  },
]

const TESTIMONIALS = [
  {
    name: 'Marta G.',
    city: 'Madrid',
    result: '−12kg en 4 meses',
    text: 'Llevaba años intentándolo con apps genéricas. FORJA fue lo primero que se adaptó a mí de verdad: mis horarios, mis alergias, mi nivel. El AI Coach me ha sacado de más de un bache.',
    avatar: 'M',
    color: '#16A34A',
    score: 5,
  },
  {
    name: 'Carlos R.',
    city: 'Barcelona',
    result: '+8kg de músculo',
    text: 'Entreno en casa sin equipamiento y tenía dudas de que pudiera funcionar. El plan que generó FORJA es brutal — rutinas progresivas, ajuste de macros cada semana. Ya voy por el cuarto mes.',
    avatar: 'C',
    color: '#2563EB',
    score: 5,
  },
  {
    name: 'Lucía M.',
    city: 'Valencia',
    result: 'Primera maratón',
    text: 'El tracking diario me mantuvo honesta. Sabes exactamente dónde estás y qué tienes que hacer ese día. Cuando me lesioné la rodilla, el plan se adaptó solo en 24 horas.',
    avatar: 'L',
    color: '#D97706',
    score: 5,
  },
]

const FAQS = [
  {
    q: '¿Necesito experiencia previa en fitness?',
    a: 'No. FORJA adapta el plan a tu nivel actual, desde sedentario total hasta atleta avanzado. El cuestionario inicial detecta exactamente dónde estás.',
  },
  {
    q: '¿Funciona si entreno en casa sin gimnasio?',
    a: 'Sí. El plan se genera específicamente para tu situación — gimnasio completo, solo mancuernas, o cero equipamiento. Las rutinas son completamente diferentes según tus recursos.',
  },
  {
    q: '¿Puedo cancelar cuando quiera?',
    a: 'Siempre. Sin permanencia, sin letra pequeña. Cancelas desde tu perfil y mantienes el acceso hasta el final del período pagado.',
  },
  {
    q: '¿Cada cuánto se ajusta el plan?',
    a: 'La IA analiza tu progreso semanalmente. Si detecta que no estás avanzando según lo esperado, ajusta calorías, macros o intensidad de entrenamiento automáticamente.',
  },
  {
    q: '¿Cuánto cuesta realmente usar la IA?',
    a: 'Nada extra. El coste de la IA está incluido en tu suscripción Pro. Sin sorpresas, sin créditos, sin límites ocultos.',
  },
  {
    q: '¿Qué pasa con mis datos si cancelo?',
    a: 'Tus datos son tuyos. Puedes exportarlos en cualquier momento y los conservamos 30 días tras la cancelación por si cambias de idea.',
  },
]

// ─── Componentes internos ─────────────────────────────────────────────────────

function UserMenu({ email }) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-[#F1F5F9] hover:bg-[#E2E8F0] px-3 py-2 rounded-xl transition-colors"
      >
        <div className="w-7 h-7 rounded-full bg-[#16A34A] flex items-center justify-center text-white text-xs font-bold">
          {email?.[0]?.toUpperCase()}
        </div>
        <span className="text-sm text-[#0F172A] hidden md:block max-w-[120px] truncate">{email}</span>
        <span className="text-[#64748B] text-xs">▾</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 bg-white border border-[#E2E8F0] rounded-xl shadow-lg py-1 min-w-[160px] z-50">
          <button
            onClick={() => router.push('/pro')}
            className="w-full text-left px-4 py-2.5 text-sm text-[#0F172A] hover:bg-[#F8FAFC] transition-colors"
          >
            Mi dashboard →
          </button>
          <button
            onClick={() => router.push('/pro')}
            className="w-full text-left px-4 py-2.5 text-sm text-[#0F172A] hover:bg-[#F8FAFC] transition-colors"
          >
            Mi tracker →
          </button>
          <div className="border-t border-[#E2E8F0] my-1"/>
          <button
            onClick={handleSignOut}
            className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-[#FEF2F2] transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  )
}

function NavBar({ onCTA }) {
  const [scrolled, setScrolled]     = useState(false)
  const [userEmail, setUserEmail]   = useState(null)
  const router   = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', h)
    return () => window.removeEventListener('scroll', h)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setUserEmail(session.user.email)
    })
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white shadow-sm border-b border-[#E2E8F0]'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="cursor-pointer" onClick={() => router.push('/')}>
          <LogoNav />
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-[#64748B]">
          <a href="#como-funciona" className="hover:text-[#0F172A] transition-colors">Cómo funciona</a>
          <a href="#precios" className="hover:text-[#0F172A] transition-colors">Precios</a>
          <a href="#testimonios" className="hover:text-[#0F172A] transition-colors">Testimonios</a>
          <a href="/pro" className="hover:text-[#0F172A] transition-colors font-medium text-[#16A34A]">Mi tracker</a>
        </div>
        {userEmail ? (
          <UserMenu email={userEmail} />
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/auth')}
              className="text-sm font-medium text-[#64748B] hover:text-[#0F172A] px-3 py-2.5 rounded-lg transition-colors min-h-[44px] flex items-center"
            >
              Iniciar sesión
            </button>
            <button
              onClick={onCTA}
              className="bg-[#16A34A] hover:bg-[#15803D] text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors hidden sm:flex sm:items-center min-h-[44px]"
            >
              Crear mi plan gratis →
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}

function DiagnosticoMockup() {
  const [checked, setChecked] = useState({ press: false, dominadas: true, remo: false })
  const toggle = (k) => setChecked(c => ({ ...c, [k]: !c[k] }))

  const exercises = [
    { key: 'press',     name: 'Press banca',     sets: '4×8-10' },
    { key: 'dominadas', name: 'Dominadas',        sets: '4×6-8'  },
    { key: 'remo',      name: 'Remo mancuerna',   sets: '3×10-12'},
  ]

  return (
    <div
      className="relative w-full max-w-sm mx-auto"
      style={{ animation: 'float 5s ease-in-out infinite' }}
    >
      {/* Glow verde */}
      <div className="absolute inset-0 bg-[#16A34A]/15 blur-3xl rounded-full scale-90 pointer-events-none" />

      <div className="relative bg-white rounded-2xl border border-[#E2E8F0] shadow-2xl p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
          <div>
            <div className="text-xs text-[#64748B] mb-0.5">Tu diagnóstico</div>
            <LogoIcon size={28} />
          </div>
          <div className="text-right">
            <div className="text-xs text-[#64748B] mb-0.5">Puntuación de salud</div>
            <div
              className="text-3xl text-[#16A34A] font-bold leading-none"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              72<span className="text-sm text-[#94A3B8] font-normal">/100</span>
            </div>
          </div>
        </div>

        {/* Barra de salud */}
        <div>
          <div className="h-2.5 bg-[#E2E8F0] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#16A34A] to-[#22C55E]"
              style={{ width: '72%', transition: 'width 1.2s ease' }}
            />
          </div>
        </div>

        {/* Calorías */}
        <div className="bg-[#F8FAFC] rounded-xl px-4 py-3">
          <div className="text-xs text-[#64748B] mb-1">Objetivo calórico diario</div>
          <div
            className="text-2xl text-[#0F172A] font-bold"
            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
          >
            2.100 <span className="text-sm text-[#94A3B8] font-normal">kcal</span>
          </div>
        </div>

        {/* Macros */}
        <div className="space-y-2">
          <div className="text-xs text-[#64748B] font-semibold uppercase tracking-wider">Distribución de macros</div>
          {[
            { label: 'Proteína', g: '160g', pct: 38, color: '#16A34A', w: '63%' },
            { label: 'Carbos',   g: '195g', pct: 46, color: '#3B82F6', w: '77%' },
            { label: 'Grasas',   g: '58g',  pct: 16, color: '#D97706', w: '27%' },
          ].map(m => (
            <div key={m.label} className="flex items-center gap-2">
              <div className="w-14 text-xs text-[#64748B]">{m.label}</div>
              <div className="flex-1 h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: m.w, backgroundColor: m.color }} />
              </div>
              <div className="text-xs font-semibold text-[#0F172A] w-8 text-right">{m.g}</div>
              <div className="text-[10px] text-[#94A3B8] w-7 text-right">{m.pct}%</div>
            </div>
          ))}
        </div>

        {/* Entrenamiento */}
        <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2.5">
            <span className="text-base">💪</span>
            <div>
              <div className="text-xs font-bold text-[#0F172A]">Hoy: Fuerza Tren Superior</div>
              <div className="text-[10px] text-[#64748B]">5 ejercicios · 60 min</div>
            </div>
          </div>
          <div className="space-y-1.5">
            {exercises.map(ex => (
              <button
                key={ex.key}
                onClick={() => toggle(ex.key)}
                className="w-full flex items-center gap-2.5 bg-white rounded-lg px-3 py-2 text-left transition-all hover:bg-[#F0FDF4]"
              >
                <div
                  className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border transition-all ${
                    checked[ex.key]
                      ? 'bg-[#16A34A] border-[#16A34A]'
                      : 'border-[#CBD5E1]'
                  }`}
                >
                  {checked[ex.key] && <span className="text-white text-[10px] font-bold">✓</span>}
                </div>
                <span className={`text-xs flex-1 transition-colors ${checked[ex.key] ? 'text-[#94A3B8] line-through' : 'text-[#0F172A]'}`}>
                  {ex.name}
                </span>
                <span className="text-[10px] text-[#94A3B8] font-medium">{ex.sets}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Floating badge */}
      <div className="absolute -top-3 -right-3 bg-[#16A34A] text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
        ¡Racha de 12 días! 🔥
      </div>
    </div>
  )
}

function OnboardingMockup() {
  const [selected, setSelected] = useState('lose_weight')
  const options = [
    { key: 'lose_weight', label: 'Perder peso', emoji: '🔥' },
    { key: 'gain_muscle', label: 'Ganar músculo', emoji: '💪' },
    { key: 'run',         label: 'Correr una maratón', emoji: '🏃' },
    { key: 'fit',         label: 'Estar más en forma', emoji: '⚡' },
  ]
  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xl p-5 max-w-xs mx-auto">
      <div className="text-[10px] text-[#94A3B8] mb-3 uppercase tracking-wider font-semibold">Pregunta 1 de 10</div>
      <div className="font-bold text-[#0F172A] text-sm mb-4">¿Cuál es tu objetivo principal?</div>
      <div className="space-y-2">
        {options.map(o => (
          <button
            key={o.key}
            onClick={() => setSelected(o.key)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all text-left ${
              selected === o.key
                ? 'bg-[#F0FDF4] border-[#16A34A] text-[#15803D]'
                : 'border-[#E2E8F0] text-[#64748B] hover:border-[#16A34A]/40'
            }`}
          >
            <span>{o.emoji}</span>
            {o.label}
            {selected === o.key && <span className="ml-auto text-[#16A34A] text-xs">✓</span>}
          </button>
        ))}
      </div>
    </div>
  )
}

function TrackerMockup() {
  const meals = [
    { name: 'Pechuga de pollo', g: 150, kcal: 248 },
    { name: 'Arroz blanco cocido', g: 200, kcal: 260 },
    { name: 'Brócoli', g: 100, kcal: 34 },
  ]
  const total = meals.reduce((a, m) => a + m.kcal, 0)
  const target = 2100
  const pct = Math.min((total / target) * 100, 100)

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xl p-5 max-w-xs mx-auto space-y-3">
      {/* Balance */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-[#64748B]">Hoy consumido</div>
          <div className="text-2xl font-bold text-[#0F172A]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            {total} <span className="text-sm text-[#94A3B8] font-normal">/ {target} kcal</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-[#64748B]">Restantes</div>
          <div className="text-lg font-bold text-[#16A34A]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            {target - total}
          </div>
        </div>
      </div>
      <div className="h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
        <div className="h-full bg-[#16A34A] rounded-full" style={{ width: `${pct}%` }} />
      </div>
      {/* Comida */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span>🍽️</span>
          <span className="text-sm font-bold text-[#0F172A]">Comida</span>
          <span className="text-xs text-[#16A34A] font-semibold ml-auto">{total} kcal</span>
        </div>
        <div className="space-y-1">
          {meals.map((m, i) => (
            <div key={i} className="flex items-center justify-between bg-[#F8FAFC] rounded-lg px-3 py-2">
              <div>
                <div className="text-xs font-medium text-[#0F172A]">{m.name}</div>
                <div className="text-[10px] text-[#94A3B8]">{m.g}g</div>
              </div>
              <div className="text-xs font-bold text-[#0F172A]">{m.kcal} kcal</div>
            </div>
          ))}
        </div>
      </div>
      {/* Check-in */}
      <div className="flex gap-2">
        <div className="flex-1 bg-[#F0FDF4] rounded-xl px-3 py-2 text-center">
          <div className="text-[10px] text-[#64748B]">Peso hoy</div>
          <div className="text-sm font-bold text-[#16A34A]">80.8 kg</div>
        </div>
        <div className="flex-1 bg-[#EFF6FF] rounded-xl px-3 py-2 text-center">
          <div className="text-[10px] text-[#64748B]">Sueño</div>
          <div className="text-sm font-bold text-[#3B82F6]">7.5h 😊</div>
        </div>
        <div className="flex-1 bg-[#FEF3C7] rounded-xl px-3 py-2 text-center">
          <div className="text-[10px] text-[#64748B]">Quemadas</div>
          <div className="text-sm font-bold text-[#D97706]">320 kcal</div>
        </div>
      </div>
    </div>
  )
}

function ProblemCard({ emoji, title, desc }) {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 text-left">
      <div className="text-3xl mb-3">{emoji}</div>
      <div className="font-semibold text-[#0F172A] mb-2 text-base">{title}</div>
      <div className="text-[#64748B] text-sm leading-relaxed">{desc}</div>
    </div>
  )
}

function PricingCard({ plan, price, period, perMonth, badge, badgeColor, features, highlight, cta, onSelect }) {
  return (
    <div
      className={`relative rounded-2xl p-6 flex flex-col transition-all duration-200 hover:-translate-y-1 ${
        highlight
          ? 'bg-[#F0FDF4] border-2 border-[#16A34A] shadow-lg'
          : 'bg-white border border-[#E2E8F0] shadow-sm'
      }`}
    >
      {badge && (
        <div
          className="absolute -top-3 left-1/2 -translate-x-1/2 text-white text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap"
          style={{ backgroundColor: badgeColor || '#16A34A' }}
        >
          {badge}
        </div>
      )}
      <div className="mb-4">
        <div className="text-xs text-[#64748B] font-semibold uppercase tracking-wider mb-2">{plan}</div>
        <div className="flex items-baseline gap-1 flex-wrap">
          <span
            className="text-4xl font-bold leading-none"
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              color: highlight ? '#16A34A' : '#0F172A',
            }}
          >
            {price}
          </span>
          <span className="text-[#64748B] text-sm">{period}</span>
        </div>
        {perMonth && (
          <div className="text-xs text-[#64748B] mt-1">{perMonth}</div>
        )}
      </div>
      <ul className="space-y-2 mb-6 flex-1">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-[#64748B]">
            <span className="text-[#16A34A] mt-0.5 shrink-0">✓</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <button
        onClick={onSelect}
        className={`w-full py-3 rounded-xl font-semibold text-sm transition-colors ${
          highlight
            ? 'bg-[#16A34A] hover:bg-[#15803D] text-white'
            : 'bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F172A]'
        }`}
      >
        {cta}
      </button>
    </div>
  )
}

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div
      className="border border-[#E2E8F0] rounded-xl overflow-hidden cursor-pointer bg-white"
      onClick={() => setOpen(!open)}
    >
      <div className="flex items-center justify-between p-5">
        <span className="text-[#0F172A] font-medium text-sm">{q}</span>
        <span className={`text-[#64748B] text-lg transition-transform duration-200 flex-shrink-0 ml-4 ${open ? 'rotate-45' : ''}`}>
          +
        </span>
      </div>
      {open && (
        <div className="px-5 pb-5 text-[#64748B] text-sm leading-relaxed border-t border-[#F1F5F9] pt-4">
          {a}
        </div>
      )}
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function LandingPage() {
  const router = useRouter()
  const handleCTA = () => router.push('/onboarding')

  // Procesa tokens de Supabase en el hash de la URL (magic link via hash fragment)
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!window.location.hash.includes('access_token')) return

    const supabase = createClient()
    // Pequeño delay para que Supabase procese el hash y establezca la sesión
    setTimeout(() => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          // Limpiar el hash y redirigir con hard redirect para que el middleware recoja las cookies
          window.location.href = '/dashboard'
        }
      })
    }, 500)
  }, [])

  return (
    <div
      className="min-h-screen bg-[#F8FAFC] text-[#0F172A] overflow-x-hidden"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <NavBar onCTA={handleCTA} />

      {/* ── SECCIÓN 2: HERO ──────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center pt-16">
        {/* Fondo radial suave */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-[#16A34A]/5 rounded-full blur-[140px]" />
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[#22C55E]/5 rounded-full blur-[80px]" />
          {/* Grid sutil */}
          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage:
                'linear-gradient(#0F172A 1px, transparent 1px), linear-gradient(90deg, #0F172A 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }}
          />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 py-24 grid lg:grid-cols-2 gap-16 items-center">
          {/* Columna izquierda */}
          <div>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-[#16A34A]/10 border border-[#16A34A]/20 rounded-full px-4 py-1.5 mb-8 opacity-0 animate-fade-up">
              <span className="text-[#16A34A] text-sm">✦</span>
              <span className="text-xs text-[#15803D] font-semibold">Inteligencia Artificial · Plan personalizado</span>
            </div>

            {/* Título */}
            <h1
              className="leading-none mb-6 opacity-0 animate-fade-up delay-100"
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: 'clamp(2.5rem, 7vw, 5rem)',
                letterSpacing: '0.02em',
              }}
            >
              Tu cuerpo tiene<br />
              un plan.{' '}
              <span
                style={{
                  background: 'linear-gradient(135deg, #16A34A, #22C55E)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Tú todavía no.
              </span>
            </h1>

            <p className="text-[#64748B] text-lg leading-relaxed mb-8 max-w-lg opacity-0 animate-fade-up delay-200">
              FORJA analiza tus datos, genera un plan de entrenamiento y nutrición
              personalizado, y se adapta semana a semana hasta que alcanzas tu objetivo.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 opacity-0 animate-fade-up delay-300">
              <button
                onClick={handleCTA}
                className="bg-[#16A34A] hover:bg-[#15803D] text-white font-semibold px-8 py-4 rounded-xl transition-colors text-base"
              >
                Crear mi plan gratis →
              </button>
              <a
                href="#como-funciona"
                className="border border-[#E2E8F0] hover:border-[#CBD5E1] text-[#64748B] hover:text-[#0F172A] font-medium px-8 py-4 rounded-xl transition-colors text-base text-center"
              >
                Ver cómo funciona
              </a>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-8 mt-10 opacity-0 animate-fade-up delay-400">
              {[
                ['2 min', 'Para generar tu plan'],
                ['100%', 'Personalizado a ti'],
                ['0€', 'Para empezar'],
              ].map(([val, label]) => (
                <div key={label}>
                  <div className="text-[#16A34A] font-bold text-xl leading-none">{val}</div>
                  <div className="text-[#64748B] text-xs mt-1">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Columna derecha — Mockup diagnóstico */}
          <div className="opacity-0 animate-fade-up delay-300 max-md:mt-8 max-md:max-h-[400px] max-md:overflow-hidden">
            <DiagnosticoMockup />
          </div>
        </div>
      </section>

      {/* ── SECCIÓN 3: EL PROBLEMA ───────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-[#16A34A] text-sm font-semibold tracking-widest uppercase mb-4">El problema</div>
            <h2
              className="mb-6"
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                letterSpacing: '0.02em',
                lineHeight: 1.1,
              }}
            >
              ¿Por qué llevas años{' '}
              <span
                style={{
                  background: 'linear-gradient(135deg, #16A34A, #22C55E)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                sin ver resultados?
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-16">
            <ProblemCard
              emoji="😤"
              title="Planes genéricos de internet"
              desc="Diseñados para la media. Ignoran tu historial, tus lesiones, tu disponibilidad real y tu metabolismo."
            />
            <ProblemCard
              emoji="📉"
              title="Sin seguimiento real"
              desc="Apuntas en un papel dos semanas y lo abandonas. Sin datos, sin progreso visible, sin motivación."
            />
            <ProblemCard
              emoji="💸"
              title="Entrenadores a 60€/sesión"
              desc="Inaccesibles para la mayoría. Y cuando no estás con ellos, estás completamente solo."
            />
          </div>

          {/* Transición */}
          <div className="text-center bg-[#0F172A] rounded-2xl px-8 py-10">
            <p
              className="text-white mb-2"
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: 'clamp(1.5rem, 3vw, 2.5rem)',
                letterSpacing: '0.03em',
              }}
            >
              FORJA es tu entrenador personal con IA.
            </p>
            <p className="text-[#94A3B8] text-lg">
              Disponible 24/7.{' '}
              <span className="text-[#22C55E] font-semibold">A 14,99€/mes.</span>
            </p>
          </div>
        </div>
      </section>

      {/* ── SECCIÓN 4: CÓMO FUNCIONA ─────────────────────────────────────── */}
      <section id="como-funciona" className="py-24 px-6 bg-[#F1F5F9]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-[#16A34A] text-sm font-semibold tracking-widest uppercase mb-4">Proceso</div>
            <h2
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                letterSpacing: '0.02em',
              }}
            >
              De cero a tu mejor versión{' '}
              <span
                style={{
                  background: 'linear-gradient(135deg, #16A34A, #22C55E)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                en 3 pasos
              </span>
            </h2>
          </div>

          <div className="space-y-12">
            {/* Paso 1 */}
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div>
                <div
                  className="text-6xl text-[#16A34A]/20 mb-2"
                  style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                >
                  01
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">🎯</span>
                  <h3
                    className="text-2xl text-[#0F172A]"
                    style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.03em' }}
                  >
                    Cuéntanos quién eres
                  </h3>
                </div>
                <p className="text-[#64748B] leading-relaxed">
                  10 preguntas. Tu objetivo, tus datos físicos, tu disponibilidad, tus restricciones.
                  La IA necesita conocerte para crear algo que funcione de verdad.
                </p>
              </div>
              <div className="flex justify-center">
                <OnboardingMockup />
              </div>
            </div>

            {/* Paso 2 */}
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div className="flex justify-center md:order-first order-last">
                <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xl p-5 max-w-xs w-full space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-bold text-[#0F172A]">Tu diagnóstico</div>
                    <div className="text-xs text-[#16A34A] font-bold bg-[#F0FDF4] px-2 py-1 rounded-full">72 / 100</div>
                  </div>
                  <div className="h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#16A34A] to-[#22C55E] rounded-full" style={{ width: '72%' }} />
                  </div>
                  <div className="bg-[#F8FAFC] rounded-xl p-3">
                    <div className="text-xs text-[#64748B] mb-1">Calorías diarias</div>
                    <div className="text-2xl font-bold text-[#0F172A]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                      2.100 <span className="text-sm font-normal text-[#94A3B8]">kcal</span>
                    </div>
                  </div>
                  {[
                    { l: 'Proteína', g: '160g', c: '#16A34A', w: '63%' },
                    { l: 'Carbos',   g: '195g', c: '#3B82F6', w: '77%' },
                    { l: 'Grasas',   g: '58g',  c: '#D97706', w: '27%' },
                  ].map(m => (
                    <div key={m.l} className="flex items-center gap-2">
                      <div className="w-14 text-xs text-[#64748B]">{m.l}</div>
                      <div className="flex-1 h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: m.w, backgroundColor: m.c }} />
                      </div>
                      <div className="text-xs font-semibold text-[#0F172A] w-8 text-right">{m.g}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div
                  className="text-6xl text-[#16A34A]/20 mb-2"
                  style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                >
                  02
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">⚡</span>
                  <h3
                    className="text-2xl text-[#0F172A]"
                    style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.03em' }}
                  >
                    Recibe tu plan en 2 minutos
                  </h3>
                </div>
                <p className="text-[#64748B] leading-relaxed">
                  Plan de entrenamiento semanal completo, objetivo calórico exacto y distribución
                  de macros calculados específicamente para ti y tu objetivo.
                </p>
              </div>
            </div>

            {/* Paso 3 */}
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div>
                <div
                  className="text-6xl text-[#16A34A]/20 mb-2"
                  style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                >
                  03
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">🔥</span>
                  <h3
                    className="text-2xl text-[#0F172A]"
                    style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.03em' }}
                  >
                    Registra, progresa, ajusta
                  </h3>
                </div>
                <p className="text-[#64748B] leading-relaxed">
                  Registra lo que comes y entrenas cada día. Si no progresas al ritmo esperado,
                  FORJA ajusta tu plan automáticamente. Sin excusas.
                </p>
              </div>
              <div className="flex justify-center">
                <TrackerMockup />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECCIÓN 5: FREE vs PRO ───────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-[#16A34A] text-sm font-semibold tracking-widest uppercase mb-4">Planes</div>
            <h2
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                letterSpacing: '0.02em',
              }}
            >
              Empieza gratis.{' '}
              <span
                style={{
                  background: 'linear-gradient(135deg, #16A34A, #22C55E)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Escala cuando estés listo.
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Gratis */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 md:p-8 shadow-sm">
              <div className="inline-block bg-[#F1F5F9] text-[#64748B] text-xs font-bold px-3 py-1 rounded-full mb-6 uppercase tracking-wider">
                Gratis
              </div>
              <h3
                className="text-2xl mb-6 text-[#0F172A]"
                style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.03em' }}
              >
                Para empezar
              </h3>
              <ul className="space-y-3">
                {FEATURES_FREE.map(f => (
                  <li key={f} className="flex items-start gap-3 text-[#64748B] text-sm">
                    <span className="text-[#22C55E] mt-0.5 shrink-0">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            {/* Pro */}
            <div className="bg-[#F0FDF4] border border-[#16A34A]/30 rounded-2xl p-6 md:p-8 shadow-sm">
              <div className="inline-block bg-[#16A34A]/20 text-[#16A34A] text-xs font-bold px-3 py-1 rounded-full mb-6 uppercase tracking-wider">
                Pro ⚡
              </div>
              <h3
                className="text-2xl mb-6 text-[#0F172A]"
                style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.03em' }}
              >
                Para transformarte
              </h3>
              <ul className="space-y-3">
                {FEATURES_PRO.map(f => (
                  <li key={f} className="flex items-start gap-3 text-[#0F172A] text-sm">
                    <span className="text-[#16A34A] mt-0.5 shrink-0">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECCIÓN 6: MOCKUP TRACKER ────────────────────────────────────── */}
      <section className="py-24 px-6 bg-[#F1F5F9]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-[#16A34A] text-sm font-semibold tracking-widest uppercase mb-4">Tracker Pro</div>
            <h2
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                letterSpacing: '0.02em',
              }}
            >
              El tracker más inteligente{' '}
              <span
                style={{
                  background: 'linear-gradient(135deg, #16A34A, #22C55E)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                que has usado
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="flex justify-center">
              <TrackerMockup />
            </div>
            <div className="space-y-6">
              {[
                {
                  emoji: '🔍',
                  title: 'Base de datos española',
                  desc: 'Más de 50 alimentos comunes en España con macros exactos. Búsqueda instantánea.',
                },
                {
                  emoji: '🔥',
                  title: 'Calorías quemadas inteligentes',
                  desc: 'Calculadas según tu peso, tipo de actividad y duración real. No estimaciones genéricas.',
                },
                {
                  emoji: '⚖️',
                  title: 'Balance neto en tiempo real',
                  desc: 'Consumidas − quemadas = neto. Siempre sabes exactamente dónde estás respecto a tu objetivo.',
                },
                {
                  emoji: '✨',
                  title: 'IA que entiende lo que comes',
                  desc: 'Describe tu comida en texto libre: "tortilla de 3 huevos con jamón". La IA calcula los macros.',
                },
              ].map(item => (
                <div key={item.title} className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-center text-xl flex-shrink-0 shadow-sm">
                    {item.emoji}
                  </div>
                  <div>
                    <div className="font-semibold text-[#0F172A] mb-1">{item.title}</div>
                    <div className="text-[#64748B] text-sm leading-relaxed">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SECCIÓN 7: TESTIMONIOS ───────────────────────────────────────── */}
      <section id="testimonios" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-[#16A34A] text-sm font-semibold tracking-widest uppercase mb-4">Resultados reales</div>
            <h2
              className="mb-8"
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                letterSpacing: '0.02em',
              }}
            >
              Resultados reales de{' '}
              <span
                style={{
                  background: 'linear-gradient(135deg, #16A34A, #22C55E)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                personas reales
              </span>
            </h2>

            {/* Stats bar */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl px-8 py-5">
              {[
                ['2.400+', 'usuarios activos'],
                ['4.8/5', 'valoración media'],
                ['89%', 'alcanza su objetivo en 12 semanas'],
              ].map(([val, label]) => (
                <div key={label} className="text-center">
                  <div className="text-[#16A34A] font-bold text-2xl" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                    {val}
                  </div>
                  <div className="text-[#64748B] text-xs mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="bg-white border border-[#E2E8F0] rounded-2xl p-4 md:p-6 shadow-sm flex flex-col">
                {/* Resultado destacado */}
                <div
                  className="text-2xl font-bold mb-3"
                  style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    letterSpacing: '0.03em',
                    color: t.color,
                  }}
                >
                  {t.result}
                </div>
                {/* Stars */}
                <div className="flex gap-0.5 mb-3">
                  {Array(t.score).fill(0).map((_, i) => (
                    <span key={i} className="text-[#16A34A] text-sm">★</span>
                  ))}
                </div>
                <p className="text-[#64748B] text-sm leading-relaxed mb-5 flex-1">"{t.text}"</p>
                <div className="flex items-center gap-3 pt-4 border-t border-[#F1F5F9]">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                    style={{ backgroundColor: t.color }}
                  >
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-[#0F172A] text-sm font-semibold">{t.name}</div>
                    <div className="text-[#94A3B8] text-xs">{t.city}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECCIÓN 8: PRECIOS ───────────────────────────────────────────── */}
      <section id="precios" className="py-24 px-6 bg-[#F1F5F9]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-4">
            <div className="text-[#16A34A] text-sm font-semibold tracking-widest uppercase mb-4">Precios</div>
            <h2
              className="mb-3"
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                letterSpacing: '0.02em',
              }}
            >
              Invierte en ti.{' '}
              <span
                style={{
                  background: 'linear-gradient(135deg, #16A34A, #22C55E)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Cancela cuando quieras.
              </span>
            </h2>
            <p className="text-[#64748B] text-base mb-12">
              Un entrenador personal cobra 60€/sesión.{' '}
              <span className="font-semibold text-[#0F172A]">FORJA cuesta 14,99€ al mes.</span>
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <PricingCard
              plan="Gratis"
              price="0€"
              period="para siempre"
              features={FEATURES_FREE}
              cta="Empezar gratis →"
              onSelect={handleCTA}
            />
            <PricingCard
              plan="Pro Mensual"
              price="14,99€"
              period="/mes"
              badge="Más popular"
              features={FEATURES_PRO}
              highlight
              cta="Empezar 7 días gratis →"
              onSelect={handleCTA}
            />
            <PricingCard
              plan="Pro Anual"
              price="99€"
              period="/año"
              perMonth="8,25€/mes · Ahorra 81€"
              badge="Ahorra 81€"
              badgeColor="#16A34A"
              features={FEATURES_PRO}
              cta="Elegir anual →"
              onSelect={handleCTA}
            />
            <PricingCard
              plan="Vitalicio"
              price="199€"
              period="pago único"
              badge="Mejor inversión"
              badgeColor="#F97316"
              features={[...FEATURES_PRO, 'Todas las funciones futuras incluidas']}
              cta="Comprar acceso vitalicio →"
              onSelect={handleCTA}
            />
          </div>

          <p className="text-center text-[#64748B] text-sm mt-8">
            ✓ Sin tarjeta para el plan gratuito &nbsp;·&nbsp; ✓ Cancela cuando quieras &nbsp;·&nbsp; ✓ Soporte por email incluido
          </p>
        </div>
      </section>

      {/* ── SECCIÓN 9: FAQ ───────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                letterSpacing: '0.02em',
              }}
            >
              Preguntas{' '}
              <span
                style={{
                  background: 'linear-gradient(135deg, #16A34A, #22C55E)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                frecuentes
              </span>
            </h2>
          </div>
          <div className="space-y-3">
            {FAQS.map(faq => (
              <FaqItem key={faq.q} {...faq} />
            ))}
          </div>
        </div>
      </section>

      {/* ── SECCIÓN 10: CTA FINAL (oscuro) ──────────────────────────────── */}
      <section className="py-16 md:py-32 px-6 bg-[#0F172A] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#16A34A]/10 rounded-full blur-[120px]" />
        </div>
        <div className="relative max-w-2xl mx-auto text-center">
          <h2
            className="text-white mb-4"
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 'clamp(3rem, 8vw, 5.5rem)',
              letterSpacing: '0.02em',
              lineHeight: 1.05,
            }}
          >
            Hoy es el día uno.{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #16A34A, #22C55E)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              O no es.
            </span>
          </h2>
          <p className="text-[#94A3B8] text-lg mb-10 leading-relaxed">
            Tu plan personalizado en 2 minutos. Sin tarjeta. Sin excusas.
          </p>
          <button
            onClick={handleCTA}
            className="bg-[#16A34A] hover:bg-[#15803D] text-white font-semibold px-12 py-5 rounded-2xl text-lg transition-colors shadow-[0_0_40px_rgba(22,163,74,0.3)] hover:shadow-[0_0_60px_rgba(22,163,74,0.5)]"
          >
            Crear mi plan gratis →
          </button>
          <p className="text-[#475569] text-sm mt-6">
            Más de 2.400 personas ya están forjando su mejor versión
          </p>
        </div>
      </section>

      {/* ── SECCIÓN 11: FOOTER ───────────────────────────────────────────── */}
      <footer className="border-t border-[#E2E8F0] bg-white py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <LogoNav />
          <div className="flex flex-wrap justify-center gap-6 text-xs text-[#64748B]">
            <a href="/privacidad" className="hover:text-[#0F172A] transition-colors py-2 min-h-[44px] flex items-center">Privacidad</a>
            <a href="/terminos" className="hover:text-[#0F172A] transition-colors py-2 min-h-[44px] flex items-center">Términos</a>
            <a href="/pro" className="hover:text-[#0F172A] transition-colors py-2 min-h-[44px] flex items-center">Mi tracker</a>
            <a href="mailto:hola@forjafit.es" className="hover:text-[#0F172A] transition-colors py-2 min-h-[44px] flex items-center">hola@forjafit.es</a>
          </div>
          <div className="text-xs text-[#64748B]">© 2026 FORJA · Hecho con IA en España 🇪🇸</div>
        </div>
      </footer>
    </div>
  )
}
