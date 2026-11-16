import { describe, expect, it } from 'vitest';
import { formatDuration, stageTotals } from './sleep';

const MIN = 60_000;

describe('stageTotals', () => {
  it('sums time per stage and ignores inverted segments', () => {
    const totals = stageTotals([
      { stage: 'light', start: 0, end: 30 * MIN },
      { stage: 'deep', start: 30 * MIN, end: 75 * MIN },
      { stage: 'light', start: 75 * MIN, end: 90 * MIN },
      { stage: 'awake', start: 90 * MIN, end: 80 * MIN },
    ]);
    expect(totals).toEqual({ awake: 0, rem: 0, light: 45 * MIN, deep: 45 * MIN });
  });
});

describe('formatDuration', () => {
  it('formats minutes and hours', () => {
    expect(formatDuration(0)).toBe('0m');
    expect(formatDuration(42 * MIN)).toBe('42m');
    expect(formatDuration(7 * 60 * MIN + 5 * MIN)).toBe('7h 05m');
    expect(formatDuration(59.6 * MIN)).toBe('1h 00m');
    expect(formatDuration(-MIN)).toBe('0m');
  });
});
