import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HeartRateChart, type HeartRateSample } from './HeartRateChart';

const start = Date.parse('2026-03-14T07:00:00Z');
const data: HeartRateSample[] = [92, 118, 135, 151, 164, 172, 140].map((bpm, i) => ({
  time: start + i * 60_000,
  bpm,
}));

function renderChart(samples = data, maxHeartRate = 190) {
  render(<HeartRateChart data={samples} maxHeartRate={maxHeartRate} />);
  return screen.getByRole('group', { name: 'Heart rate' });
}

const liveRegion = (chart: Element) =>
  chart.parentElement?.querySelector('[aria-live="polite"]')?.textContent;

describe('HeartRateChart', () => {
  it('renders a focusable chart described by a summary', () => {
    const chart = renderChart();
    expect(chart.getAttribute('tabindex')).toBe('0');
    expect(chart.getAttribute('aria-roledescription')).toBe('chart');
    const summary = document.getElementById(chart.getAttribute('aria-describedby') ?? '');
    expect(summary?.textContent).toBe(
      'Heart rate from 07:00 to 07:06, 92 to 172 bpm. Use the arrow keys to move between readings.',
    );
  });

  it('draws the line, axes and the zones within the bpm range', () => {
    const chart = renderChart();
    expect(chart.querySelector('path')?.getAttribute('d')).toMatch(
      /^M40,[\d.]+(L[\d.]+,[\d.]+){6}$/,
    );
    const labels = Array.from(chart.querySelectorAll('text'), (t) => t.textContent);
    expect(labels).toEqual(expect.arrayContaining(['07:00', '100', 'Zone 1', 'Zone 5']));
  });

  it('omits zones outside the bpm range', () => {
    // Zones start at 150, 180, 210...; the axis tops out at 180.
    const chart = renderChart(data, 300);
    const labels = Array.from(chart.querySelectorAll('text'), (t) => t.textContent);
    expect(labels).toContain('Zone 1');
    expect(labels).not.toContain('Zone 2');
  });

  it('moves between readings with the keyboard and announces them', () => {
    const chart = renderChart();
    expect(liveRegion(chart)).toBe('');

    fireEvent.keyDown(chart, { key: 'ArrowRight' });
    expect(liveRegion(chart)).toBe('07:00, 92 bpm');

    fireEvent.keyDown(chart, { key: 'ArrowRight' });
    expect(liveRegion(chart)).toBe('07:01, 118 bpm, Zone 2');

    fireEvent.keyDown(chart, { key: 'End' });
    expect(liveRegion(chart)).toBe('07:06, 140 bpm, Zone 3');

    fireEvent.keyDown(chart, { key: 'ArrowRight' });
    expect(liveRegion(chart)).toBe('07:06, 140 bpm, Zone 3');

    fireEvent.keyDown(chart, { key: 'Escape' });
    expect(liveRegion(chart)).toBe('');
  });

  it('shows a crosshair and tooltip for the reading nearest the pointer', () => {
    const chart = renderChart();
    // The plot spans x = 40..624 in a 640px container; 7 samples, one every ~97px.
    fireEvent.pointerMove(chart, { clientX: 40 + 97 * 5 });
    expect(chart.querySelector('circle')).not.toBeNull();
    expect(screen.getByText('172 bpm')).toBeDefined();

    expect(liveRegion(chart)).toBe('');

    fireEvent.pointerLeave(chart);
    expect(chart.querySelector('circle')).toBeNull();
  });

  it('clears the selection when the data changes', () => {
    const { rerender } = render(<HeartRateChart data={data} label="Live" />);
    const chart = screen.getByRole('group', { name: 'Live' });
    fireEvent.keyDown(chart, { key: 'End' });
    expect(chart.querySelector('circle')).not.toBeNull();

    rerender(<HeartRateChart data={data.slice(0, 3)} label="Live" />);
    expect(chart.querySelector('circle')).toBeNull();
  });

  it('breaks the line across gaps longer than maxGapMs', () => {
    const gapped = [...data.slice(0, 3), { time: start + 6 * 60_000, bpm: 100 }];
    const chart = renderChart(gapped);
    expect(chart.querySelector('path')?.getAttribute('d')?.match(/M/g)).toHaveLength(1);

    render(<HeartRateChart data={gapped} maxGapMs={60_000} label="Gapped" />);
    const d = screen
      .getByRole('group', { name: 'Gapped' })
      .querySelector('path')
      ?.getAttribute('d');
    expect(d?.match(/M/g)).toHaveLength(2);
  });

  it('handles empty data', () => {
    const chart = renderChart([]);
    expect(document.getElementById(chart.getAttribute('aria-describedby') ?? '')?.textContent).toBe(
      'No heart rate data.',
    );
    fireEvent.keyDown(chart, { key: 'ArrowRight' });
    expect(liveRegion(chart)).toBe('');
  });
});
