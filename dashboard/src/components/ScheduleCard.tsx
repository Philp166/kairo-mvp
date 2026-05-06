/**
 * Schedule card for HAP-04 (Bedtime Reminder), HAP-05 (School Mode) and
 * generic quiet-window rules per spec §4.10. Parents add/edit/delete rules;
 * watch fires the haptic locally on schedule.
 */

import { useState } from 'react'

export type ScheduleRuleKind = 'bedtime' | 'school' | 'quiet'

export interface ScheduleRule {
  id: string
  kind: ScheduleRuleKind
  label: string
  enabled: boolean
  /** for kind = 'bedtime' */
  time?: string
  /** for kind = 'school' | 'quiet' */
  start?: string
  end?: string
}

const KIND_META: Record<
  ScheduleRuleKind,
  { hap: string; defaultLabel: string; sub: (r: ScheduleRule) => string }
> = {
  bedtime: {
    hap: 'HAP-04',
    defaultLabel: 'Reminder',
    sub: (r) => `Soft buzz at ${r.time ?? '--:--'}`,
  },
  school: {
    hap: 'HAP-05',
    defaultLabel: 'School mode',
    sub: (r) => `Quiet pulse every 20 min · ${r.start ?? '--'}–${r.end ?? '--'}`,
  },
  quiet: {
    hap: 'SILENT',
    defaultLabel: 'Quiet hours',
    sub: (r) => `No vibration · ${r.start ?? '--'}–${r.end ?? '--'}`,
  },
}

const NEW_RULE_TEMPLATE: Record<ScheduleRuleKind, Omit<ScheduleRule, 'id'>> = {
  bedtime: { kind: 'bedtime', label: 'Bedtime reminder', enabled: true, time: '21:30' },
  school: {
    kind: 'school',
    label: 'School mode',
    enabled: true,
    start: '08:30',
    end: '14:00',
  },
  quiet: { kind: 'quiet', label: 'Quiet hours', enabled: true, start: '14:00', end: '15:00' },
}

interface ScheduleCardProps {
  childName: string
  rules: ScheduleRule[]
  onChange: (next: ScheduleRule[]) => void
}

export function ScheduleCard({ childName, rules, onChange }: ScheduleCardProps) {
  const [adding, setAdding] = useState(false)

  const update = (id: string, patch: Partial<ScheduleRule>) =>
    onChange(rules.map((r) => (r.id === id ? { ...r, ...patch } : r)))

  const remove = (id: string) => onChange(rules.filter((r) => r.id !== id))

  const add = (kind: ScheduleRuleKind) => {
    const tpl = NEW_RULE_TEMPLATE[kind]
    onChange([...rules, { ...tpl, id: `r-${Date.now()}` }])
    setAdding(false)
  }

  return (
    <div className="space-y-3">
      {rules.map((r) => (
        <Row key={r.id} rule={r} onUpdate={(p) => update(r.id, p)} onRemove={() => remove(r.id)} />
      ))}

      {adding ? (
        <div className="rounded-xl border border-dashed border-app-line-2 p-3 bg-app-surface">
          <div className="text-xs text-app-muted mb-2 px-1">Pick a rule to add</div>
          <div className="flex flex-wrap gap-2">
            {(['bedtime', 'school', 'quiet'] as ScheduleRuleKind[]).map((k) => (
              <button
                key={k}
                onClick={() => add(k)}
                className="cursor-pointer text-[13px] px-3 py-1.5 rounded-full bg-app-bg border border-app-line-2 hover:border-app-ink/30 hover:text-app-ink text-app-muted transition-colors duration-150"
              >
                {KIND_META[k].defaultLabel}
              </button>
            ))}
            <button
              onClick={() => setAdding(false)}
              className="cursor-pointer text-[13px] px-3 py-1.5 rounded-full text-app-muted hover:text-app-ink transition-colors duration-150 ml-auto"
            >
              cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="cursor-pointer w-full rounded-xl border border-dashed border-app-line-2 px-3.5 py-3 text-sm text-app-muted hover:text-app-ink hover:border-app-ink/30 transition-colors duration-200"
        >
          + Add rule
        </button>
      )}

      <p className="text-[11px] text-app-muted px-1">
        Schedule runs on {childName}'s band — phone-free.
      </p>
    </div>
  )
}

