function tickStep(min: number, max: number, count: number): number {
  const rough = (max - min) / count;
  const power = 10 ** Math.floor(Math.log10(rough));
  const error = rough / power;
  // Snap to 1, 2, 5 or 10 using the geometric midpoints between them.
  const factor =
    error >= Math.SQRT2 * 5 ? 10 : error >= Math.sqrt(10) ? 5 : error >= Math.SQRT2 ? 2 : 1;
  return factor * power;
}

/** Round step values (1, 2, 5 × 10ⁿ) covering [min, max] with roughly `count` ticks. */
export function niceTicks(min: number, max: number, count = 5): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max) || count <= 0) return [];
  if (min === max) return [min];
  if (min > max) return niceTicks(max, min, count).reverse();

  const step = tickStep(min, max, count);
  // For fractional steps, work in multiples of 1/step so that 0.1 + 0.2 style
  // rounding error never leaks into tick values or drops the last tick.
  const inverse = step < 1 ? Math.round(1 / step) : 0;
  const valueAt = (i: number) => (inverse ? i / inverse : i * step);
  const indexOf = (value: number) => Math.round(inverse ? value * inverse : value / step);

  let first = indexOf(min);
  if (valueAt(first) < min) first++;
  let last = indexOf(max);
  if (valueAt(last) > max) last--;

  const ticks: number[] = [];
  for (let i = first; i <= last; i++) ticks.push(valueAt(i));
  return ticks;
}

/** Expands [min, max] outward to the nearest tick boundaries. */
export function niceDomain(min: number, max: number, count = 5): [number, number] {
  if (!Number.isFinite(min) || !Number.isFinite(max) || min >= max) return [min, max];
  const step = tickStep(min, max, count);
  return [Math.floor(min / step) * step, Math.ceil(max / step) * step];
}

const SECOND = 1_000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const TIME_STEPS = [
  SECOND,
  5 * SECOND,
  15 * SECOND,
  30 * SECOND,
  MINUTE,
  5 * MINUTE,
  15 * MINUTE,
  30 * MINUTE,
  HOUR,
  2 * HOUR,
  3 * HOUR,
  6 * HOUR,
  12 * HOUR,
  24 * HOUR,
];

export interface TimeTicks {
  ticks: number[];
  step: number;
}

/**
 * Ticks for an epoch-millisecond domain, aligned to local wall-clock
 * boundaries (on the hour, on the quarter hour, ...). Steps are counted
 * from local midnight, so a DST change inside the domain shifts later
 * ticks by the offset difference.
 */
export function timeTicks(start: number, end: number, count = 6): TimeTicks {
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start || count <= 0) {
    return { ticks: [], step: 0 };
  }
  const target = (end - start) / count;
  const step = TIME_STEPS.find((s) => s >= target) ?? 24 * HOUR;

  const midnight = new Date(start);
  midnight.setHours(0, 0, 0, 0);
  const origin = midnight.getTime();

  const ticks: number[] = [];
  for (let t = origin + Math.ceil((start - origin) / step) * step; t <= end; t += step) {
    ticks.push(t);
  }
  return { ticks, step };
}

const pad = (n: number) => String(n).padStart(2, '0');

/** `HH:MM`, or `HH:MM:SS` when ticks are less than a minute apart. */
export function formatTime(time: number, step = MINUTE): string {
  const date = new Date(time);
  const hm = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  return step < MINUTE ? `${hm}:${pad(date.getSeconds())}` : hm;
}
