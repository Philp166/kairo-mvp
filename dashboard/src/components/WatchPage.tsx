/**
 * Standalone child-watch preview. Same WatchPreview component, but
 * full-screen — for showing on a phone next to Track 2 hardware during demo
 * or for QA sanity-checks of the on-device carousel.
 */

import { useEffect, useState } from 'react'
import { WatchPreview } from './WatchPreview'
import { mockChildren } from '../mock'

interface WatchPageProps {
  childId?: string
}

export function WatchPage({ childId }: WatchPageProps) {
  const child = mockChildren.find((c) => c.id === childId) ?? mockChildren[0]
  const [, force] = useState(0)

  // Tick every 30s so the clock face is honest.
  useEffect(() => {
    const t = window.setInterval(() => force((n) => n + 1), 30000)
    return () => window.clearInterval(t)
  }, [])

  return (
    <div className="min-h-screen bg-app-bg text-app-ink flex flex-col">
      <header className="border-b border-app-line bg-app-bg/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-md mx-auto px-6 h-14 flex items-center justify-between">
          <a
            href="#dashboard"
            className="text-xs text-app-muted hover:text-app-ink transition-colors"
          >
            ← back to dashboard
          </a>
          <span className="text-[15px] font-semibold tracking-tight">{child.name}'s band</span>
          <span className="text-xs text-app-muted tabular">{child.battery}%</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <WatchPreview
            state={child.state}
            steps={child.steps}
            stepsGoal={child.stepsGoal}
            hr={child.hr}
            hrBaseline={child.hrBaseline}
            stepsSeries={child.stepsSeries}
            message={child.lastMessage?.text ?? null}
            messageEmoji={child.lastMessage?.emoji ?? null}
            messageAgo={child.lastMessage?.ts ?? 'just now'}
            messageFrom="mom"
            size={300}
            bare={true}
            childName={child.name}
          />
        </div>

        <p className="mt-10 max-w-md text-center text-sm text-app-muted leading-relaxed">
          5-screen carousel: Spark, clock, heart rate, steps, parent message.
          Tap the face to go to the next screen.
        </p>
      </main>

      <footer className="text-center pb-6 text-[11px] text-app-muted/60">
        Kairo · child-side preview
      </footer>
    </div>
  )
}

export default WatchPage
