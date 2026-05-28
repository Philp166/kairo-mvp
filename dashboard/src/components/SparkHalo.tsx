/**
 * SparkHalo — concentric vital rings around Spark
 * Renders HR / SpO2 / Temp / Battery as animated halo rings
 * with tick marks, labels, and a pulsing HR dot.
 */

import type { ReactElement } from 'react';
import { Spark } from './Spark';
import type { SparkState } from './Spark';

// ── Types ────────────────────────────────────────────────────

interface VitalValue {
  value: number;
  color: string;
}

interface TempValue {
  value: string;
  color: string;
}

export interface SparkHaloProps {
  sparkState: SparkState;
  vitals: {
    hr: VitalValue;
    spo2: VitalValue;
    temp: TempValue;
    battery: VitalValue;
  };
  size?: number;
}

// ── HaloRing sub-component ───────────────────────────────────

interface HaloRingProps {
  radius: number;
  strokeWidth: number;
  fillPct: number;
  color: string;
  dasharray?: string;
  animClass?: string;
  opacity?: number;
}

function HaloRing({
  radius,
  strokeWidth,
  fillPct,
  color,
  dasharray,
  animClass,
  opacity = 1,
}: HaloRingProps) {
  const circ = 2 * Math.PI * radius;
  const filled = (fillPct / 100) * circ;
  return (
    <circle
      r={radius}
      cx={0}
      cy={0}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeDasharray={dasharray || `${filled} ${circ}`}
      strokeOpacity={opacity}
      transform="rotate(-90)"
      className={animClass}
      strokeLinecap="round"
    />
  );
}

// ── Utility ──────────────────────────────────────────────────

function norm(val: number, min: number, max: number): number {
  return Math.max(0, Math.min(100, ((val - min) / (max - min)) * 100));
}

// ── Main SparkHalo component ─────────────────────────────────

export function SparkHalo({ sparkState, vitals, size = 280 }: SparkHaloProps) {
  const sparkSize = 200;
  const rOuter = size / 2 - 6;
  const rHr = rOuter - 2;
  const rSpo = rOuter - 14;
  const rTemp = rOuter - 26;
  const rBatt = rOuter - 38;

  // Build tick marks around HR ring
  const ticks: ReactElement[] = [];
  for (let i = 0; i < 48; i++) {
    const ang = (i / 48) * 2 * Math.PI;
    const x1 = Math.cos(ang) * rHr;
    const y1 = Math.sin(ang) * rHr;
    const x2 = Math.cos(ang) * (rHr - 3);
    const y2 = Math.sin(ang) * (rHr - 3);
    ticks.push(
      <line
        key={i}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="var(--ink)"
        strokeOpacity={0.15}
        strokeWidth={0.5}
      />,
    );
  }

  return (
    <div className="spark-halo-wrap" style={{ width: size, height: size }}>
      <svg
        viewBox={`-${size / 2} -${size / 2} ${size} ${size}`}
        width={size}
        height={size}
        className="halo-svg"
      >
        {/* HR ring (pulses) */}
        <g className="halo-hr">
          <HaloRing
            radius={rHr}
            strokeWidth={1}
            fillPct={100}
            color="var(--line)"
            opacity={0.4}
          />
          <HaloRing
            radius={rHr}
            strokeWidth={2.5}
            fillPct={norm(vitals.hr.value, 40, 160)}
            color={vitals.hr.color}
            animClass="halo-pulse-hr"
          />
        </g>

        {/* tick marks around HR ring */}
        {ticks}

        {/* SpO2 ring */}
        <HaloRing
          radius={rSpo}
          strokeWidth={1}
          fillPct={100}
          color="var(--line)"
          opacity={0.3}
        />
        <HaloRing
          radius={rSpo}
          strokeWidth={2}
          fillPct={norm(vitals.spo2.value, 90, 100)}
          color={vitals.spo2.color}
        />

        {/* Temp ring (delta from baseline, +/-0.5 range) */}
        <HaloRing
          radius={rTemp}
          strokeWidth={1}
          fillPct={100}
          color="var(--line)"
          opacity={0.3}
        />
        <HaloRing
          radius={rTemp}
          strokeWidth={2}
          fillPct={norm(Math.abs(parseFloat(vitals.temp.value)), 0, 0.5)}
          color={vitals.temp.color}
        />

        {/* Battery ring */}
        <HaloRing
          radius={rBatt}
          strokeWidth={1}
          fillPct={100}
          color="var(--line)"
          opacity={0.3}
        />
        <HaloRing
          radius={rBatt}
          strokeWidth={2}
          fillPct={vitals.battery.value}
          color={vitals.battery.color}
        />

        {/* HR pulse dot floating along the ring */}
        <circle r={3} fill={vitals.hr.color} className="halo-dot">
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 0 0"
            to="360 0 0"
            dur="60s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="cx"
            values={`${rHr};${rHr}`}
            dur="60s"
          />
        </circle>
      </svg>

      {/* Spark in the center */}
      <div
        className="halo-center"
        style={{ width: sparkSize, height: sparkSize }}
      >
        <Spark state={sparkState} size={sparkSize} label={false} frame={false} />
      </div>

      {/* External labels (top: HR / right: SpO2 / bottom: Temp / left: Batt) */}
      <div className="halo-label halo-label-t mono">
        <span className="dim">HR</span>
        <span style={{ color: vitals.hr.color }}>{vitals.hr.value}</span>
      </div>
      <div className="halo-label halo-label-r mono">
        <span className="dim">SPO&#x2082;</span>
        <span style={{ color: vitals.spo2.color }}>{vitals.spo2.value}%</span>
      </div>
      <div className="halo-label halo-label-b mono">
        <span className="dim">&Delta;T</span>
        <span style={{ color: vitals.temp.color }}>{vitals.temp.value}&deg;C</span>
      </div>
      <div className="halo-label halo-label-l mono">
        <span className="dim">BATT</span>
        <span style={{ color: vitals.battery.color }}>
          {vitals.battery.value}%
        </span>
      </div>
    </div>
  );
}

export default SparkHalo;
