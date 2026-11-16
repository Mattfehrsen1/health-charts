import { describe, expect, it } from 'vitest';
import { decimateMinMax, lowerBound, nearestIndex } from './decimate';

describe('lowerBound', () => {
  it('finds the first index not less than the target', () => {
    const sorted = [1, 3, 3, 5];
    expect(lowerBound(sorted, 0)).toBe(0);
    expect(lowerBound(sorted, 3)).toBe(1);
    expect(lowerBound(sorted, 4)).toBe(3);
    expect(lowerBound(sorted, 9)).toBe(4);
    expect(lowerBound([], 1)).toBe(0);
  });
});

describe('nearestIndex', () => {
  it('picks the closest element, preferring the earlier one on ties', () => {
    const sorted = [0, 10, 20];
    expect(nearestIndex(sorted, -5)).toBe(0);
    expect(nearestIndex(sorted, 4)).toBe(0);
    expect(nearestIndex(sorted, 5)).toBe(0);
    expect(nearestIndex(sorted, 6)).toBe(1);
    expect(nearestIndex(sorted, 99)).toBe(2);
    expect(nearestIndex([42], 0)).toBe(0);
  });
});

describe('decimateMinMax', () => {
  it('returns nothing for empty input or an empty window', () => {
    expect(decimateMinMax([], [], 0, 10, 100)).toEqual([]);
    expect(decimateMinMax([1, 2], [5, 6], 0, 10, 0)).toEqual([]);
    expect(decimateMinMax([1, 2], [5, 6], 10, 10, 100)).toEqual([]);
    expect(decimateMinMax([1, 2], [5, 6], 10, 0, 100)).toEqual([]);
  });

  it('keeps a single point as a single bucket', () => {
    expect(decimateMinMax([5], [72], 0, 10, 10)).toEqual([
      { column: 5, min: 72, max: 72, first: 72, last: 72, firstTime: 5, lastTime: 5 },
    ]);
  });

  it('summarises each column by first, last, min and max', () => {
    const times = [0, 1, 2, 3, 4, 5, 6, 7];
    const values = [60, 90, 50, 70, 80, 80, 40, 100];
    const buckets = decimateMinMax(times, values, 0, 8, 2);
    expect(buckets).toEqual([
      { column: 0, min: 50, max: 90, first: 60, last: 70, firstTime: 0, lastTime: 3 },
      { column: 1, min: 40, max: 100, first: 80, last: 100, firstTime: 4, lastTime: 7 },
    ]);
  });

  it('only scans samples inside the window', () => {
    const times = [0, 10, 20, 30, 40];
    const values = [1, 2, 3, 4, 5];
    const buckets = decimateMinMax(times, values, 15, 35, 4);
    expect(buckets.map((b) => b.first)).toEqual([3, 4]);
  });

  it('places a sample exactly at the window end in the last column', () => {
    const buckets = decimateMinMax([0, 10], [1, 2], 0, 10, 5);
    expect(buckets.map((b) => b.column)).toEqual([0, 4]);
  });

  it('leaves empty columns where the data has a gap', () => {
    const times = [0, 1, 2, 7, 8, 9];
    const values = [60, 61, 62, 70, 71, 72];
    const columns = decimateMinMax(times, values, 0, 10, 10).map((b) => b.column);
    expect(columns).toEqual([0, 1, 2, 7, 8, 9]);
  });

  it('skips NaN and infinite values', () => {
    const buckets = decimateMinMax([0, 1, 2, 3], [NaN, 80, Infinity, 60], 0, 4, 1);
    expect(buckets).toEqual([
      { column: 0, min: 60, max: 80, first: 80, last: 60, firstTime: 1, lastTime: 3 },
    ]);
    expect(decimateMinMax([0, 1], [NaN, NaN], 0, 2, 2)).toEqual([]);
  });

  it('bounds the output by the column count for large inputs', () => {
    const n = 86_400;
    const times = Float64Array.from({ length: n }, (_, i) => i * 1000);
    const values = Float32Array.from({ length: n }, (_, i) => 60 + (i % 50));
    const buckets = decimateMinMax(times, values, 0, n * 1000, 800);
    expect(buckets).toHaveLength(800);
    expect(Math.min(...buckets.map((b) => b.min))).toBe(60);
    expect(Math.max(...buckets.map((b) => b.max))).toBe(109);
  });
});
