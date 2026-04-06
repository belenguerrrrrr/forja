'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

// ─── Datos ────────────────────────────────────────────────────────────────────

const FEATURES_FREE = [
  'Diagnóstico físico inicial',
  'Puntuación de salud 1-100',
  'Plan básico de entrenamiento',
  'Objetivo calórico y macros',
  'Resumen personalizado por IA',
]

const FEATURES_PRO = [
  'Todo lo del plan gratuito',
  'Tracking diario de calorías y macros',
  'Registro de entrenamientos',
  'AI Coach ilimitado 24/7',
  'Ajuste automático del plan',
  'Informes semanales por email',
  'Simulador de escenarios',
  'Histórico de peso y progreso',
]

const STEPS = [
  {
    num: '01',
    title: 'Cuéntanos tu objetivo',
    desc: 'Perder peso, ganar músculo, correr una maratón. Sin importar la meta, FORJA la analiza con IA y crea un plan a tu medida en segundos.',
    icon: '🎯',
  },
  {
    num: '02',
    title: 'Recibe tu plan personalizado',
    desc: 'Plan de entrenamiento semana a semana, objetivo calórico exacto, distribución de macros y consejos adaptados a tus restricciones y disponibilidad.',
    icon: '⚡',
  },
  {
    num: '03',
    title: 'Ejecuta y ajusta en tiempo real',
    desc: 'Registra lo que comes y entrenas. Si no progresas, FORJA ajusta el plan automáticamente. El AI Coach responde tus dudas en cualquier momento.',
    icon: '🔥',
  },
]

const TESTIMONIALS = [
  {
    name: 'Marta G.',
    city: 'Madrid',
    goal: 'Perdió 12kg en 4 meses',
    text: 'Llevaba años intentándolo con apps genéricas. FORJA fue lo primero que se adaptó a mí de verdad: mis horarios, mis alergias, mi nivel. El AI Coach me ha sacado de más de un bache.',
    avatar: 'M',
    score: 5,
  },
  {
    name: 'Carlos R.',
    city: 'Barcelona',
    goal: 'Ganó 8kg de músculo',
    text: 'Entreno en casa sin equipamiento y tenía dudas de que pudiera funcionar. El plan que generó FORJA es brutal — rutinas progresivas, ajuste de macros cada semana. Ya voy por el cuarto mes.',
    avatar: 'C',
    score: 5,
  },
  {
    name: 'Lucía M.',
    city: 'Valencia',
    goal: 'Completó su primera maratón',
    text: 'El tracking diario me mantuvo honesta. Sabes exactamente dónde estás y qué tienes que hacer ese día. Cuando me lesioné la rodilla, el plan se adaptó solo en 24 horas.',
    avatar: 'L',
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
    a: 'Sí. El plan se genera específicamente para tu situación — gimnasio completo, solo mancuernas, o cero equipamiento. Las rutinas son diferentes según tus recursos.',
  },
  {
    q: '¿Puedo cancelar cuando quiera?',
    a: 'Siempre. Sin permanencia, sin letra pequeña. Cancelas desde tu perfil y mantienes el acceso hasta el final del período pagado.',
  },
  {
    q: '¿Cada cuánto se ajusta el plan?',
    a: 'La IA analiza tu progreso semanalmente. Si detecta que no estás avanzando según lo esperado, ajusta calorías, macros o intensidad de entrenamiento automáticamente.',
  },
]

// ─── Componentes internos ─────────────────────────────────────────────────────

function NavBar({ onCTA }) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', h)
    return () => window.removeEventListener('scroll', h)
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/90 backdrop-blur-xl border-b border-[#E2E8F0]' : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <span className="font-display text-3xl text-[#16A34A] tracking-widest">FORJA</span>
        <div className="hidden md:flex items-center gap-8 text-sm text-[#64748B]">
          <a href="#como-funciona" className="hover:text-[#0F172A] transition-colors">Cómo funciona</a>
          <a href="#precios" className="hover:text-[#0F172A] transition-colors">Precios</a>
          <a href="#testimonios" className="hover:text-[#0F172A] transition-colors">Testimonios</a>
        </div>
        <button
          onClick={onCTA}
          className="bg-[#16A34A] hover:bg-[#15803D] text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
        >
          Empezar gratis →
        </button>
      </div>
    </nav>
  )
}

