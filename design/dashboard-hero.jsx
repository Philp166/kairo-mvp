/**
 * Dashboard — Hero + Touch Cartridges + Header bits
 */

const { useState, useEffect, useRef } = React;

// ── Touch Cartridge — physical-cartridge style button ──────
function TouchCartridge({ glyph, label, sub, hap, primary, onClick }) {
  const { t } = React.useContext(window.LangCtx);
  const [firing, setFiring] = useState(false);
  function trigger() {
    setFiring(true);
    onClick?.();
    setTimeout(() => setFiring(false), 1100);
  }
  return (
    <button
      className={`cart ${primary ? 'cart-primary' : ''} ${firing ? 'firing' : ''}`}
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
        <span className="cart-status-text mono">{firing ? t('cart.fire') : t('cart.ready')}</span>
        <span className={`cart-status-dot ${firing ? 'fire' : ''}`}></span>
      </div>
    </button>
  );
}

const CART_WAVES = {
  'HAP-02': [0,1,2,3,4,3,2,1,0,2,4,3,1,0],
  'HAP-03': [0,0,2,3,2,0,0,3,2,0,0,0,0,0],
  'HAP-04': [0,2,2,0,0,2,2,0,0,2,2,0,0,0],
};

function CartWave({ hap }) {
  const data = CART_WAVES[hap] || CART_WAVES['HAP-03'];
  return (
    <svg viewBox={`0 0 ${data.length * 4} 14`} width="100%" height="14" preserveAspectRatio="none">
      {data.map((v, i) => (
        <rect key={i} x={i * 4} y={7 - v} width={2.5} height={Math.max(1, v * 2)} fill="currentColor" opacity={v ? 0.85 : 0.2} />
      ))}
    </svg>
  );
}

// ── Hero Panel ─────────────────────────────────────────────
const STATE_VERDICT_KEYS = {
  calm:    { l: 'v.calm.l',    s: 'v.calm.s' },
  active:  { l: 'v.active.l',  s: 'v.active.s' },
  sleepy:  { l: 'v.sleepy.l',  s: 'v.sleepy.s' },
  worried: { l: 'v.worried.l', s: 'v.worried.s' },
};

function HeroPanel({ child, sparkState, scrubMoment, scrubHour, vitals, onTouch, onSos }) {
  const { lang, t } = React.useContext(window.LangCtx);
  const k = STATE_VERDICT_KEYS[sparkState] || STATE_VERDICT_KEYS.calm;
  return (
    <section className="hero-panel">
      <div className="hero-left">
        <SparkHalo sparkState={sparkState} vitals={vitals} size={300} />
      </div>
      <div className="hero-right">
        <div className="hero-tags mono">
          <span className="dim">{t('hero.child')}</span>
          <span className="accent">{t('hero.name')}</span>
          <span className="dim">·</span>
          <span className="dim">{t('hero.node')}</span>
          <span className="dim">·</span>
          <span className="ok-dot"></span>
          <span className="dim">{t('hero.live')}</span>
        </div>
        <h1 className="hero-title">
          <span>{t(k.l)}</span>
        </h1>
        <p className="hero-sub">{t(k.s)}</p>

        {/* scrub readout when not "now" */}
        {scrubHour < 23 && (
          <div className="hero-scrub-note mono">
            <span className="dim">{t('hero.scrub')}</span>
            <span className="accent">{scrubHour.toString().padStart(2,'0')}:00</span>
            <span>·</span>
            <span>{lang === 'ru' ? scrubMoment?.noteRu : scrubMoment?.note}</span>
            <span className="dim">· {t('hero.scrub.hint')}</span>
          </div>
        )}

        <div className="hero-touches">
          <div className="hero-touches-label mono dim">{t('hero.send')}</div>
          <div className="hero-touches-row">
            <TouchCartridge glyph="♥" label={t('cart.hug')}   sub={t('cart.hug.sub')}   hap="HAP-03" primary onClick={() => onTouch('hug')} />
            <TouchCartridge glyph="★" label={t('cart.cheer')} sub={t('cart.cheer.sub')} hap="HAP-02" onClick={() => onTouch('cheer')} />
            <TouchCartridge glyph="☾" label={t('cart.bed')}   sub={t('cart.bed.sub')}   hap="HAP-04" onClick={() => onTouch('bedtime')} />
          </div>
          <div className="hero-touches-foot mono dim">
            {t('hero.send.foot')}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Header ─────────────────────────────────────────────────
function DashboardHeader({ theme, onTheme, lang, onLang, child, onChildChange, ble, onToggleBle }) {
  const { t } = React.useContext(window.LangCtx);
  return (
    <header className="dash-header">
      <div className="brand">
        <span className="brand-mark">KAIRO / DASHBOARD</span>
        <span className="brand-sub">{t('brand.sub')}</span>
      </div>

      <div className="dash-header-center">
        <div className="child-chip">
          <span className="child-chip-avatar">M</span>
          <div>
            <div className="child-chip-name">{lang === 'ru' ? 'Миша' : 'Misha'}</div>
            <div className="child-chip-meta mono">{t('child.age')}</div>
          </div>
          <span className="child-chip-status"></span>
        </div>
      </div>

      <div className="dash-header-right">
        <button className={`ble-toggle ${ble === 'live' ? 'live' : ''}`} onClick={onToggleBle}>
          <span className="ble-dot"></span>
          <span className="mono">{ble === 'live' ? t('ble.live') : t('ble.mock')}</span>
        </button>
        <a className="back-link" href="Spark Character.html">{t('header.back')}</a>
        <div className="lang-toggle" role="group" aria-label="Language">
          <button className={lang === 'en' ? 'active' : ''} onClick={() => onLang('en')}>EN</button>
          <button className={lang === 'ru' ? 'active' : ''} onClick={() => onLang('ru')}>RU</button>
        </div>
        <div className="toggle">
          <button className={theme === 'light' ? 'active' : ''} onClick={() => onTheme('light')}>{t('header.theme.light')}</button>
          <button className={theme === 'dark' ? 'active' : ''} onClick={() => onTheme('dark')}>{t('header.theme.dark')}</button>
        </div>
      </div>
    </header>
  );
}

// ── Toast notification (parent touch confirmation) ─────────
function Toast({ toast, onDismiss }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => onDismiss(), 2600);
    return () => clearTimeout(t);
  }, [toast]);
  if (!toast) return null;
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
  );
}

window.TouchCartridge = TouchCartridge;
window.HeroPanel = HeroPanel;
window.DashboardHeader = DashboardHeader;
window.Toast = Toast;
window.STATE_VERDICT_KEYS = STATE_VERDICT_KEYS;
