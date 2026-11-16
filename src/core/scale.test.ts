import { describe, expect, it } from 'vitest';
import { scaleLinear } from './scale';

describe('scaleLinear', () => {
  it('maps domain to range and back', () => {
    const x = scaleLinear([0, 100], [0, 500]);
    expect(x(0)).toBe(0);
    expect(x(50)).toBe(250);
    expect(x(100)).toBe(500);
    expect(x.invert(250)).toBe(50);
  });

  it('supports inverted ranges for y axes', () => {
    const y = scaleLinear([40, 200], [300, 0]);
    expect(y(40)).toBe(300);
    expect(y(200)).toBe(0);
    expect(y.invert(150)).toBe(120);
  });

  it('extrapolates outside the domain', () => {
    const x = scaleLinear([0, 10], [0, 100]);
    expect(x(-1)).toBe(-10);
    expect(x(11)).toBeCloseTo(110);
  });

  it('maps a zero-width domain to the middle of the range', () => {
    const x = scaleLinear([5, 5], [0, 100]);
    expect(x(5)).toBe(50);
    expect(x(999)).toBe(50);
    expect(x.invert(10)).toBe(5);
  });

  it('inverts a zero-width range to the domain start', () => {
    expect(scaleLinear([0, 10], [20, 20]).invert(20)).toBe(0);
  });
});