interface RowProps {
  rule: ScheduleRule
  onUpdate: (patch: Partial<ScheduleRule>) => void
  onRemove: () => void
}

function Row({ rule, onUpdate, onRemove }: RowProps) {
  const [editingLabel, setEditingLabel] = useState(false)
  const meta = KIND_META[rule.kind]

  const labelEl = editingLabel ? (
    <input
      autoFocus
      type="text"
      value={rule.label}
      onChange={(e) => onUpdate({ label: e.target.value })}
      onBlur={() => setEditingLabel(false)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === 'Escape') setEditingLabel(false)
      }}
      className="text-sm font-medium text-app-ink bg-app-bg rounded px-2 py-0.5 border border-app-line-2 focus:outline-none focus:border-app-ink/40 min-w-0 flex-1"
    />
  ) : (
    <button
      onClick={() => setEditingLabel(true)}
      className="text-sm font-medium text-app-ink truncate hover:text-app-muted transition-colors duration-150 cursor-pointer text-left"
      title="Rename"
    >
      {rule.label}
    </button>
  )

  const toggle = (
    <button
      role="switch"
      aria-checked={rule.enabled}
      aria-label={`${rule.enabled ? 'Disable' : 'Enable'} ${rule.label}`}
      onClick={() => onUpdate({ enabled: !rule.enabled })}
      className={`cursor-pointer w-10 h-6 rounded-full relative transition-colors duration-200 shrink-0 ${
        rule.enabled ? 'bg-app-green' : 'bg-app-line-2'
      }`}
    >
      <span
        className="absolute top-0.5 size-5 rounded-full bg-white shadow-sm"
        style={{ left: rule.enabled ? 18 : 2 }}
      />
    </button>
  )

  const removeBtn = (
    <button
      onClick={onRemove}
      aria-label="Delete rule"
      title="Delete"
      className="cursor-pointer size-7 shrink-0 rounded-full text-app-muted hover:text-app-red hover:bg-app-red/10 transition-colors duration-150 flex items-center justify-center"
    >
      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <line x1={5} y1={6} x2={19} y2={6} />
        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <path d="M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14" />
      </svg>
    </button>
  )

  const timeInputs =
    rule.enabled && rule.kind === 'bedtime' ? (
      <input
        type="time"
        value={rule.time ?? '21:30'}
        onChange={(e) => onUpdate({ time: e.target.value })}
        className="text-sm px-3 py-1.5 rounded-lg border border-app-line bg-app-bg tabular focus:outline-none focus:border-app-ink/40"
      />
    ) : rule.enabled && (rule.kind === 'school' || rule.kind === 'quiet') ? (
      <div className="flex items-center gap-1.5 text-sm tabular">
        <input
          type="time"
          value={rule.start ?? '08:30'}
          onChange={(e) => onUpdate({ start: e.target.value })}
          className="px-2.5 py-1.5 rounded-lg border border-app-line bg-app-bg focus:outline-none focus:border-app-ink/40"
        />
        <span className="text-app-muted">–</span>
        <input
          type="time"
          value={rule.end ?? '14:00'}
          onChange={(e) => onUpdate({ end: e.target.value })}
          className="px-2.5 py-1.5 rounded-lg border border-app-line bg-app-bg focus:outline-none focus:border-app-ink/40"
        />
      </div>
    ) : null

  return (
    <div className="rounded-2xl border border-app-line p-3.5 bg-app-surface">
      {/* Top row: label + badge | toggle + delete */}
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0 flex items-center gap-2">
          {labelEl}
          <span className="text-[10px] tabular px-1.5 py-0.5 rounded-md bg-app-line/70 text-app-muted shrink-0">
            {meta.hap}
          </span>
        </div>
        {toggle}
        {removeBtn}
      </div>

      {/* Sub-line + time inputs */}
      <div className="mt-1.5 flex items-center justify-between gap-3 flex-wrap">
        <div className="text-xs text-app-muted min-w-0 truncate flex-1">
          {rule.enabled ? meta.sub(rule) : 'Off'}
        </div>
        {timeInputs}
      </div>
    </div>
  )
}

export default ScheduleCard
