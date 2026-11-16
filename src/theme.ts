import type { CSSProperties } from 'react';
import type { SleepStage } from './core/sleep';

/**
 * Every color is a CSS custom property with a fallback, so charts work
 * unstyled and can be themed (including dark mode) from plain CSS.
 */
const fallbacks = {
  line: '#e5484d',
  muted: '#6e7781',
  grid: 'rgba(110, 119, 129, 0.2)',
};

export const colors = {
  line: `var(--hc-line, ${fallbacks.line})`,
  text: 'var(--hc-text, #1f2328)',
  muted: `var(--hc-muted, ${fallbacks.muted})`,
  grid: `var(--hc-grid, ${fallbacks.grid})`,
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

/** Canvas cannot use `var()`, so it resolves the same tokens from computed style. */
export function resolveColor(element: Element, name: keyof typeof fallbacks): string {
  return getComputedStyle(element).getPropertyValue(`--hc-${name}`).trim() || fallbacks[name];
}

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
