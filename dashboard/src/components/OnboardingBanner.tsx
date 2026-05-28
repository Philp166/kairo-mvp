import type { KairoBleStatus } from '../lib/bleClient'

interface OnboardingBannerProps {
  bleStatus: KairoBleStatus
  onConnect: () => void
  lastDataAgo?: string
}

export function OnboardingBanner({ bleStatus, onConnect, lastDataAgo }: OnboardingBannerProps) {
  if (bleStatus === 'connected') {
    return (
      <div className="rounded-2xl border border-app-green/30 bg-app-green/5 px-5 py-3.5 flex items-center gap-3">
        <span className="text-app-green text-lg">●</span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-app-ink">Connected to KairoSpark</div>
          <div className="text-xs text-app-muted">Live data · synced {lastDataAgo ?? 'just now'}</div>
        </div>
      </div>
    )
  }

  if (bleStatus === 'disconnected') {
    return (
      <div className="rounded-2xl border border-app-orange/30 bg-app-orange/5 px-5 py-3.5 flex items-center gap-3">
        <span className="text-app-orange text-lg">●</span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-app-ink">Connection lost</div>
          <div className="text-xs text-app-muted">Last data {lastDataAgo ?? 'unknown'}</div>
        </div>
        <button
          onClick={onConnect}
          className="cursor-pointer text-[13px] font-medium px-4 py-2 rounded-full bg-app-ink text-white hover:opacity-90 transition-opacity shrink-0"
        >
          Reconnect
        </button>
      </div>
    )
  }

  if (bleStatus === 'connecting') {
    return (
      <div className="rounded-2xl border border-app-line-2 bg-app-surface px-5 py-3.5 flex items-center gap-3">
        <span className="text-app-muted text-lg animate-pulse">●</span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-app-ink">Connecting...</div>
          <div className="text-xs text-app-muted">Looking for KairoSpark</div>
        </div>
      </div>
    )
  }

  if (bleStatus === 'unsupported') {
    return (
      <div className="rounded-2xl border border-app-line-2 bg-app-surface px-5 py-3.5 flex items-center gap-3">
        <WatchIcon />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-app-ink">Connect Kairo band</div>
          <div className="text-xs text-app-muted">Web Bluetooth not supported — use Chrome or Edge on desktop</div>
        </div>
      </div>
    )
  }

  // idle
  return (
    <div className="rounded-2xl border border-app-line-2 bg-app-surface px-5 py-3.5 flex items-center gap-3">
      <WatchIcon />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-app-ink">Connect Kairo band</div>
        <div className="text-xs text-app-muted">Pair via Bluetooth to see live data</div>
      </div>
      <button
        onClick={onConnect}
        className="cursor-pointer text-[13px] font-medium px-4 py-2 rounded-full bg-app-ink text-white hover:opacity-90 transition-opacity shrink-0"
      >
        Connect
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
