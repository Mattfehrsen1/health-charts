import { describe, expect, it } from 'vitest';
import { arcPath, breakOnGaps, linePath, stepPath } from './path';

describe('linePath', () => {
  it('builds a polyline', () => {
    expect(
      linePath([
        { x: 0, y: 10 },
        { x: 5, y: 20 },
        { x: 10, y: 15 },
      ]),
    ).toBe('M0,10L5,20L10,15');
  });

  it('returns an empty path for no points and a lone move for one', () => {
    expect(linePath([])).toBe('');
    expect(linePath([{ x: 1, y: 2 }])).toBe('M1,2');
  });

  it('starts a new segment after a non-finite point', () => {
    expect(
      linePath([
        { x: 0, y: 0 },
        { x: 1, y: NaN },
        { x: 2, y: 2 },
        { x: 3, y: 3 },
      ]),
    ).toBe('M0,0M2,2L3,3');
  });

  it('rounds coordinates to two decimals', () => {
    expect(linePath([{ x: 1 / 3, y: 2 / 3 }])).toBe('M0.33,0.67');
  });
});

describe('breakOnGaps', () => {
  it('inserts null between samples further apart than the limit', () => {
    const times = [0, 5, 10, 60, 65];
    expect(breakOnGaps(times, (t) => t, 30)).toEqual([0, 5, 10, null, 60, 65]);
    expect(breakOnGaps([], (t: number) => t, 30)).toEqual([]);
  });
});

describe('stepPath', () => {
  it('holds each value until the next point', () => {
    expect(
      stepPath(
        [
          { x: 0, y: 10 },
          { x: 4, y: 30 },
        ],
        9,
      ),
    ).toBe('M0,10H4L4,30H9');
    expect(stepPath([], 9)).toBe('');
  });
});

describe('arcPath', () => {
  it('draws a quarter arc clockwise from 12 o’clock', () => {
    expect(arcPath(50, 50, 40, 0, Math.PI / 2)).toBe('M50,10A40,40 0 0 1 90,50');
  });

  it('sets the large-arc flag past half a turn', () => {
    expect(arcPath(50, 50, 40, -Math.PI * 0.75, Math.PI * 0.75)).toContain(' 0 1 1 ');
  });

  it('returns nothing for an empty sweep or radius', () => {
    expect(arcPath(50, 50, 40, 1, 1)).toBe('');
    expect(arcPath(50, 50, 40, 2, 1)).toBe('');
    expect(arcPath(50, 50, 0, 0, 1)).toBe('');
    expect(arcPath(50, 50, 40, 0, NaN)).toBe('');
  });

  it('clamps a full turn so the arc still renders', () => {
    const d = arcPath(50, 50, 40, 0, Math.PI * 2);
    expect(d).toMatch(/^M50,10A40,40 0 1 1 /);
    expect(d.endsWith(' 50,10')).toBe(false);
  });
});
