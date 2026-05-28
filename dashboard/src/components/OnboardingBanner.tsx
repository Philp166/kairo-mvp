import type { KairoBleStatus } from '../lib/bleClient'

interface OnboardingBannerProps {
  bleStatus: KairoBleStatus
  onConnect: () => void
  lastDataAgo?: string
}

export function OnboardingBanner({ bleStatus, onConnect, lastDataAgo }: OnboardingBannerProps) {
  if (bleStatus === 'connected') {
    return (
      <div className="border border-app-green/30 bg-app-green/5 px-5 py-3.5 flex items-center gap-3">
        <span className="w-2 h-2 rounded-full bg-app-green shadow-[0_0_8px_var(--color-app-green)]" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-app-ink">Connected to KairoSpark</div>
          <div className="mono text-app-muted" style={{ fontSize: 9 }}>LIVE DATA · SYNCED {(lastDataAgo ?? 'just now').toUpperCase()}</div>
        </div>
      </div>
    )
  }

  if (bleStatus === 'disconnected') {
    return (
      <div className="border border-app-red/30 bg-app-red/5 px-5 py-3.5 flex items-center gap-3">
        <span className="w-2 h-2 rounded-full bg-app-red animate-pulse" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-app-ink">Connection lost</div>
          <div className="mono text-app-muted" style={{ fontSize: 9 }}>LAST DATA {(lastDataAgo ?? 'unknown').toUpperCase()}</div>
        </div>
        <button
          onClick={onConnect}
          className="cursor-pointer mono text-[10px] px-4 py-2 bg-app-ink text-white hover:opacity-90 transition-opacity shrink-0"
        >
          RECONNECT
        </button>
      </div>
    )
  }

  if (bleStatus === 'connecting') {
    return (
      <div className="border border-app-line-2 bg-app-surface px-5 py-3.5 flex items-center gap-3">
        <span className="w-2 h-2 rounded-full bg-app-muted animate-pulse" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-app-ink">Connecting...</div>
          <div className="mono text-app-muted" style={{ fontSize: 9 }}>SCANNING FOR KAIROSPARK</div>
        </div>
      </div>
    )
  }

  if (bleStatus === 'unsupported') {
    return (
      <div className="border border-app-line-2 bg-app-surface px-5 py-3.5 flex items-center gap-3">
        <WatchIcon />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-app-ink">Connect Kairo band</div>
          <div className="mono text-app-muted" style={{ fontSize: 9 }}>WEB BLUETOOTH NOT SUPPORTED — USE CHROME / EDGE</div>
        </div>
      </div>
    )
  }

  // idle
  return (
    <div className="border border-app-line-2 bg-app-surface px-5 py-3.5 flex items-center gap-3">
      <WatchIcon />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-app-ink">Connect Kairo band</div>
        <div className="mono text-app-muted" style={{ fontSize: 9 }}>PAIR VIA BLUETOOTH TO SEE LIVE DATA</div>
      </div>
      <button
        onClick={onConnect}
        className="cursor-pointer mono text-[10px] px-4 py-2 bg-app-ink text-white hover:opacity-90 transition-opacity shrink-0"
      >
        CONNECT
      </button>
    </div>
  )
}

function WatchIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="shrink-0 text-app-muted">
      <rect x="7" y="4" width="14" height="20" rx="4" stroke="currentColor" strokeWidth="1.5" />
      <rect x="9.5" y="7" width="9" height="10" rx="1.5" fill="currentColor" opacity="0.15" />
      <path d="M10 3V1M18 3V1M10 25v2M18 25v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
