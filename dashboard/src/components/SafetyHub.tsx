/**
 * Safety & Compliance hub. Anchored in spec:
 *  - §10 R-07 — implant warning (CRITICAL onboarding ack)
 *  - §8.3   — wellness, no medical claims at launch
 *  - §2.8 / R-04 — IP68 limits (no saltwater)
 *  - §10 R-09 — counterfeit / verified-device badge
 *  - §4.5     — wear-time compliance
 */

import { AlertIcon } from './icons'

interface SafetyHubProps {
  pacemakerAck: boolean
  onTogglePacemakerAck: () => void
  deviceVerified: boolean
}

export function SafetyHub({ pacemakerAck, onTogglePacemakerAck, deviceVerified }: SafetyHubProps) {
  return (
    <div className="space-y-3">
      <Item
        tone={pacemakerAck ? 'good' : 'attention'}
        title="Имплантированные устройства"
        body="Не использовать рядом с кардиостимуляторами, ICD, кохлеарными имплантами, инсулиновыми помпами с активной телеметрией. Магниты застёжки и зарядного дока создают локальное поле."
        ref="спека §10 R-07 · IFU"
        action={
          <button
            onClick={onTogglePacemakerAck}
            className={`cursor-pointer text-xs px-3 py-1.5 rounded-full transition-colors duration-200 ${
              pacemakerAck
                ? 'bg-app-green/10 text-app-green'
                : 'bg-app-red text-white hover:opacity-90'
            }`}
          >
            {pacemakerAck ? 'Подтверждено ✓' : 'Прочитать и принять'}
          </button>
        }
      />

      <Item
        tone="normal"
        title="Wellness, не диагностика"
        body="Kairo показывает сигналы wellness — пульс, сатурация, температура, активность, сон. Это не медицинский прибор и не заменяет осмотр педиатра. FDA De Novo в работе."
        ref="спека §8.3"
      />

      <Item
        tone="normal"
        title="Вода: IP68 ≠ бассейн"
        body="Браслет водонепроницаем для брызг и душа (1,5 м × 30 мин пресная вода по IEC 60529). Бассейн с хлором, морская вода и сауна — не рекомендуются."
        ref="спека §2.8 · R-04"
      />

      <Item
        tone={deviceVerified ? 'good' : 'attention'}
        title={deviceVerified ? 'Браслет подлинный' : 'Браслет не верифицирован'}
        body={
          deviceVerified
            ? 'NFC challenge-response подтвердил оригинальное железо Kairo при сопряжении.'
            : 'Не удалось подтвердить происхождение устройства. Свяжитесь с поддержкой.'
        }
        ref="спека §10 R-09"
      />
    </div>
  )
}

interface ItemProps {
  tone: 'normal' | 'good' | 'attention'
  title: string
  body: string
  ref: string
  action?: React.ReactNode
}

function Item({ tone, title, body, ref, action }: ItemProps) {
  const dot =
    tone === 'attention' ? 'bg-app-red' : tone === 'good' ? 'bg-app-green' : 'bg-app-line-2'
  return (
    <div className="rounded-xl border border-app-line bg-app-surface p-4">
      <div className="flex items-start gap-3">
        <span className="mt-1.5 shrink-0">
          {tone === 'attention' ? (
            <AlertIcon width={16} height={16} className="text-app-red" />
          ) : (
            <span className={`block size-2 rounded-full ${dot}`} />
          )}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-app-ink">{title}</span>
            <span className="text-[10px] uppercase tracking-[0.08em] text-app-muted">{ref}</span>
          </div>
          <p className="text-xs text-app-ink-2 leading-relaxed mt-1">{body}</p>
          {action && <div className="mt-3">{action}</div>}
        </div>
      </div>
    </div>
  )
}

export default SafetyHub
