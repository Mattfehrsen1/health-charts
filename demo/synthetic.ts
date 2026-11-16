/**
 * Seeded generators for the demo. Everything here is synthetic: shapes are
 * plausible, not physiological models, and no real person's data is used.
 */
import type { HeartRateSample, SleepSegment, SleepStage } from '../src';

/** Small, fast 32-bit PRNG. The same seed always yields the same sequence. */
export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Standard normal sample via Box–Muller. */
function gaussian(random: () => number): number {
  return Math.sqrt(-2 * Math.log(1 - random())) * Math.cos(2 * Math.PI * random());
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

/** Local midnight of the demo day, so axes read as a normal calendar day. */
export const DAY_START = new Date(2026, 2, 14).getTime();
export const WORKOUT_START = DAY_START + 7 * HOUR;
const WORKOUT_MINUTES = 50;

/** Target heart rate during a warm-up, five intervals and a cool-down. */
function workoutTarget(minute: number): number {
  if (minute < 8) return 95 + (minute / 8) * 40;
  if (minute < 38) return (minute - 8) % 6 < 4 ? 166 : 132;
  return 132 - ((minute - 38) / 12) * 30;
}

/** A 50-minute interval session sampled every 5 s, with a short sensor dropout. */
export function workoutSession(seed: number): HeartRateSample[] {
  const random = mulberry32(seed);
  const samples: HeartRateSample[] = [];
  let bpm = 92;
  for (let t = 0; t < WORKOUT_MINUTES * MINUTE; t += 5_000) {
    const minute = t / MINUTE;
    bpm += (workoutTarget(minute) - bpm) * 0.12 + gaussian(random) * 1.4;
    if (minute >= 27 && minute < 29.5) continue;
    samples.push({ time: WORKOUT_START + t, bpm: Math.round(bpm) });
  }
  return samples;
}

/** Target heart rate across the day: sleep, a morning workout, walks and rest. */
function dayTarget(time: number): number {
  const hour = (time - DAY_START) / HOUR;
  if (hour >= 7 && hour < 7 + WORKOUT_MINUTES / 60) return workoutTarget((hour - 7) * 60);
  if (hour < 6.5) return 52 + 4 * Math.sin(hour * 1.3);
  if (hour >= 12.5 && hour < 13) return 104;
  if (hour >= 17.75 && hour < 18.25) return 98;
  if (hour >= 22.5) return 58;
  return 70 + 6 * Math.sin(hour * 0.9);
}

export interface DenseSeries {
  times: Float64Array;
  values: Float32Array;
}

/** A full day at 1 Hz (86,400 readings), with a 25-minute gap while the sensor charges. */
export function fullDay(seed: number): DenseSeries {
  const random = mulberry32(seed);
  const count = 24 * 60 * 60;
  const times = new Float64Array(count);
  const values = new Float32Array(count);
  const gapStart = DAY_START + 14 * HOUR + 10 * MINUTE;
  const gapEnd = gapStart + 25 * MINUTE;
  let bpm = 55;
  for (let i = 0; i < count; i++) {
    const time = DAY_START + i * 1000;
    bpm += (dayTarget(time) - bpm) * 0.02 + gaussian(random) * 0.7;
    if (random() < 0.0004) bpm += 15 + random() * 20;
    times[i] = time;
    values[i] = time >= gapStart && time < gapEnd ? NaN : bpm;
  }
  return { times, values };
}

/**
 * About 7.5 hours of sleep in ~90-minute cycles. Deep sleep dominates early
 * cycles and REM grows towards morning, with brief awakenings in between.
 */
export function sleepNight(seed: number): SleepSegment[] {
  const random = mulberry32(seed);
  const segments: SleepSegment[] = [];
  let time = DAY_START - 70 * MINUTE + Math.round(random() * 20) * MINUTE;
  const add = (stage: SleepStage, minutes: number) => {
    const end = time + Math.max(1, Math.round(minutes)) * MINUTE;
    segments.push({ stage, start: time, end });
    time = end;
  };

  add('awake', 6 + random() * 10);
  for (let cycle = 0; cycle < 5; cycle++) {
    add('light', 15 + random() * 15);
    add('deep', Math.max(4, 45 - cycle * 10 + random() * 10));
    add('light', 10 + random() * 10);
    add('rem', 8 + cycle * 7 + random() * 8);
    if (random() < 0.6) add('awake', 2 + random() * 6);
  }
  add('light', 5 + random() * 10);
  add('awake', 3 + random() * 5);
  return segments;
}

/** A day strain score between 6 and 19. */
export function strainScore(seed: number): number {
  return Math.round((6 + mulberry32(seed)() * 13) * 10) / 10;
}
