export type SleepStage = 'awake' | 'rem' | 'light' | 'deep';

/** Hypnogram order, top to bottom. */
export const SLEEP_STAGES: readonly SleepStage[] = ['awake', 'rem', 'light', 'deep'];

export const STAGE_LABELS: Record<SleepStage, string> = {
  awake: 'Awake',
  rem: 'REM',
  light: 'Light',
  deep: 'Deep',
};

export interface SleepSegment {
  stage: SleepStage;
  /** Epoch milliseconds. */
  start: number;
  end: number;
}

export function stageTotals(segments: readonly SleepSegment[]): Record<SleepStage, number> {
  const totals: Record<SleepStage, number> = { awake: 0, rem: 0, light: 0, deep: 0 };
  for (const { stage, start, end } of segments) totals[stage] += Math.max(0, end - start);
  return totals;
}

/** `7h 05m`, or `42m` under an hour. Rounds to the nearest minute. */
export function formatDuration(ms: number): string {
  const minutes = Math.round(Math.max(0, ms) / 60_000);
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours > 0 ? `${hours}h ${String(rest).padStart(2, '0')}m` : `${rest}m`;
}
