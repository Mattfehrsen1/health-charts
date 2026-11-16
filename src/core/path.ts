export interface Point {
  x: number;
  y: number;
}

const round = (n: number) => Math.round(n * 100) / 100;

/**
 * SVG path through the points. A point with a non-finite coordinate ends
 * the current segment, so gaps in the data stay visible as gaps.
 */
export function linePath(points: readonly Point[]): string {
  let d = '';
  let penDown = false;
  for (const { x, y } of points) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      penDown = false;
      continue;
    }
    d += `${penDown ? 'L' : 'M'}${round(x)},${round(y)}`;
    penDown = true;
  }
  return d;
}

/** Inserts a break between consecutive samples further apart than `maxGap`. */
export function breakOnGaps<T>(
  samples: readonly T[],
  timeOf: (sample: T) => number,
  maxGap: number,
): (T | null)[] {
  const result: (T | null)[] = [];
  samples.forEach((sample, i) => {
    const previous = samples[i - 1];
    if (previous !== undefined && timeOf(sample) - timeOf(previous) > maxGap) result.push(null);
    result.push(sample);
  });
  return result;
}

/** Horizontal run per point that holds until the next point's x, then steps vertically. */
export function stepPath(points: readonly Point[], endX: number): string {
  return points
    .map(({ x, y }, i) => {
      const nextX = points[i + 1]?.x ?? endX;
      return `${i === 0 ? 'M' : 'L'}${round(x)},${round(y)}H${round(nextX)}`;
    })
    .join('');
}

/**
 * Circular arc from `startAngle` to `endAngle`, in radians clockwise from
 * 12 o'clock. Sweeps of a full turn or more cannot be drawn as one SVG arc
 * and are clamped just short of it.
 */
export function arcPath(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number,
): string {
  const sweep = Math.min(endAngle - startAngle, Math.PI * 2 - 0.01);
  if (!(sweep > 0) || radius <= 0) return '';
  const end = startAngle + sweep;
  const pointAt = (angle: number) =>
    `${round(cx + radius * Math.sin(angle))},${round(cy - radius * Math.cos(angle))}`;
  const largeArc = sweep > Math.PI ? 1 : 0;
  return `M${pointAt(startAngle)}A${round(radius)},${round(radius)} 0 ${largeArc} 1 ${pointAt(end)}`;
}
