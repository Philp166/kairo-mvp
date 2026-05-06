/**
 * Standalone child-watch preview. Same WatchPreview component, but
 * full-screen — for showing on a phone next to Track 2 hardware during demo
 * or for QA sanity-checks of the on-device carousel.
 */

import { useEffect, useState } from 'react'
import { WatchPreview, type WatchAlert, type WatchAlertKind } from './WatchPreview'
import { mockChildren } from '../mock'
import type { KairoEvent } from './EventLog'

/**
 * Pull last few system-level events out of the parent activity log into a
 * watch-friendly shape: short text + tiny timestamp. Filters out anything
 * that looks like a message — the wrist is intentionally narrow.
 */
function eventsToAlerts(events: KairoEvent[], childName: string): WatchAlert[] {
  const map: Record<string, WatchAlertKind | undefined> = {
    arrive_home: 'geofence_in',
    leave_home: 'geofence_out',
    parent_touch: 'hug',
    goal: 'goal',
    low_battery: 'low_battery',
  }
  return events
    .map((e) => {
      const kind = map[e.kind]
      if (!kind) return null
      const text =
        kind === 'geofence_in'
          ? 'arrived home'
          : kind === 'geofence_out'
          ? 'left home'
          : kind === 'hug'
          ? 'hug from parent'
          : kind === 'goal'
          ? 'daily goal reached'
          : 'battery low'
      return {
        id: e.id,
        kind,
        text,
        // Strip the child's name and re-format any "today HH:MM" timestamps.
        ts: e.ts.replace(childName, '').match(/\d{2}:\d{2}/)?.[0] ?? e.ts.split(' ').slice(0, 2).join(' '),
      } as WatchAlert
    })
    .filter((x): x is WatchAlert => x !== null)
    .slice(0, 3)
}

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
            alerts={eventsToAlerts(child.events, child.name)}
            size={300}
            bare={true}
            childName={child.name}
          />
        </div>

        <p className="mt-10 max-w-md text-center text-sm text-app-muted leading-relaxed">
          Five faces: Spark, clock, heart rate, steps, and today's alerts —
          system events only (geofence, hug, battery), no chat or social feed.
          Glanceable — points back to the kid, not the device.
        </p>
      </main>

      <footer className="text-center pb-6 text-[11px] text-app-muted/60">
        Kairo · child-side preview
      </footer>
    </div>
  )
}

export default WatchPage
