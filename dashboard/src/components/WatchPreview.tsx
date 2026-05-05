/**
 * Kairo watch faces — premium OLED minimalism.
 *
 * Carousel: Spark Avatar → Clock → Heart rate → Steps → Parent message.
 * 140×140 viewBox; on real AMOLED the firmware scales 1 viewBox-unit ≈ 2.93 px.
 *
 * Design system (chosen via /ui-ux-pro-max for "health wearable, premium"):
 *   - Background:   #0B0B12  (true OLED black, indigo cast)
 *   - Surface lift: #15151E
 *   - Ink:          #FAFAFA / #A1A1AA / #52525B
 *   - HR (rose):    #F43F5E
 *   - Steps (lime): #22C55E
 *   - In-range:     #34D399
 *   - Message:      #A78BFA
 * Typography: Space Grotesk for display numerics, Inter for UI labels.
 */

import { useEffect, useState } from 'react'
import { SparkV1, type SparkState } from './Spark/SparkV1'
import './watch.css'

interface WatchPreviewProps {
  state: SparkState
  steps: number
  stepsGoal: number
  hr: number
  hrBaseline?: number
  stepsSeries?: number[]
  message?: string | null
  messageEmoji?: string | null
  /** Sender label: "FROM {messageFrom}" (e.g. "mom"). */
  messageFrom?: string
  messageAgo?: string
  now?: Date
  size?: number
  bare?: boolean
  childName?: string
}

type Screen = 'spark' | 'clock' | 'hr' | 'steps' | 'message'

const screens: Screen[] = ['spark', 'clock', 'hr', 'steps', 'message']

const screenLabels: Record<Screen, string> = {
  spark: 'Spark',
  clock: 'Clock',
  hr: 'Heart rate',
  steps: 'Steps',
  message: 'Message',
}

