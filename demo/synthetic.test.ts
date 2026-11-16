import { describe, expect, it } from 'vitest';
import { fullDay, mulberry32, sleepNight, strainScore, workoutSession } from './synthetic';

describe('synthetic data', () => {
  it('is deterministic for a seed', () => {
    expect(workoutSession(7)).toEqual(workoutSession(7));
    expect(sleepNight(7)).toEqual(sleepNight(7));
    expect(strainScore(7)).toBe(strainScore(7));
    expect(workoutSession(7)).not.toEqual(workoutSession(8));
  });

  it('produces uniform values in [0, 1)', () => {
    const random = mulberry32(1);
    const draws = Array.from({ length: 10_000 }, random);
    expect(Math.min(...draws)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...draws)).toBeLessThan(1);
    const mean = draws.reduce((a, b) => a + b, 0) / draws.length;
    expect(mean).toBeCloseTo(0.5, 1);
  });

  it('generates a full day at 1 Hz with a sensor gap', () => {
    const { times, values } = fullDay(3);
    expect(times).toHaveLength(86_400);
    expect(times[1]).toBe((times[0] ?? 0) + 1000);
    const missing = values.filter(Number.isNaN).length;
    expect(missing).toBe(25 * 60);
  });

  it('generates a contiguous night of sleep', () => {
    const night = sleepNight(3);
    night.slice(1).forEach((segment, i) => {
      expect(segment.start).toBe(night[i]?.end);
    });
    const [first, last] = [night[0], night.at(-1)];
    if (!first || !last) throw new Error('empty night');
    const hours = (last.end - first.start) / 3_600_000;
    expect(hours).toBeGreaterThan(6);
    expect(hours).toBeLessThan(10);
  });
});
