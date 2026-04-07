'use client'

import { usePathname, useRouter } from 'next/navigation'

const NAV_ITEMS = [
  { label: 'Inicio',   emoji: '🏠', href: '/'           },
  { label: 'Tracker',  emoji: '📊', href: '/tracker'    },
  { label: 'Mi Plan',  emoji: '📋', href: '/diagnostico' },
  { label: 'Cuenta',   emoji: '👤', href: '/auth'       },
]

export default function BottomNav() {
  const pathname = usePathname()
  const router   = useRouter()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E2E8F0] pb-safe"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="max-w-lg mx-auto flex">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className="flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-colors"
            >
              <span
                className={`text-xl leading-none transition-transform ${isActive ? 'scale-110' : ''}`}
              >
                {item.emoji}
              </span>
              <span
                className={`text-[10px] font-semibold transition-colors ${
                  isActive ? 'text-[#16A34A]' : 'text-[#94A3B8]'
                }`}
              >
                {item.label}
              </span>
              {isActive && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#16A34A] rounded-full" />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
