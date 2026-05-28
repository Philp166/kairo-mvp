import { useState } from 'react'
import { useT } from '../lib/i18n'
import { SparkHalo } from './SparkHalo'

// ── Types ────────────────────────────────────────────────────

interface HeroPanelProps {
  sparkState: 'calm' | 'active' | 'sleepy' | 'worried'
  scrubHour: number
  scrubMoment?: { note: string; noteRu: string; state: string }
  vitals: {
    hr: { value: number | string; color: string }
    spo2: { value: number | string; color: string }
    temp: { value: string; color: string }
    battery: { value: number | string; color: string }
  }
  onTouch: (kind: string) => void
}

// ── Verdict i18n keys per spark state ────────────────────────

const STATE_VERDICT_KEYS: Record<string, { l: string; s: string }> = {
  calm:    { l: 'v.calm.l',    s: 'v.calm.s' },
  active:  { l: 'v.active.l',  s: 'v.active.s' },
  sleepy:  { l: 'v.sleepy.l',  s: 'v.sleepy.s' },
  worried: { l: 'v.worried.l', s: 'v.worried.s' },
}

// ── CartWave — SVG bar waveform per HAP code ─────────────────

const CART_WAVES: Record<string, number[]> = {
  'HAP-02': [0, 1, 2, 3, 4, 3, 2, 1, 0, 2, 4, 3, 1, 0],
  'HAP-03': [0, 0, 2, 3, 2, 0, 0, 3, 2, 0, 0, 0, 0, 0],
  'HAP-04': [0, 2, 2, 0, 0, 2, 2, 0, 0, 2, 2, 0, 0, 0],
}

export function CartWave({ hap }: { hap: string }) {
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

// ── TouchCartridge — physical-cartridge style button ──────────

interface TouchCartridgeProps {
  glyph: string
  label: string
  sub: string
  hap: string
  primary?: boolean
  onClick: () => void
}

function TouchCartridge({ glyph, label, sub, hap, primary, onClick }: TouchCartridgeProps) {
  const { t } = useT()
  const [firing, setFiring] = useState(false)

  function trigger() {
    setFiring(true)
    onClick()
    setTimeout(() => setFiring(false), 1100)
  }

  return (
    <button
      className={`cart${primary ? ' cart-primary' : ''}${firing ? ' firing' : ''}`}
      onClick={trigger}
    >
      <div className="cart-slot">
        <span className="cart-glyph">{glyph}</span>
        <div className="cart-info">
          <span className="cart-label">{label}</span>
          <span className="cart-sub mono">{sub}</span>
        </div>
        <span className="cart-hap mono">{hap}</span>
      </div>
      <div className="cart-waveform">
        <CartWave hap={hap} />
      </div>
      <div className="cart-status">
        <span className="cart-status-text mono">
          {firing ? t('cart.fire') : t('cart.ready')}
        </span>
        <span className={`cart-status-dot${firing ? ' fire' : ''}`} />
      </div>
    </button>
  )
}

// ── HeroPanel ────────────────────────────────────────────────

export function HeroPanel({
  sparkState,
  scrubHour,
  scrubMoment,
  vitals,
  onTouch,
}: HeroPanelProps) {
  const { lang, t } = useT()
  const k = STATE_VERDICT_KEYS[sparkState] || STATE_VERDICT_KEYS.calm

  return (
    <section className="hero-panel">
      <div className="hero-left">
        <SparkHalo sparkState={sparkState} vitals={vitals} size={300} />
      </div>

      <div className="hero-right">
        {/* tag line */}
        <div className="hero-tags mono">
          <span className="dim">{t('hero.child')}</span>
          <span className="accent">{t('hero.name')}</span>
          <span className="dim">&middot;</span>
          <span className="dim">{t('hero.node')}</span>
          <span className="dim">&middot;</span>
          <span className="ok-dot" />
          <span className="dim">{t('hero.live')}</span>
        </div>

        {/* verdict */}
        <h1 className="hero-title">
          <span>{t(k.l)}</span>
        </h1>
        <p className="hero-sub">{t(k.s)}</p>

        {/* scrub readout when not "now" */}
        {scrubHour < 23 && (
          <div className="hero-scrub-note mono">
            <span className="dim">{t('hero.scrub')}</span>
            <span className="accent">
              {scrubHour.toString().padStart(2, '0')}:00
            </span>
            <span>&middot;</span>
            <span>
              {lang === 'ru' ? scrubMoment?.noteRu : scrubMoment?.note}
            </span>
            <span className="dim">&middot; {t('hero.scrub.hint')}</span>
          </div>
        )}

        {/* touch cartridges */}
        <div className="hero-touches">
          <div className="hero-touches-label mono dim">{t('hero.send')}</div>
          <div className="hero-touches-row">
            <TouchCartridge
              glyph="&#9829;"
              label={t('cart.hug')}
              sub={t('cart.hug.sub')}
              hap="HAP-03"
              primary
              onClick={() => onTouch('hug')}
            />
            <TouchCartridge
              glyph="&#9733;"
              label={t('cart.cheer')}
              sub={t('cart.cheer.sub')}
              hap="HAP-02"
              onClick={() => onTouch('cheer')}
            />
            <TouchCartridge
              glyph="&#9790;"
              label={t('cart.bed')}
              sub={t('cart.bed.sub')}
              hap="HAP-04"
              onClick={() => onTouch('bedtime')}
            />
          </div>
          <div className="hero-touches-foot mono dim">
            {t('hero.send.foot')}
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeroPanel
