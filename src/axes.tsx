import type { LinearScale } from './core/scale';
import { formatTime, niceTicks, timeTicks } from './core/ticks';
import { axisFont, colors } from './theme';

interface TimeAxisProps {
  scale: LinearScale;
  /** Baseline of the axis in pixels. */
  y: number;
  count?: number;
}

export function TimeAxis({ scale, y, count }: TimeAxisProps) {
  const [start, end] = scale.domain;
  const { ticks, step } = timeTicks(
    start,
    end,
    count ?? Math.max(2, Math.floor((scale.range[1] - scale.range[0]) / 80)),
  );
  return (
    <g aria-hidden="true" style={axisFont}>
      {ticks.map((tick) => (
        <text key={tick} x={scale(tick)} y={y + 16} textAnchor="middle" fill={colors.muted}>
          {formatTime(tick, step)}
        </text>
      ))}
    </g>
  );
}

interface ValueAxisProps {
  scale: LinearScale;
  /** Left and right edges of the plot area; grid lines span between them. */
  left: number;
  right: number;
  count?: number;
}

export function ValueAxis({ scale, left, right, count = 4 }: ValueAxisProps) {
  const [min, max] = scale.domain;
  return (
    <g aria-hidden="true" style={axisFont}>
      {niceTicks(min, max, count).map((tick) => (
        <g key={tick}>
          <line x1={left} x2={right} y1={scale(tick)} y2={scale(tick)} stroke={colors.grid} />
          <text x={left - 6} y={scale(tick)} dy="0.32em" textAnchor="end" fill={colors.muted}>
            {tick}
          </text>
        </g>
      ))}
    </g>
  );
}
