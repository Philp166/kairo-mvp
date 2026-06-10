import { useEffect, type ReactNode } from 'react'

// ── Types ────────────────────────────────────────────────────

export interface ToastData {
  glyph: ReactNode
  title: string
  sub: string
  hap?: string
}

interface KairoToastProps {
  toast: ToastData | null
  onDismiss: () => void
}

// ── CartWave (inline) — SVG bar waveform per HAP code ────────

const CART_WAVES: Record<string, number[]> = {
  'HAP-02': [0, 1, 2, 3, 4, 3, 2, 1, 0, 2, 4, 3, 1, 0],
  'HAP-03': [0, 0, 2, 3, 2, 0, 0, 3, 2, 0, 0, 0, 0, 0],
  'HAP-04': [0, 2, 2, 0, 0, 2, 2, 0, 0, 2, 2, 0, 0, 0],
}

function CartWave({ hap }: { hap: string }) {
  const data = CART_WAVES[hap] || CART_WAVES['HAP-03']
  return (
    <svg
      viewBox={`0 0 ${data.length * 4} 14`}
      width="100%"
      height="14"
      preserveAspectRatio="none"
    >
      {data.map((v, i) => (
        <rect
          key={i}
          x={i * 4}
          y={7 - v}
          width={2.5}
          height={Math.max(1, v * 2)}
          fill="currentColor"
          opacity={v ? 0.85 : 0.2}
        />
      ))}
    </svg>
  )
}

// ── KairoToast ───────────────────────────────────────────────

export function KairoToast({ toast, onDismiss }: KairoToastProps) {
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => onDismiss(), 2600)
    return () => clearTimeout(timer)
  }, [toast, onDismiss])

  if (!toast) return null

  return (
    <div className="toast">
      <span className="toast-glyph">{toast.glyph}</span>
      <div className="toast-body">
        <div className="toast-title">{toast.title}</div>
        <div className="toast-sub mono">{toast.sub}</div>
      </div>
      <div className="toast-wave">
        <CartWave hap={toast.hap || 'HAP-03'} />
      </div>
    </div>
  )
}

export default KairoToast
