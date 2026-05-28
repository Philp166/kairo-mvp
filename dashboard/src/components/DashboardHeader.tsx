import { useT } from '../lib/i18n'

interface DashboardHeaderProps {
  lang: 'en' | 'ru'
  onLang: (lang: 'en' | 'ru') => void
  ble: 'live' | 'idle'
  onToggleBle: () => void
  childName: string
  childInitial: string
}

export function DashboardHeader({
  lang,
  onLang,
  ble,
  onToggleBle,
  childName,
  childInitial,
}: DashboardHeaderProps) {
  const { t } = useT()

  return (
    <header className="dash-header">
      {/* ── Left: brand ── */}
      <div className="brand">
        <span className="brand-mark">KAIRO / DASHBOARD</span>
        <span className="brand-sub">{t('brand.sub')}</span>
      </div>

      {/* ── Center: child chip ── */}
      <div className="dash-header-center">
        <div className="child-chip">
          <span className="child-chip-avatar">{childInitial}</span>
          <div>
            <div className="child-chip-name">{childName}</div>
            <div className="child-chip-meta mono">{t('child.age')}</div>
          </div>
          <span className="child-chip-status" />
        </div>
      </div>

      {/* ── Right: BLE toggle + lang toggle ── */}
      <div className="dash-header-right">
        <button
          className={`ble-toggle${ble === 'live' ? ' live' : ''}`}
          onClick={onToggleBle}
        >
          <span className="ble-dot" />
          <span className="mono">
            {ble === 'live' ? t('ble.live') : 'PAIR'}
          </span>
        </button>

        <div className="lang-toggle" role="group" aria-label="Language">
          <button
            className={lang === 'en' ? 'active' : ''}
            onClick={() => onLang('en')}
          >
            EN
          </button>
          <button
            className={lang === 'ru' ? 'active' : ''}
            onClick={() => onLang('ru')}
          >
            RU
          </button>
        </div>
      </div>
    </header>
  )
}

export default DashboardHeader
