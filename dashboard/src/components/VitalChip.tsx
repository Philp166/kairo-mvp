import { useState, type FC } from 'react'
import MicroSpark from './MicroSpark'
import { useT } from '../lib/i18n'

export interface VitalChipProps {
  slot: string
  label: string
  value: string | number
  unit: string
  delta: string
  status: 'norm' | 'warn' | 'alert'
  color: string
  data: number[]
  scrubHour?: number | null
}

export const VitalChip: FC<VitalChipProps> = ({
  slot,
  label,
  value,
  unit,
  delta,
  status,
  color,
  data,
  scrubHour = null,
}) => {
  const { t } = useT()
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      className={`vital-chip status-${status}${expanded ? ' expanded' : ''}`}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      {/* bracket corners */}
      <div className="vital-cb tl" />
      <div className="vital-cb tr" />
      <div className="vital-cb bl" />
      <div className="vital-cb br" />

      <div className="vital-head">
        <span className="mono dim">SLOT/{slot}</span>
        <span className={`vital-pip status-${status}`} />
      </div>

      <div className="vital-label mono">{label}</div>

      <div className="vital-value">
        <span className="vital-num" style={{ color }}>
          {value}
        </span>
        <span className="vital-unit mono">{unit}</span>
      </div>

      <div className="vital-delta mono">{delta}</div>

      <div className="vital-spark">
        <MicroSpark data={data} color={color} w={200} h={44} highlight={scrubHour} />
      </div>

      {/* hover-only expansion details */}
      <div className="vital-expand">
        <div className="mono dim">{t('vital.range')}</div>
        <div className="vital-range">
          <span className="mono">{Math.min(...data)}</span>
          <span className="vital-range-bar">
            <span className="vital-range-fill" style={{ background: color }} />
          </span>
          <span className="mono">{Math.max(...data)}</span>
        </div>
      </div>
    </div>
  )
}

export interface VitalChipBankProps {
  vitals: VitalChipProps[]
  scrubHour?: number | null
}

export const VitalChipBank: FC<VitalChipBankProps> = ({
  vitals,
  scrubHour = null,
}) => (
  <div className="vital-bank">
    {vitals.map((v) => (
      <VitalChip key={v.slot} {...v} scrubHour={scrubHour} />
    ))}
  </div>
)

export default VitalChip
