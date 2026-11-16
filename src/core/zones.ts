export interface HeartRateZone {
  name: string;
  min: number;
  max: number;
}

const ZONE_BOUNDS = [0.5, 0.6, 0.7, 0.8, 0.9, 1] as const;

/** Five zones at 50–60–70–80–90–100% of maximum heart rate, in bpm. */
export function heartRateZones(maxHeartRate: number): HeartRateZone[] {
  return ZONE_BOUNDS.slice(0, -1).map((lower, i) => ({
    name: `Zone ${i + 1}`,
    min: Math.round(lower * maxHeartRate),
    max: Math.round((ZONE_BOUNDS[i + 1] as number) * maxHeartRate),
  }));
}

/** The highest zone whose lower bound `bpm` reaches; readings above the maximum count as the top zone. */
export function zoneFor(bpm: number, zones: readonly HeartRateZone[]): HeartRateZone | undefined {
  return zones.findLast((zone) => bpm >= zone.min);
}
