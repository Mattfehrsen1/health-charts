import { useId, useMemo } from 'react';
import { TimeAxis } from './axes';
import { stepPath } from './core/path';
import { scaleLinear } from './core/scale';
import {
  SLEEP_STAGES,
  STAGE_LABELS,
  formatDuration,
  stageTotals,
  type SleepSegment,
} from './core/sleep';
import { formatTime } from './core/ticks';
import { useElementSize } from './hooks';
import { axisFont, colors } from './theme';

export interface SleepStagesChartProps {
  /** Consecutive stage segments, sorted by start time. */
  segments: readonly SleepSegment[];
  height?: number;
  label?: string;
  className?: string;
}

const MARGIN = { top: 8, right: 16, bottom: 28, left: 52 };

export function SleepStagesChart({
  segments,
  height = 200,
  label = 'Sleep stages',
  className,
}: SleepStagesChartProps) {
  const [containerRef, { width }] = useElementSize<HTMLDivElement>();
  const titleId = useId();
  const descId = useId();

  const totals = useMemo(() => stageTotals(segments), [segments]);
  const start = segments[0]?.start ?? 0;
  const end = segments.at(-1)?.end ?? 0;
  const inBed = end - start;

  const left = MARGIN.left;
  const right = Math.max(left, width - MARGIN.right);
  const bottom = height - MARGIN.bottom;
  const rowHeight = (bottom - MARGIN.top) / SLEEP_STAGES.length;
  const rowTop = (stage: SleepSegment['stage']) =>
    MARGIN.top + SLEEP_STAGES.indexOf(stage) * rowHeight;

  const x = scaleLinear([start, end], [left, right]);
  const connector = stepPath(
    segments.map((s) => ({ x: x(s.start), y: rowTop(s.stage) + rowHeight / 2 })),
    x(end),
  );

  const description =
    segments.length === 0
      ? 'No sleep data.'
      : `From ${formatTime(start)} to ${formatTime(end)} (${formatDuration(inBed)}): ` +
        SLEEP_STAGES.map((stage) => `${STAGE_LABELS[stage]} ${formatDuration(totals[stage])}`).join(
          ', ',
        ) +
        '.';

  return (
    <div className={className}>
      <div ref={containerRef} style={{ height }}>
        {width > 0 && (
          <svg
            width={width}
            height={height}
            role="img"
            aria-labelledby={titleId}
            aria-describedby={descId}
            style={{ display: 'block' }}
          >
            <title id={titleId}>{label}</title>
            <desc id={descId}>{description}</desc>
            <g style={axisFont}>
              {SLEEP_STAGES.map((stage) => (
                <text
                  key={stage}
                  x={left - 8}
                  y={rowTop(stage) + rowHeight / 2}
                  dy="0.32em"
                  textAnchor="end"
                  fill={colors.muted}
                >
                  {STAGE_LABELS[stage]}
                </text>
              ))}
            </g>
            <path d={connector} fill="none" stroke={colors.grid} strokeWidth={1} />
            {segments.map((segment) => (
              <rect
                key={segment.start}
                data-stage={segment.stage}
                x={x(segment.start)}
                width={Math.max(1, x(segment.end) - x(segment.start))}
                y={rowTop(segment.stage) + rowHeight * 0.15}
                height={rowHeight * 0.7}
                rx={2}
                fill={colors.stages[segment.stage]}
              />
            ))}
            <TimeAxis scale={x} y={bottom} />
          </svg>
        )}
      </div>
      <ul
        aria-label={`${label} totals`}
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '4px 16px',
          margin: '8px 0 0',
          padding: 0,
          listStyle: 'none',
          fontSize: 13,
        }}
      >
        {SLEEP_STAGES.map((stage) => (
          <li
            key={stage}
            style={{ display: 'flex', alignItems: 'center', gap: 6, color: colors.text }}
          >
            <span
              aria-hidden="true"
              style={{ width: 10, height: 10, borderRadius: 2, background: colors.stages[stage] }}
            />
            <span>
              {STAGE_LABELS[stage]} <strong>{formatDuration(totals[stage])}</strong>
              {inBed > 0 && (
                <span style={{ color: colors.muted }}>
                  {' '}
                  · {Math.round((totals[stage] / inBed) * 100)}%
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
