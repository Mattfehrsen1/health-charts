import type { CSSProperties } from 'react';
import type { SleepStage } from './core/sleep';

/**
 * Every color is a CSS custom property with a fallback, so charts work
 * unstyled and can be themed (including dark mode) from plain CSS.
 */
export const colors = {
  line: 'var(--hc-line, #e5484d)',
  text: 'var(--hc-text, #1f2328)',
  muted: 'var(--hc-muted, #6e7781)',
  grid: 'var(--hc-grid, rgba(110, 119, 129, 0.2))',
  surface: 'var(--hc-surface, #ffffff)',
  track: 'var(--hc-track, rgba(110, 119, 129, 0.18))',
  strain: 'var(--hc-strain, #0b84f3)',
  zones: [
    'var(--hc-zone-1, rgba(110, 119, 129, 0.10))',
    'var(--hc-zone-2, rgba(11, 132, 243, 0.10))',
    'var(--hc-zone-3, rgba(48, 164, 108, 0.12))',
    'var(--hc-zone-4, rgba(245, 159, 0, 0.14))',
    'var(--hc-zone-5, rgba(229, 72, 77, 0.14))',
  ],
  stages: {
    awake: 'var(--hc-awake, #f59f00)',
    rem: 'var(--hc-rem, #4dabf7)',
    light: 'var(--hc-light, #748ffc)',
    deep: 'var(--hc-deep, #5f3dc4)',
  } satisfies Record<SleepStage, string>,
} as const;

export const visuallyHidden: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  margin: -1,
  padding: 0,
  overflow: 'hidden',
  clipPath: 'inset(50%)',
  whiteSpace: 'nowrap',
  border: 0,
};

export const axisFont = { fontSize: 11, fontFamily: 'inherit' } as const;
