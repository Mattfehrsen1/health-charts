import { describe, expect, it } from 'vitest';
import { clampDomain, panDomain, zoomDomain } from './viewport';

const bounds = [0, 1000] as const;

describe('clampDomain', () => {
  it('keeps a domain inside the bounds without changing its span', () => {
    expect(clampDomain([100, 300], bounds)).toEqual([100, 300]);
    expect(clampDomain([-50, 150], bounds)).toEqual([0, 200]);
    expect(clampDomain([900, 1100], bounds)).toEqual([800, 1000]);
  });

  it('shrinks a domain wider than the bounds', () => {
    expect(clampDomain([-100, 2000], bounds)).toEqual([0, 1000]);
  });
});

describe('zoomDomain', () => {
  it('zooms around the anchor', () => {
    expect(zoomDomain([0, 1000], bounds, 250, 0.5, 10)).toEqual([125, 625]);
    expect(zoomDomain([0, 1000], bounds, 500, 0.5, 10)).toEqual([250, 750]);
  });

  it('respects the minimum span', () => {
    expect(zoomDomain([400, 600], bounds, 500, 0.01, 50)).toEqual([475, 525]);
  });

  it('cannot zoom out beyond the bounds', () => {
    expect(zoomDomain([200, 800], bounds, 300, 4, 10)).toEqual([0, 1000]);
  });

  it('zooms a zero-width domain around its centre', () => {
    expect(zoomDomain([500, 500], bounds, 500, 2, 100)).toEqual([450, 550]);
  });
});

describe('panDomain', () => {
  it('moves the window and stops at the edges', () => {
    expect(panDomain([100, 200], bounds, 50)).toEqual([150, 250]);
    expect(panDomain([100, 200], bounds, -500)).toEqual([0, 100]);
    expect(panDomain([800, 900], bounds, 500)).toEqual([900, 1000]);
  });
});
