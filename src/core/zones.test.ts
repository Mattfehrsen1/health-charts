import { describe, expect, it } from 'vitest';
import { heartRateZones, zoneFor } from './zones';

describe('heartRateZones', () => {
  it('splits 50–100% of max heart rate into five contiguous zones', () => {
    const zones = heartRateZones(200);
    expect(zones.map((z) => [z.min, z.max])).toEqual([
      [100, 120],
      [120, 140],
      [140, 160],
      [160, 180],
      [180, 200],
    ]);
  });
});

describe('zoneFor', () => {
  const zones = heartRateZones(200);

  it('finds the zone containing a reading', () => {
    expect(zoneFor(100, zones)?.name).toBe('Zone 1');
    expect(zoneFor(159, zones)?.name).toBe('Zone 3');
    expect(zoneFor(160, zones)?.name).toBe('Zone 4');
  });

  it('treats readings above the maximum as the top zone and below zone 1 as none', () => {
    expect(zoneFor(215, zones)?.name).toBe('Zone 5');
    expect(zoneFor(70, zones)).toBeUndefined();
  });
});
