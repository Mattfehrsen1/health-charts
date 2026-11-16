import { useEffect, useRef, useState } from 'react';
import { arcPath } from './core/path';
import { usePrefersReducedMotion } from './hooks';
import { colors } from './theme';

export interface StrainRingProps {
  /** Strain on a 0–21 scale; values outside it are clamped. */
  value: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  /** Animation length in ms. Ignored when the user prefers reduced motion. */
  duration?: number;
  className?: string;
}

export const MAX_STRAIN = 21;
const START_ANGLE = (-135 * Math.PI) / 180;
const SWEEP = (270 * Math.PI) / 180;

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

/** Eases from the currently displayed value to `target` on each change. */
function useAnimatedValue(target: number, duration: number): number {
  const reducedMotion = usePrefersReducedMotion();
  const animate = !reducedMotion && duration > 0;
  const [value, setValue] = useState(animate ? 0 : target);
  const displayed = useRef(value);

  useEffect(() => {
    if (!animate) {
      displayed.current = target;
      return;
    }
    const from = displayed.current;
    let frame = 0;
    let startTime: number | undefined;
    const tick = (now: number) => {
      startTime ??= now;
      const progress = Math.min(1, (now - startTime) / duration);
      displayed.current = from + (target - from) * easeOutCubic(progress);
      setValue(displayed.current);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [target, duration, animate]);

  return animate ? value : target;
}

export function StrainRing({
  value,
  size = 160,
  strokeWidth = 14,
  label = 'Strain',
  duration = 900,
  className,
}: StrainRingProps) {
  const target = Number.isFinite(value) ? Math.min(MAX_STRAIN, Math.max(0, value)) : 0;
  const shown = useAnimatedValue(target, duration);

  const center = size / 2;
  const radius = center - strokeWidth / 2;
  const valueEnd = START_ANGLE + SWEEP * (shown / MAX_STRAIN);

  return (
    <div
      className={className}
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={MAX_STRAIN}
      aria-valuenow={target}
      aria-valuetext={`${target.toFixed(1)} of ${MAX_STRAIN}`}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} aria-hidden="true" style={{ display: 'block' }}>
        <path
          d={arcPath(center, center, radius, START_ANGLE, START_ANGLE + SWEEP)}
          fill="none"
          stroke={colors.track}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        <path
          d={arcPath(center, center, radius, START_ANGLE, valueEnd)}
          fill="none"
          stroke={colors.strain}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        <text
          x={center}
          y={center}
          textAnchor="middle"
          dy="0.1em"
          fill={colors.text}
          style={{ fontSize: size * 0.24, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}
        >
          {shown.toFixed(1)}
        </text>
        <text
          x={center}
          y={center + size * 0.18}
          textAnchor="middle"
          fill={colors.muted}
          style={{ fontSize: size * 0.09 }}
        >
          {label}
        </text>
      </svg>
    </div>
  );
}