export function WatchPreview({
  state,
  steps,
  stepsGoal,
  hr,
  hrBaseline = 86,
  stepsSeries,
  message,
  messageEmoji,
  messageFrom = 'mom',
  messageAgo = 'just now',
  now,
  size = 160,
  bare = false,
  childName,
}: WatchPreviewProps) {
  const [screen, setScreen] = useState<Screen>('spark')
  const [tick, setTick] = useState(() => now ?? new Date())
  useEffect(() => {
    if (now) return
    const id = window.setInterval(() => setTick(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [now])
  const time = now ?? tick

  function next() {
    const i = screens.indexOf(screen)
    setScreen(screens[(i + 1) % screens.length])
  }

  return (
    <div className="watch-display">
      {!bare && (
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-[13px] font-medium">On the wrist</div>
            <div className="text-xs text-app-muted">
              {childName ? `What ${childName} sees now. ` : ''}Tap face for next screen
            </div>
          </div>
          <div className="flex gap-1.5">
            {screens.map((s) => (
              <button
                key={s}
                onClick={() => setScreen(s)}
                aria-label={screenLabels[s]}
                className={`size-1.5 rounded-full transition-colors duration-200 cursor-pointer ${
                  s === screen ? 'bg-app-ink' : 'bg-app-line-2 hover:bg-app-muted'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-center py-4">
        <button
          onClick={next}
          aria-label="Next screen"
          className="cursor-pointer rounded-full transition-transform duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/40"
        >
          {screen === 'spark' && <SparkV1 state={state} size={size} />}
          {screen === 'clock' && <ClockFace size={size} now={time} />}
          {screen === 'hr' && <HRFace size={size} hr={hr} baseline={hrBaseline} />}
          {screen === 'steps' && (
            <StepsFace size={size} steps={steps} goal={stepsGoal} series={stepsSeries} />
          )}
          {screen === 'message' && (
            <MessageFace
              size={size}
              text={message ?? null}
              emoji={messageEmoji ?? null}
              from={messageFrom}
              ago={messageAgo}
            />
          )}
        </button>
      </div>

      {!bare && (
        <div className="text-center text-[11px] uppercase tracking-[0.14em] text-app-muted">
          {screenLabels[screen]}
        </div>
      )}

      {bare && (
        <div className="flex justify-center gap-2 mt-6">
          {screens.map((s) => (
            <button
              key={s}
              onClick={() => setScreen(s)}
              aria-label={screenLabels[s]}
              className={`h-1 rounded-full transition-all duration-300 cursor-pointer ${
                s === screen ? 'w-6 bg-white' : 'w-1 bg-white/25 hover:bg-white/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Visual primitives — Spark palette (terracotta screen, indigo-black ink).
// ============================================================================

const BG = '#D85A30'           // terracotta screen — same as Spark v1
const INK = '#FAF6EC'          // milk — primary text & glyphs on the screen
const BEZEL = '#F0E8DC'        // cream bezel surrounding the screen
const BEZEL_EDGE = '#D4C9B5'   // bezel outline

function FaceFrame({ size, children }: { size: number; children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 140 140" width={size} height={size}>
      <defs>
        <clipPath id="watch-clip">
          <circle cx={70} cy={70} r={50} />
        </clipPath>
      </defs>
      {/* cream bezel — same as Spark v1 */}
      <rect
        x={0}
        y={0}
        width={140}
        height={140}
        rx={22}
        fill={BEZEL}
        stroke={BEZEL_EDGE}
        strokeWidth={2}
      />
      {/* terracotta screen */}
      <g clipPath="url(#watch-clip)">
        <circle cx={70} cy={70} r={50} fill={BG} />
        {children}
      </g>
      {/* thin inner edge */}
      <circle
        cx={70}
        cy={70}
        r={50}
        fill="none"
        stroke={BEZEL_EDGE}
        strokeWidth={1}
        opacity={0.5}
      />
    </svg>
  )
}

const DAY_RU = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
const MONTH_RU = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// ============================================================================
// CLOCK — Apple-Watch-modular vibe: huge tabular HH:MM, blinking colon,
// minute crown ring, lightweight date strip.
// ============================================================================
function ClockFace({ size, now }: { size: number; now: Date }) {
  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  const ss = String(now.getSeconds()).padStart(2, '0')
  return (
    <FaceFrame size={size}>
      <text
        x={70}
        y={50}
        textAnchor="middle"
        fontSize={7}
        fill={INK}
        opacity={0.55}
        letterSpacing={1.5}
        fontFamily="Inter, sans-serif"
        fontWeight={500}
        style={{ textTransform: 'uppercase' }}
      >
        {DAY_RU[now.getDay()]} · {now.getDate()} {MONTH_RU[now.getMonth()]}
      </text>
      <text
        x={70}
        y={82}
        textAnchor="middle"
        fontSize={30}
        fontWeight={600}
        fill={INK}
        fontFamily="'Space Grotesk', monospace"
        letterSpacing={-1.6}
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {hh}
        <tspan className="watch-colon" fill={INK} dx={0.5} dy={-1}>
          :
        </tspan>
        {mm}
      </text>
      <text
        x={70}
        y={100}
        textAnchor="middle"
        fontSize={9}
        fontWeight={500}
        fill={INK}
        opacity={0.45}
        fontFamily="'Space Grotesk', monospace"
        letterSpacing={0.4}
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        :{ss}
      </text>
    </FaceFrame>
  )
}

// ============================================================================
// HR — physiological pulse: heart icon "lub-dub" beat animation paced by bpm.
// No scrolling waveform; instead a single ECG tick that re-draws once per beat.
// ============================================================================
function HRFace({ size, hr, baseline }: { size: number; hr: number; baseline: number }) {
  const lo = Math.max(50, baseline - 25)
  const hi = baseline + 30
  const inNorm = hr >= lo && hr <= hi
  const zoneText = inNorm ? 'in range' : hr > hi ? 'above range' : 'below range'
  // 60 / clamp(40, hr, 200) seconds. For 84 bpm → 0.714 s.
  const beat = Math.max(0.3, Math.min(1.5, 60 / Math.max(40, Math.min(200, hr))))
  const beatStyle = { ['--beat-period' as string]: `${beat}s` }
  return (
    <FaceFrame size={size}>
      <text
        x={70}
        y={42}
        textAnchor="middle"
        fontSize={7}
        fill={INK}
        opacity={inNorm ? 0.55 : 1}
        letterSpacing={1.8}
        fontFamily="Inter, sans-serif"
        fontWeight={inNorm ? 500 : 700}
        style={{ textTransform: 'uppercase' }}
      >
        {zoneText}
      </text>

      <g transform="translate(70 62)">
        <circle
          r={9}
          fill={INK}
          opacity={0.12}
          className="watch-heart-glow"
          style={beatStyle}
        />
        <g className="watch-heart" style={beatStyle}>
          <path
            d="M 0 4
               C -6 -2, -9 -9, -4 -9
               C -2 -9, 0 -7, 0 -4.5
               C 0 -7, 2 -9, 4 -9
               C 9 -9, 6 -2, 0 4 Z"
            fill={INK}
          />
        </g>
      </g>

      <text
        x={70}
        y={92}
        textAnchor="middle"
        fontSize={26}
        fontWeight={600}
        fill={INK}
        fontFamily="'Space Grotesk', monospace"
        letterSpacing={-1.2}
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {hr}
      </text>
      <text
        x={70}
        y={104}
        textAnchor="middle"
        fontSize={6.5}
        fill={INK}
        opacity={0.5}
        letterSpacing={1.4}
        fontFamily="Inter, sans-serif"
        fontWeight={500}
      >
        BPM
      </text>
    </FaceFrame>
  )
}

// ============================================================================
// STEPS — green ring, big tabular number, sub-line goal, hourly micro-bars.
// ============================================================================
function StepsFace({
  size,
  steps,
  goal,
}: {
  size: number
  steps: number
  goal: number
  series?: number[]
}) {
  const pct = Math.max(0, Math.min(1, steps / goal))
  const ringR = 38
  const c = 2 * Math.PI * ringR
  return (
    <FaceFrame size={size}>
      {/* track */}
      <circle
        cx={70}
        cy={70}
        r={ringR}
        fill="none"
        stroke={INK}
        strokeWidth={3}
        opacity={0.18}
      />
      {/* progress arc */}
      <circle
        cx={70}
        cy={70}
        r={ringR}
        fill="none"
        stroke={INK}
        strokeWidth={3.5}
        strokeDasharray={`${c * pct} ${c}`}
        transform="rotate(-90 70 70)"
        strokeLinecap="round"
      />
      {/* footstep glyph above number */}
      <g transform="translate(70 56)" opacity={0.8}>
        <ellipse cx={-3} cy={0} rx={2} ry={2.8} fill={INK} />
        <ellipse cx={3} cy={2} rx={1.8} ry={2.4} fill={INK} opacity={0.6} />
      </g>
      {/* big number */}
      <text
        x={70}
        y={78}
        textAnchor="middle"
        fontSize={22}
        fontWeight={600}
        fill={INK}
        fontFamily="'Space Grotesk', monospace"
        letterSpacing={-0.8}
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {steps.toLocaleString('ru')}
      </text>
      {/* % */}
      <text
        x={70}
        y={90}
        textAnchor="middle"
        fontSize={7.5}
        fontFamily="Inter, sans-serif"
        fontWeight={600}
        fill={INK}
        opacity={0.65}
      >
        {Math.round(pct * 100)}% · {goal.toLocaleString('ru')}
      </text>
    </FaceFrame>
  )
}

// ============================================================================
// MESSAGE — large emoji or envelope, two-line body, sender + ago footer.
// ============================================================================
function MessageFace({
  size,
  text,
  emoji,
  from,
  ago,
}: {
  size: number
  text: string | null
  emoji: string | null
  from: string
  ago: string
}) {
  if (!text) {
    return (
      <FaceFrame size={size}>
        <text
          x={70}
          y={52}
          textAnchor="middle"
          fontSize={7}
          fill={INK}
          opacity={0.55}
          letterSpacing={1.8}
          fontFamily="Inter, sans-serif"
          fontWeight={500}
        >
          INBOX
        </text>
        <g transform="translate(60 70)" opacity={0.4}>
          <rect x={0} y={0} width={20} height={14} rx={2} fill="none" stroke={INK} strokeWidth={1.1} />
          <path d="M 0 0 L 10 8 L 20 0" fill="none" stroke={INK} strokeWidth={1.1} strokeLinecap="round" />
        </g>
        <text
          x={70}
          y={102}
          textAnchor="middle"
          fontSize={8.5}
          fill={INK}
          opacity={0.5}
          fontFamily="Inter, sans-serif"
        >
          empty
        </text>
      </FaceFrame>
    )
  }
  return (
    <FaceFrame size={size}>
      <text
        x={70}
        y={42}
        textAnchor="middle"
        fontSize={7}
        fill={INK}
        opacity={0.65}
        letterSpacing={1.8}
        fontFamily="Inter, sans-serif"
        fontWeight={600}
        style={{ textTransform: 'uppercase' }}
      >
        from {from}
      </text>
      {emoji && (
        <text x={70} y={70} textAnchor="middle" fontSize={22} className="watch-msg-icon">
          {emoji}
        </text>
      )}
      <foreignObject x={28} y={emoji ? 76 : 60} width={84} height={28}>
        <div
          style={{
            color: INK,
            fontFamily: 'Inter, sans-serif',
            fontSize: '10px',
            lineHeight: '1.25',
            textAlign: 'center',
            fontWeight: 500,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical' as const,
          }}
        >
          {text}
        </div>
      </foreignObject>
      <text
        x={70}
        y={112}
        textAnchor="middle"
        fontSize={6.5}
        fill={INK}
        opacity={0.45}
        letterSpacing={1.3}
        fontFamily="Inter, sans-serif"
        fontWeight={500}
        style={{ textTransform: 'uppercase' }}
      >
        {ago}
      </text>
    </FaceFrame>
  )
}

export default WatchPreview
