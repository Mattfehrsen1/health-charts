export type Domain = readonly [number, number];

/** Shifts `domain` to lie within `bounds`, shrinking it only if it is wider than them. */
export function clampDomain([start, end]: Domain, [min, max]: Domain): [number, number] {
  const span = Math.min(end - start, max - min);
  const clampedStart = Math.min(Math.max(start, min), max - span);
  return [clampedStart, clampedStart + span];
}

/**
 * Scales the span of `domain` by `factor` (< 1 zooms in) while keeping
 * `anchor` at the same relative position, e.g. under the cursor.
 */
export function zoomDomain(
  domain: Domain,
  bounds: Domain,
  anchor: number,
  factor: number,
  minSpan: number,
): [number, number] {
  const [start, end] = domain;
  const span = end - start;
  const nextSpan = Math.max(minSpan, span * factor);
  const ratio = span > 0 ? (anchor - start) / span : 0.5;
  const nextStart = anchor - ratio * nextSpan;
  return clampDomain([nextStart, nextStart + nextSpan], bounds);
}

export function panDomain([start, end]: Domain, bounds: Domain, delta: number): [number, number] {
  return clampDomain([start + delta, end + delta], bounds);
}
