import { useEffect, useState } from 'react'

export interface ToastSpec {
  id: string
  emoji?: string
  title: string
  sub?: string
  /** ms */
  duration?: number
}

interface ToastHostProps {
  toasts: ToastSpec[]
  onDismiss: (id: string) => void
}

export function ToastHost({ toasts, onDismiss }: ToastHostProps) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none">
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

function ToastCard({ toast, onDismiss }: { toast: ToastSpec; onDismiss: (id: string) => void }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const enter = window.setTimeout(() => setVisible(true), 10)
    const exit = window.setTimeout(() => onDismiss(toast.id), toast.duration ?? 2400)
    return () => {
      window.clearTimeout(enter)
      window.clearTimeout(exit)
    }
  }, [toast.id, toast.duration, onDismiss])

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-2xl bg-app-ink text-white shadow-xl min-w-[260px] max-w-md transition-all duration-200 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      {toast.emoji && <span className="text-lg leading-none">{toast.emoji}</span>}
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium leading-tight">{toast.title}</div>
        {toast.sub && <div className="text-[12px] text-white/70 mt-0.5">{toast.sub}</div>}
      </div>
    </div>
  )
}

export default ToastHost
