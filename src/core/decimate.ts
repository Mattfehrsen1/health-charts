export type NumericArray = ArrayLike<number>;

/** Summary of the samples that fall into one pixel column. */
export interface Bucket {
  column: number;
  min: number;
  max: number;
  first: number;
  last: number;
  firstTime: number;
  lastTime: number;
}

/** Index of the first element of a sorted array that is >= `target`. */
export function lowerBound(sorted: NumericArray, target: number): number {
  let lo = 0;
  let hi = sorted.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if ((sorted[mid] as number) < target) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/**
 * Min/max (M4) decimation: reduces samples in [start, end] to at most one
 * bucket per pixel column, keeping each column's first, last, minimum and
 * maximum value. Drawing those four values per column is visually identical
 * to drawing every sample, at a cost bounded by the canvas width.
 *
 * `times` must be sorted ascending. Non-finite values are skipped, and
 * columns with no samples produce no bucket, so callers can detect gaps.
 */
export function decimateMinMax(
  times: NumericArray,
  values: NumericArray,
  start: number,
  end: number,
  columns: number,
): Bucket[] {
  const buckets: Bucket[] = [];
  if (columns <= 0 || !(end > start)) return buckets;

  const columnsPerMs = columns / (end - start);
  let current: Bucket | undefined;

  for (let i = lowerBound(times, start); i < times.length; i++) {
    const time = times[i] as number;
    if (time > end) break;
    const value = values[i] as number;
    if (!Number.isFinite(value)) continue;

    const column = Math.min(columns - 1, Math.floor((time - start) * columnsPerMs));
    if (current?.column === column) {
      if (value < current.min) current.min = value;
      if (value > current.max) current.max = value;
      current.last = value;
      current.lastTime = time;
    } else {
      current = {
        column,
        min: value,
        max: value,
        first: value,
        last: value,
        firstTime: time,
        lastTime: time,
      };
      buckets.push(current);
    }
  }
  return buckets;
}
