import { useId, useMemo, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { TimeAxis, ValueAxis } from './axes';
import { nearestIndex } from './core/decimate';
import { navigate } from './core/navigation';
import { breakOnGaps, linePath } from './core/path';
import { extent, scaleLinear } from './core/scale';
import { formatTime, niceDomain } from './core/ticks';
import { heartRateZones, zoneFor } from './core/zones';
import { useElementSize } from './hooks';
import { colors, visuallyHidden } from './theme';

export interface HeartRateSample {
  /** Epoch milliseconds. Samples must be sorted by time. */
  time: number;
  bpm: number;
}

export interface HeartRateChartProps {
  data: readonly HeartRateSample[];
  height?: number;
  /** Used to derive the shaded heart-rate zones. */
  maxHeartRate?: number;
  /** Samples further apart than this are not joined by the line. */
  maxGapMs?: number;
  label?: string;
  className?: string;
}

const MARGIN = { top: 12, right: 16, bottom: 28, left: 40 };

export function HeartRateChart({
  data,
  height = 240,
  maxHeartRate = 190,
  maxGapMs = 5 * 60_000,
  label = 'Heart rate',
  className,
}: HeartRateChartProps) {
  const [containerRef, { width }] = useElementSize<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);
  // Only keyboard moves are announced; hovering would flood the screen reader.
  const [announce, setAnnounce] = useState(false);
  const [previousData, setPreviousData] = useState(data);
  if (data !== previousData) {
    setPreviousData(data);
    setActive(null);
  }
  const summaryId = useId();

  const zones = useMemo(() => heartRateZones(maxHeartRate), [maxHeartRate]);
  const times = useMemo(() => data.map((d) => d.time), [data]);
  const bpmRange = useMemo(() => extent(data.map((d) => d.bpm)), [data]);

  const left = MARGIN.left;
  const right = Math.max(left, width - MARGIN.right);
  const top = MARGIN.top;
  const bottom = height - MARGIN.bottom;

  const x = useMemo(
    () => scaleLinear([times[0] ?? 0, times.at(-1) ?? 0], [left, right]),
    [times, left, right],
  );
  const y = useMemo(
    () =>
      scaleLinear(bpmRange ? niceDomain(bpmRange[0] - 5, bpmRange[1] + 5, 4) : [0, 1], [
        bottom,
        top,
      ]),
    [bpmRange, bottom, top],
  );

  const path = useMemo(
    () =>
      linePath(
        breakOnGaps(data, (d) => d.time, maxGapMs).map((d) =>
          d ? { x: x(d.time), y: y(d.bpm) } : { x: NaN, y: NaN },
        ),
      ),
    [data, maxGapMs, x, y],
  );

  const activeSample = active === null ? undefined : data[active];
  const activeZone = activeSample && zoneFor(activeSample.bpm, zones);

  const onKeyDown = (event: KeyboardEvent<SVGSVGElement>) => {
    const next = navigate(event.key, active, data.length);
    if (next === undefined) return;
    event.preventDefault();
    setActive(next);
    setAnnounce(true);
  };

  const onPointerMove = (event: PointerEvent<SVGSVGElement>) => {
    if (data.length === 0) return;
    const offsetX = event.clientX - event.currentTarget.getBoundingClientRect().left;
    setActive(nearestIndex(times, x.invert(offsetX)));
    setAnnounce(false);
  };

  const [minBpm, maxBpm] = y.domain;
  const first = data[0];
  const last = data.at(-1);

  return (
    <div ref={containerRef} className={className} style={{ position: 'relative', height }}>
      <p id={summaryId} style={visuallyHidden}>
        {first && last && bpmRange
          ? `${label} from ${formatTime(first.time)} to ${formatTime(last.time)}, ` +
            `${Math.round(bpmRange[0])} to ${Math.round(bpmRange[1])} bpm. ` +
            'Use the arrow keys to move between readings.'
          : 'No heart rate data.'}
      </p>
      {width > 0 && (
        <svg
          width={width}
          height={height}
          role="group"
          aria-roledescription="chart"
          aria-label={label}
          aria-describedby={summaryId}
          tabIndex={0}
          onKeyDown={onKeyDown}
          onPointerMove={onPointerMove}
          onPointerLeave={() => {
            setActive(null);
          }}
          onBlur={() => {
            setActive(null);
          }}
          style={{ display: 'block', touchAction: 'pan-y' }}
        >
          <g aria-hidden="true">
            {zones.map((zone, i) => {
              const lo = Math.max(zone.min, minBpm);
              const hi = Math.min(zone.max, maxBpm);
              if (hi <= lo) return null;
              return (
                <g key={zone.name}>
                  <rect
                    x={left}
                    width={right - left}
                    y={y(hi)}
                    height={y(lo) - y(hi)}
                    fill={colors.zones[i]}
                  />
                  <text
                    x={right - 4}
                    y={y(hi) + 12}
                    textAnchor="end"
                    fontSize={10}
                    fill={colors.muted}
                  >
                    {zone.name}
                  </text>
                </g>
              );
            })}
          </g>
          <ValueAxis scale={y} left={left} right={right} />
          <TimeAxis scale={x} y={bottom} />
          <path
            d={path}
            fill="none"
            stroke={colors.line}
            strokeWidth={1.75}
            strokeLinejoin="round"
            aria-hidden="true"
          />
          {activeSample && (
            <g aria-hidden="true" pointerEvents="none">
              <line
                x1={x(activeSample.time)}
                x2={x(activeSample.time)}
                y1={top}
                y2={bottom}
                stroke={colors.muted}
                strokeDasharray="3 3"
              />
              <circle
                cx={x(activeSample.time)}
                cy={y(activeSample.bpm)}
                r={4}
                fill={colors.surface}
                stroke={colors.line}
                strokeWidth={2}
              />
            </g>
          )}
        </svg>
      )}
      {activeSample && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 0,
            left: Math.min(Math.max(x(activeSample.time), left + 50), right - 50),
            transform: 'translateX(-50%)',
            padding: '4px 8px',
            borderRadius: 6,
            background: colors.surface,
            color: colors.text,
            boxShadow: '0 1px 4px rgba(0, 0, 0, 0.2)',
            fontSize: 12,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}
        >
          <strong>{Math.round(activeSample.bpm)} bpm</strong> · {formatTime(activeSample.time)}
          {activeZone && ` · ${activeZone.name}`}
        </div>
      )}
      <div aria-live="polite" style={visuallyHidden}>
        {announce &&
          activeSample &&
          `${formatTime(activeSample.time)}, ${Math.round(activeSample.bpm)} bpm` +
            (activeZone ? `, ${activeZone.name}` : '')}
      </div>
    </div>
  );
}