function HeroMockup() {
  return (
    <div className="relative w-full max-w-sm mx-auto">
      {/* Glow */}
      <div className="absolute inset-0 bg-[#16A34A]/20 blur-3xl rounded-full scale-75" />

      {/* Card principal */}
      <div className="relative bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs text-[#64748B] mb-0.5">Semana 6 de 16</div>
            <div className="text-[#0F172A] font-semibold">Plan activo</div>
          </div>
          <div className="text-center">
            <div
              className="text-3xl font-display text-[#16A34A]"
              style={{ fontFamily: 'Georgia, serif', fontWeight: 700 }}
            >
              74
            </div>
            <div className="text-[10px] text-[#64748B]">SALUD</div>
          </div>
        </div>

        {/* Progress bar peso */}
        <div className="bg-[#F8FAFC] rounded-xl p-3 mb-3">
          <div className="flex justify-between text-xs text-[#64748B] mb-2">
            <span>Progreso de peso</span>
            <span className="text-[#22C55E]">−4.2 kg</span>
          </div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs text-[#64748B]">85kg</span>
            <div className="flex-1 h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#16A34A] to-[#22C55E] rounded-full" style={{ width: '42%' }} />
            </div>
            <span className="text-xs text-[#0F172A] font-semibold">75kg</span>
          </div>
          <div className="text-[10px] text-[#64748B] text-center">Actual: 80.8kg → Objetivo: 75kg</div>
        </div>

        {/* Macros hoy */}
        <div className="bg-[#F8FAFC] rounded-xl p-3 mb-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-[#64748B]">Macros hoy</span>
            <span className="text-xs text-[#0F172A]">1.840 / 2.100 kcal</span>
          </div>
          <div className="flex gap-1.5">
            {[
              { label: 'Prot', val: '168g', pct: 80, color: '#16A34A' },
              { label: 'Carbs', val: '195g', pct: 65, color: '#15803D' },
              { label: 'Grasas', val: '58g', pct: 90, color: '#22C55E' },
            ].map((m) => (
              <div key={m.label} className="flex-1">
                <div className="h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden mb-1">
                  <div className="h-full rounded-full" style={{ width: `${m.pct}%`, backgroundColor: m.color }} />
                </div>
                <div className="text-[9px] text-[#64748B] text-center">{m.label}</div>
                <div className="text-[10px] text-[#0F172A] text-center font-medium">{m.val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Entrenamiento hoy */}
        <div className="bg-[#16A34A]/10 border border-[#16A34A]/20 rounded-xl p-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">💪</span>
            <div>
              <div className="text-xs font-semibold text-[#0F172A]">Hoy: Fuerza Tren Superior</div>
              <div className="text-[10px] text-[#64748B]">5 ejercicios · 60 min · −320 kcal</div>
            </div>
            <div className="ml-auto w-6 h-6 rounded-full bg-[#22C55E]/20 border border-[#22C55E]/40 flex items-center justify-center">
              <span className="text-[10px] text-[#22C55E]">✓</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating chip */}
      <div className="absolute -top-3 -right-3 bg-[#22C55E] text-[#F8FAFC] text-xs font-bold px-3 py-1 rounded-full shadow-lg">
        ¡Racha de 12 días! 🔥
      </div>
    </div>
  )
}

function PricingCard({ plan, price, period, badge, features, highlight, onSelect }) {
  return (
    <div
      className={`relative rounded-2xl p-6 flex flex-col transition-transform hover:-translate-y-1 duration-200 ${
        highlight
          ? 'bg-gradient-to-b from-[#16A34A]/10 to-[#FFFFFF] border-2 border-[#16A34A]'
          : 'bg-[#FFFFFF] border border-[#E2E8F0]'
      }`}
    >
      {badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#16A34A] text-white text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap">
          {badge}
        </div>
      )}
      <div className="mb-4">
        <div className="text-sm text-[#64748B] font-medium mb-1">{plan}</div>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-display tracking-tight" style={{ fontFamily: 'Georgia, serif', fontWeight: 700, color: highlight ? '#16A34A' : '#0F172A' }}>
            {price}
          </span>
          <span className="text-[#64748B] text-sm">{period}</span>
        </div>
      </div>
      <ul className="space-y-2 mb-6 flex-1">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-[#64748B]">
            <span className="text-[#22C55E] mt-0.5 shrink-0">✓</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <button
        onClick={onSelect}
        className={`w-full py-3 rounded-xl font-semibold text-sm transition-colors ${
          highlight
            ? 'bg-[#16A34A] hover:bg-[#15803D] text-white'
            : 'bg-[#E2E8F0] hover:bg-[#E2E8F0] text-[#0F172A]'
        }`}
      >
        {plan === 'Gratis' ? 'Empezar gratis →' : `Elegir ${plan} →`}
      </button>
    </div>
  )
}

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div
      className="border border-[#E2E8F0] rounded-xl overflow-hidden cursor-pointer"
      onClick={() => setOpen(!open)}
    >
      <div className="flex items-center justify-between p-5">
        <span className="text-[#0F172A] font-medium text-sm">{q}</span>
        <span className={`text-[#64748B] text-lg transition-transform duration-200 ${open ? 'rotate-45' : ''}`}>+</span>
      </div>
      {open && (
        <div className="px-5 pb-5 text-[#64748B] text-sm leading-relaxed border-t border-[#E2E8F0] pt-4">
          {a}
        </div>
      )}
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function LandingPage() {
  const router = useRouter()
  const handleCTA = () => router.push('/auth')

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] overflow-x-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      <NavBar onCTA={handleCTA} />

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center pt-16">
        {/* Background radial */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#16A34A]/5 rounded-full blur-[120px]" />
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#15803D]/5 rounded-full blur-[80px]" />
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'linear-gradient(#16A34A 1px, transparent 1px), linear-gradient(90deg, #16A34A 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }}
          />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 py-24 grid lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-2 bg-[#16A34A]/10 border border-[#16A34A]/20 rounded-full px-4 py-1.5 mb-8 opacity-0 animate-fade-up">
              <span className="w-1.5 h-1.5 bg-[#16A34A] rounded-full animate-pulse" />
              <span className="text-xs text-[#15803D] font-medium">Powered by Claude AI</span>
            </div>

            <h1 className="font-display text-7xl lg:text-8xl leading-none mb-6 opacity-0 animate-fade-up delay-100">
              FORJA TU<br />
              <span className="gradient-text">MEJOR</span><br />
              VERSIÓN
            </h1>

            <p className="text-[#64748B] text-lg leading-relaxed mb-8 max-w-lg opacity-0 animate-fade-up delay-200">
              Coach de fitness con IA que genera tu plan personalizado de entrenamiento y nutrición,
              hace seguimiento diario y se ajusta automáticamente si no progresas.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 opacity-0 animate-fade-up delay-300">
              <button
                onClick={handleCTA}
                className="bg-[#16A34A] hover:bg-[#15803D] text-white font-semibold px-8 py-4 rounded-xl transition-colors text-base"
              >
                Crear mi plan gratis →
              </button>
              <a
                href="#como-funciona"
                className="border border-[#E2E8F0] hover:border-[#64748B] text-[#64748B] hover:text-[#0F172A] font-medium px-8 py-4 rounded-xl transition-colors text-base text-center"
              >
                Ver cómo funciona
              </a>
            </div>

            <div className="flex items-center gap-6 mt-10 opacity-0 animate-fade-up delay-400">
              {[['2.400+', 'usuarios activos'], ['4.8★', 'valoración media'], ['0€', 'para empezar']].map(([val, label]) => (
                <div key={label}>
                  <div className="text-[#16A34A] font-bold text-lg">{val}</div>
                  <div className="text-[#64748B] text-xs">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Mockup */}
          <div className="animate-float opacity-0 animate-fade-up delay-300">
            <HeroMockup />
          </div>
        </div>
      </section>

      {/* ── EL PROBLEMA ── */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-[#16A34A] text-sm font-semibold tracking-widest uppercase mb-4">El problema</div>
          <h2 className="font-display text-5xl lg:text-6xl mb-8">
            LAS APPS DE FITNESS<br />TE TRATAN COMO UN <span className="gradient-text">NÚMERO</span>
          </h2>
          <p className="text-[#64748B] text-lg leading-relaxed mb-16 max-w-2xl mx-auto">
            Plans genéricos que ignoran tus restricciones, tus horarios y tu historial.
            Contadores de calorías que no entienden tu objetivo. Coaches que no están disponibles cuando los necesitas.
          </p>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              { emoji: '😤', title: 'Planes genéricos', desc: 'Diseñados para la media, no para ti. Ignoran tus lesiones, alergias y disponibilidad real.' },
              { emoji: '📉', title: 'Sin ajuste real', desc: 'Si no progresas, no pasa nada. Ninguna app cambia tu plan automáticamente cuando te estancas.' },
              { emoji: '❓', title: 'Dudas sin responder', desc: 'Tienes preguntas a las 10pm del domingo. Tu app no te responde. Tu coach cobra por sesión.' },
            ].map((item) => (
              <div key={item.title} className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-6 text-left">
                <div className="text-3xl mb-3">{item.emoji}</div>
                <div className="font-semibold text-[#0F172A] mb-2">{item.title}</div>
                <div className="text-[#64748B] text-sm leading-relaxed">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CÓMO FUNCIONA ── */}
      <section id="como-funciona" className="py-24 px-6 bg-[#F1F5F9]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-[#16A34A] text-sm font-semibold tracking-widest uppercase mb-4">Proceso</div>
            <h2 className="font-display text-5xl lg:text-6xl">
              EN 3 PASOS, <span className="gradient-text">EN MARCHA</span>
            </h2>
          </div>

          <div className="space-y-6">
            {STEPS.map((step, i) => (
              <div
                key={step.num}
                className={`flex flex-col md:flex-row gap-6 items-start p-8 rounded-2xl border ${
                  i === 1
                    ? 'bg-gradient-to-r from-[#16A34A]/10 to-transparent border-[#16A34A]/30'
                    : 'bg-[#FFFFFF] border-[#E2E8F0]'
                }`}
              >
                <div className="shrink-0">
                  <div className="font-display text-5xl text-[#16A34A]/30">{step.num}</div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{step.icon}</span>
                    <h3 className="font-display text-2xl text-[#0F172A]">{step.title}</h3>
                  </div>
                  <p className="text-[#64748B] leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-[#16A34A] text-sm font-semibold tracking-widest uppercase mb-4">Funcionalidades</div>
            <h2 className="font-display text-5xl lg:text-6xl">
              TODO LO QUE <span className="gradient-text">NECESITAS</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Free */}
            <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-8">
              <div className="inline-block bg-[#E2E8F0] text-[#64748B] text-xs font-semibold px-3 py-1 rounded-full mb-6">GRATIS</div>
              <h3 className="font-display text-2xl mb-6">Para empezar</h3>
              <ul className="space-y-3">
                {FEATURES_FREE.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-[#64748B] text-sm">
                    <span className="text-[#22C55E]">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Pro */}
            <div className="bg-gradient-to-b from-[#16A34A]/10 to-[#FFFFFF] border border-[#16A34A]/30 rounded-2xl p-8">
              <div className="inline-block bg-[#16A34A]/20 text-[#16A34A] text-xs font-semibold px-3 py-1 rounded-full mb-6">PRO</div>
              <h3 className="font-display text-2xl mb-6">Para transformarte</h3>
              <ul className="space-y-3">
                {FEATURES_PRO.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-[#0F172A] text-sm">
                    <span className="text-[#16A34A]">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRECIOS ── */}
      <section id="precios" className="py-24 px-6 bg-[#F1F5F9]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-[#16A34A] text-sm font-semibold tracking-widest uppercase mb-4">Precios</div>
            <h2 className="font-display text-5xl lg:text-6xl mb-4">
              INVIERTE EN <span className="gradient-text">TI</span>
            </h2>
            <p className="text-[#64748B]">Un café al mes. Una transformación real.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <PricingCard
              plan="Gratis"
              price="0€"
              period="para siempre"
              features={FEATURES_FREE}
              onSelect={handleCTA}
            />
            <PricingCard
              plan="Pro Mensual"
              price="9,99€"
              period="/mes"
              badge="Más popular"
              features={FEATURES_PRO}
              highlight
              onSelect={handleCTA}
            />
            <PricingCard
              plan="Vitalicio"
              price="149€"
              period="pago único"
              badge="−50% vs mensual"
              features={[...FEATURES_PRO, 'Acceso de por vida', 'Todas las futuras funciones']}
              onSelect={handleCTA}
            />
          </div>

          {/* Anual */}
          <div className="mt-6 bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <div className="font-semibold text-[#0F172A] mb-1">Pro Anual — 59€/año</div>
              <div className="text-[#64748B] text-sm">4,92€/mes · Ahorra 60€ vs mensual · Todo lo del plan Pro</div>
            </div>
            <button
              onClick={handleCTA}
              className="shrink-0 bg-[#E2E8F0] hover:bg-[#E2E8F0] text-[#0F172A] font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
            >
              Elegir anual →
            </button>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIOS ── */}
      <section id="testimonios" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-[#16A34A] text-sm font-semibold tracking-widest uppercase mb-4">Resultados reales</div>
            <h2 className="font-display text-5xl lg:text-6xl">
              LO QUE DICEN <span className="gradient-text">LOS QUE YA</span><br />LO FORJARON
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-6">
                <div className="flex gap-0.5 mb-4">
                  {Array(t.score).fill(0).map((_, i) => (
                    <span key={i} className="text-[#16A34A] text-sm">★</span>
                  ))}
                </div>
                <p className="text-[#64748B] text-sm leading-relaxed mb-6">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#16A34A]/20 border border-[#16A34A]/30 flex items-center justify-center text-[#16A34A] font-bold text-sm">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-[#0F172A] text-sm font-medium">{t.name} · {t.city}</div>
                    <div className="text-[#22C55E] text-xs">{t.goal}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-24 px-6 bg-[#F1F5F9]">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-5xl mb-4">PREGUNTAS <span className="gradient-text">FRECUENTES</span></h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq) => (
              <FaqItem key={faq.q} {...faq} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#16A34A]/10 rounded-full blur-[100px]" />
        </div>
        <div className="relative max-w-2xl mx-auto text-center">
          <h2 className="font-display text-6xl lg:text-7xl mb-6">
            HOY ES EL <span className="gradient-text">DÍA UNO.</span><br />O NO ES.
          </h2>
          <p className="text-[#64748B] text-lg mb-10 leading-relaxed">
            Tu plan personalizado en 2 minutos. Sin tarjeta de crédito. Sin excusas.
          </p>
          <button
            onClick={handleCTA}
            className="bg-[#16A34A] hover:bg-[#15803D] text-white font-semibold px-12 py-5 rounded-2xl text-lg transition-colors shadow-[0_0_40px_rgba(22,163,74,0.3)] hover:shadow-[0_0_60px_rgba(22,163,74,0.5)]"
          >
            Crear mi plan ahora — gratis →
          </button>
          <div className="text-[#64748B] text-xs mt-4">Sin tarjeta · Sin compromisos · Cancela cuando quieras</div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-[#E2E8F0] py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="font-display text-2xl text-[#16A34A] tracking-widest">FORJA</span>
          <div className="flex gap-6 text-xs text-[#64748B]">
            <a href="/privacidad" className="hover:text-[#0F172A] transition-colors">Privacidad</a>
            <a href="/terminos" className="hover:text-[#0F172A] transition-colors">Términos</a>
            <a href="mailto:hola@forjafit.es" className="hover:text-[#0F172A] transition-colors">Contacto</a>
          </div>
          <div className="text-xs text-[#64748B]">© 2025 FORJA. Todos los derechos reservados.</div>
        </div>
      </footer>
    </div>
  )
}
