export function LogoIcon({ size = 40, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="100" height="100" rx="22" fill="#0F172A" />
      <polygon points="58,12 32,52 52,52 36,88 68,44 48,44 60,12" fill="white" />
    </svg>
  )
}

export function LogoFull({ iconSize = 40, className = '' }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <LogoIcon size={iconSize} />
      <span
        style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '4px' }}
        className="text-3xl text-[#0F172A]"
      >
        FORJA
      </span>
    </div>
  )
}

export function LogoNav({ className = '' }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <LogoIcon size={32} />
      <span
        style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '3px' }}
        className="text-2xl text-[#0F172A]"
      >
        FORJA
      </span>
    </div>
  )
}
