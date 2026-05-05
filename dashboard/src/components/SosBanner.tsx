import { AlertIcon, PhoneIcon, VideoIcon } from './icons'

interface SosBannerProps {
  childName: string
  acknowledged: boolean
  onAcknowledge: () => void
  triggeredAgo: string
}

export function SosBanner({ childName, acknowledged, onAcknowledge, triggeredAgo }: SosBannerProps) {
  return (
    <div
      className={`rounded-2xl border p-5 sm:p-6 ${
        acknowledged
          ? 'border-app-line bg-app-surface'
          : 'border-app-red/30 bg-app-red/5'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`shrink-0 size-9 rounded-full flex items-center justify-center ${
            acknowledged ? 'bg-app-line text-app-muted' : 'bg-app-red text-white'
          }`}
        >
          <AlertIcon width={18} height={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold tracking-tight">
              {acknowledged ? 'Alert acknowledged' : `SOS from ${childName}`}
            </span>
            <span className="text-[10px] uppercase tracking-[0.1em] text-app-muted">
              HAP-01 · {triggeredAgo}
            </span>
          </div>
          <p className="mt-1 text-sm text-app-ink-2 leading-relaxed">
            {acknowledged
              ? `You confirmed the alert. ${childName} got the response buzz.`
              : `${childName} held the SOS button for 3 seconds. Reach out now.`}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {!acknowledged && (
              <>
                <button className="cursor-pointer text-[14px] font-medium px-4 py-2.5 rounded-full bg-app-red text-white hover:opacity-90 transition-opacity duration-200 inline-flex items-center gap-2">
                  <PhoneIcon width={15} height={15} />
                  Call
                </button>
                <button className="cursor-pointer text-[14px] font-medium px-4 py-2.5 rounded-full bg-app-surface border border-app-line-2 hover:bg-app-line transition-colors duration-200 inline-flex items-center gap-2">
                  <VideoIcon width={15} height={15} />
                  Video
                </button>
              </>
            )}
            <button
              onClick={onAcknowledge}
              className={`cursor-pointer text-[14px] font-medium px-4 py-2.5 rounded-full transition-colors duration-200 inline-flex items-center gap-2 ${
                acknowledged
                  ? 'bg-app-surface border border-app-line-2 text-app-muted hover:bg-app-line'
                  : 'bg-app-ink text-white hover:opacity-90'
              }`}
            >
              {acknowledged ? 'Reset' : 'Acknowledge'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SosBanner
