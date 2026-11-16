import { describe, expect, it } from 'vitest';
import { formatTime, niceDomain, niceTicks, timeTicks } from './ticks';

describe('niceTicks', () => {
  it('produces round steps inside the domain', () => {
    expect(niceTicks(0, 100, 5)).toEqual([0, 20, 40, 60, 80, 100]);
    expect(niceTicks(43, 187, 5)).toEqual([60, 80, 100, 120, 140, 160, 180]);
    expect(niceTicks(0, 1, 5)).toEqual([0, 0.2, 0.4, 0.6, 0.8, 1]);
  });

  it('avoids floating point noise for fractional steps', () => {
    expect(niceTicks(0.1, 0.35, 5)).toEqual([0.1, 0.15, 0.2, 0.25, 0.3, 0.35]);
  });

  it('returns descending ticks for a reversed domain', () => {
    expect(niceTicks(10, 0, 2)).toEqual([10, 5, 0]);
  });

  it('handles degenerate input', () => {
    expect(niceTicks(7, 7)).toEqual([7]);
    expect(niceTicks(NaN, 10)).toEqual([]);
    expect(niceTicks(0, Infinity)).toEqual([]);
    expect(niceTicks(0, 10, 0)).toEqual([]);
  });
});

describe('niceDomain', () => {
  it('extends the domain to tick boundaries', () => {
    expect(niceDomain(43, 187, 5)).toEqual([40, 200]);
    expect(niceDomain(0.12, 0.88, 4)).toEqual([0, 1]);
    expect(niceDomain(0.12, 0.31, 4)).toEqual([0.1, 0.35]);
  });

  it('leaves degenerate domains unchanged', () => {
    expect(niceDomain(5, 5)).toEqual([5, 5]);
    expect(niceDomain(NaN, 1)).toEqual([NaN, 1]);
  });
});

describe('timeTicks', () => {
  const at = (iso: string) => Date.parse(iso);

  it('aligns hourly ticks to the hour', () => {
    const { ticks, step } = timeTicks(at('2026-03-14T08:20:00Z'), at('2026-03-14T14:10:00Z'), 6);
    expect(step).toBe(3_600_000);
    expect(ticks.map((t) => formatTime(t, step))).toEqual([
      '09:00',
      '10:00',
      '11:00',
      '12:00',
      '13:00',
      '14:00',
    ]);
  });

  it('uses second resolution for short spans', () => {
    const start = at('2026-03-14T08:00:03Z');
    const { ticks, step } = timeTicks(start, start + 50_000, 5);
    expect(step).toBe(15_000);
    expect(ticks.map((t) => formatTime(t, step))).toEqual(['08:00:15', '08:00:30', '08:00:45']);
  });

  it('caps the step at one day', () => {
    const { step } = timeTicks(0, 30 * 86_400_000, 3);
    expect(step).toBe(86_400_000);
  });

  it('returns no ticks for an empty or invalid span', () => {
    expect(timeTicks(10, 10)).toEqual({ ticks: [], step: 0 });
    expect(timeTicks(NaN, 10)).toEqual({ ticks: [], step: 0 });
  });
});
