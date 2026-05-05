import type { CSSProperties } from 'react'
import sprites from './sprites.json'
import './spark.css'

export type SparkState = 'calm' | 'active' | 'sleepy' | 'worried'
export type SparkEvent = null | 'parent_touch' | 'goal' | 'sos' | 'low_battery' | 'message'

interface SparkV1Props {
  state: SparkState
  event?: SparkEvent
  /** Bumped by parent to retrigger event animations (key/nonce). */
  eventKey?: number | string
  size?: number
  /** Disable idle animations (testing/storyboarding). */
  animate?: boolean
  className?: string
  style?: CSSProperties
}

type SpriteName = keyof typeof sprites.sprites
type StateName = keyof typeof sprites.states
type EventName = keyof typeof sprites.events

const CELL = sprites.cell
const PALETTE = sprites.palette as Record<string, string>
const VIEW = sprites.viewBox

const ANIM_CLASS: Record<string, string> = {
  pulse: 'spark-pulse',
  'z-float': 'spark-z-float',
  'excl-blink': 'spark-excl-blink',
  'heart-pop': 'spark-heart',
}

function renderSprite(
  spriteName: string,
  at: readonly number[],
  keyPrefix: string,
  animClass?: string,
) {
  const sp = (sprites.sprites as Record<string, { ink: number[][]; glint: number[][] }>)[spriteName]
  if (!sp) return null
  const [ox, oy] = at
  const rects = [
    ...sp.ink.map(([c, r], i) => (
      <rect
        key={`${keyPrefix}-i-${i}`}
        x={ox + c * CELL}
        y={oy + r * CELL}
        width={CELL}
        height={CELL}
        fill={PALETTE.ink}
        shapeRendering="crispEdges"
      />
    )),
    ...sp.glint.map(([c, r], i) => (
      <rect
        key={`${keyPrefix}-g-${i}`}
        x={ox + c * CELL}
        y={oy + r * CELL}
        width={CELL}
        height={CELL}
        fill={PALETTE.glint}
        shapeRendering="crispEdges"
      />
    )),
  ]
  if (animClass) {
    return (
      <g key={keyPrefix} className={animClass}>
        {rects}
      </g>
    )
  }
  return <g key={keyPrefix}>{rects}</g>
}

export function SparkV1({
  state,
  event = null,
  eventKey,
  size = 140,
  animate = true,
  className,
  style,
}: SparkV1Props) {
  const stateDef = sprites.states[state as StateName]
  const eventDef = event ? sprites.events[event as EventName] : null
  const hideMouth = !!eventDef?.hideMouth

  const screenFill = PALETTE[stateDef.bg]
  const breatheClass = animate ? `spark-breathe-${state}` : ''

  const stateItems = stateDef.items.filter((it) => {
    if (!hideMouth) return true
    return !it.sprite.toLowerCase().startsWith('mouth')
  })

  return (
    <svg
      viewBox={`0 0 ${VIEW[0]} ${VIEW[1]}`}
      width={size}
      height={size}
      className={className}
      style={style}
      role="img"
      aria-label={`Spark ${state}${event ? ` (${event})` : ''}`}
    >
      <defs>
        <clipPath id="kairo-screen-clip">
          <circle cx={sprites.screen.cx} cy={sprites.screen.cy} r={sprites.screen.r} />
        </clipPath>
      </defs>

      <rect
        x={0}
        y={0}
        width={VIEW[0]}
        height={VIEW[1]}
        rx={22}
        fill={PALETTE.bezel}
        stroke={PALETTE.bezelEdge}
        strokeWidth={2}
      />

      <g clipPath="url(#kairo-screen-clip)">
        <circle
          cx={sprites.screen.cx}
          cy={sprites.screen.cy}
          r={sprites.screen.r}
          fill={screenFill}
        />

        {/* breathing face: eyes + mouth scale together */}
        <g className={`spark-face ${breatheClass}`}>
          {stateItems
            .filter((it) => !it.anim)
            .map((it, i) => renderSprite(it.sprite, it.at, `s-${i}`))}
        </g>

        {/* indicators with their own loops */}
        {stateItems
          .filter((it) => it.anim)
          .map((it, i) =>
            renderSprite(
              it.sprite,
              it.at,
              `a-${i}`,
              animate ? ANIM_CLASS[it.anim as string] : undefined,
            ),
          )}

        {/* Calm-only blink overlay flashes briefly every 5s */}
        {state === 'calm' && animate && (
          <g key="blink" className="spark-blink">
            {renderSprite('eyeClosed', [44, 60], 'blink-l')}
            {renderSprite('eyeClosed', [76, 60], 'blink-r')}
          </g>
        )}

        {/* Event sprites */}
        {eventDef &&
          eventDef.items.map((it, i) => (
            <g key={`ev-${eventKey ?? 0}-${i}`}>
              {renderSprite(
                it.sprite,
                it.at,
                `ev-${i}`,
                ANIM_CLASS[(it.anim as string) ?? ''],
              )}
            </g>
          ))}
      </g>

      <circle
        cx={sprites.screen.cx}
        cy={sprites.screen.cy}
        r={sprites.screen.r}
        fill="none"
        stroke={PALETTE.bezelEdge}
        strokeWidth={1}
        opacity={0.5}
      />
    </svg>
  )
}

export default SparkV1
