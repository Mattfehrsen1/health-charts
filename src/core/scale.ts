export interface LinearScale {
  (value: number): number;
  readonly domain: readonly [number, number];
  readonly range: readonly [number, number];
  invert(position: number): number;
}

/**
 * Maps a numeric domain onto a pixel range. Time scales use the same mapping
 * over epoch milliseconds; only their ticks differ (see `timeTicks`).
 * A zero-width domain maps every value to the middle of the range.
 */
export function scaleLinear(
  domain: readonly [number, number],
  range: readonly [number, number],
): LinearScale {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const span = d1 - d0;

  const scale = (value: number) =>
    span === 0 ? (r0 + r1) / 2 : r0 + ((value - d0) / span) * (r1 - r0);
  const invert = (position: number) => (r1 === r0 ? d0 : d0 + ((position - r0) / (r1 - r0)) * span);

  return Object.assign(scale, { domain, range, invert });
}

/** Smallest and largest finite value, or undefined when there are none. */
export function extent(values: Iterable<number>): [number, number] | undefined {
  let min = Infinity;
  let max = -Infinity;
  for (const value of values) {
    if (!Number.isFinite(value)) continue;
    if (value < min) min = value;
    if (value > max) max = value;
  }
  return min <= max ? [min, max] : undefined;
}
