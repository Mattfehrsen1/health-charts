import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { SleepSegment } from './core/sleep';
import { SleepStagesChart } from './SleepStagesChart';

const MIN = 60_000;
const t0 = Date.parse('2026-03-14T23:00:00Z');
const at = (minutes: number) => t0 + minutes * MIN;

const night: SleepSegment[] = [
  { stage: 'awake', start: at(0), end: at(10) },
  { stage: 'light', start: at(10), end: at(40) },
  { stage: 'deep', start: at(40), end: at(100) },
  { stage: 'rem', start: at(100), end: at(120) },
];

describe('SleepStagesChart', () => {
  it('exposes a titled image with a text description of the night', () => {
    render(<SleepStagesChart segments={night} />);
    const chart = screen.getByRole('img', { name: 'Sleep stages' });
    const desc = document.getElementById(chart.getAttribute('aria-describedby') ?? '');
    expect(desc?.textContent).toBe(
      'From 23:00 to 01:00 (2h 00m): Awake 10m, REM 20m, Light 30m, Deep 1h 00m.',
    );
  });

  it('draws one bar per segment in its stage row', () => {
    render(<SleepStagesChart segments={night} />);
    const bars = Array.from(screen.getByRole('img').querySelectorAll('rect'));
    expect(bars.map((bar) => bar.dataset.stage)).toEqual(['awake', 'light', 'deep', 'rem']);

    const rowOf = (stage: string) =>
      Number(bars.find((b) => b.dataset.stage === stage)?.getAttribute('y'));
    expect(rowOf('awake')).toBeLessThan(rowOf('rem'));
    expect(rowOf('rem')).toBeLessThan(rowOf('light'));
    expect(rowOf('light')).toBeLessThan(rowOf('deep'));

    const widthOf = (stage: string) =>
      Number(bars.find((b) => b.dataset.stage === stage)?.getAttribute('width'));
    expect(widthOf('deep')).toBeCloseTo(widthOf('light') * 2);
  });

  it('lists stage totals with their share of the night', () => {
    render(<SleepStagesChart segments={night} />);
    const legend = screen.getByRole('list', { name: 'Sleep stages totals' });
    const items = within(legend)
      .getAllByRole('listitem')
      .map((li) => li.textContent);
    expect(items).toEqual([
      'Awake 10m · 8%',
      'REM 20m · 17%',
      'Light 30m · 25%',
      'Deep 1h 00m · 50%',
    ]);
  });

  it('describes an empty night', () => {
    render(<SleepStagesChart segments={[]} />);
    const chart = screen.getByRole('img');
    expect(document.getElementById(chart.getAttribute('aria-describedby') ?? '')?.textContent).toBe(
      'No sleep data.',
    );
    expect(chart.querySelectorAll('rect')).toHaveLength(0);
  });
});
