'use client'

import { usePathname, useRouter } from 'next/navigation'

export default function BottomNav({ isPro = false }) {
  const pathname = usePathname()
  const router   = useRouter()

  const items = [
    { label: 'Inicio',  emoji: '🏠', href: '/dashboard'  },
    { label: 'Mi Plan', emoji: '📋', href: '/diagnostico' },
    {
      label: isPro ? 'Pro' : 'Pro',
      emoji: isPro ? '⚡' : '🔒',
      href:  isPro ? '/pro' : null,
      locked: !isPro,
    },
    { label: 'Cuenta',  emoji: '👤', href: '/auth'       },
  ]

  const handlePress = (item) => {
    if (item.locked) return
    if (item.href) router.push(item.href)
  }

  // Determina el item activo: /pro activa Coach
  const isActive = (item) => {
    if (item.href === '/pro') return pathname.startsWith('/pro')
    return pathname === item.href
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E2E8F0]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="max-w-lg mx-auto flex">
        {items.map((item, i) => {
          const active = isActive(item)
          return (
            <button
              key={i}
              onClick={() => handlePress(item)}
              className={`relative flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-colors ${
                item.locked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
              }`}
            >
              <span className={`text-xl leading-none transition-transform ${active ? 'scale-110' : ''}`}>
                {item.emoji}
              </span>
              <span
                className={`text-[10px] font-semibold transition-colors ${
                  active ? 'text-[#16A34A]' : 'text-[#94A3B8]'
                }`}
              >
                {item.label}
              </span>
              {active && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#16A34A] rounded-full" />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
