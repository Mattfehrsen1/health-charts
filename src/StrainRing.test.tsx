import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StrainRing } from './StrainRing';
import { motion } from './test/setup';

const valueLabel = () => screen.getByRole('meter').querySelector('text')?.textContent;

describe('StrainRing', () => {
  it('exposes the value as a meter', () => {
    render(<StrainRing value={14.24} />);
    const meter = screen.getByRole('meter', { name: 'Strain' });
    expect(meter.getAttribute('aria-valuenow')).toBe('14.24');
    expect(meter.getAttribute('aria-valuemin')).toBe('0');
    expect(meter.getAttribute('aria-valuemax')).toBe('21');
    expect(meter.getAttribute('aria-valuetext')).toBe('14.2 of 21');
  });

  it('clamps values to the 0–21 scale', () => {
    const { rerender } = render(<StrainRing value={30} duration={0} />);
    expect(screen.getByRole('meter').getAttribute('aria-valuenow')).toBe('21');
    rerender(<StrainRing value={-4} duration={0} />);
    expect(screen.getByRole('meter').getAttribute('aria-valuenow')).toBe('0');
    rerender(<StrainRing value={NaN} duration={0} />);
    expect(valueLabel()).toBe('0.0');
  });

  it('shows the final value immediately when reduced motion is preferred', () => {
    motion.reduced = true;
    render(<StrainRing value={12.5} />);
    expect(valueLabel()).toBe('12.5');
  });

  describe('animation', () => {
    beforeEach(() => {
      vi.useFakeTimers({
        toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'],
      });
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it('eases from zero to the value', () => {
      render(<StrainRing value={18} duration={1000} />);
      expect(valueLabel()).toBe('0.0');

      act(() => {
        vi.advanceTimersByTime(500);
      });
      const midway = Number(valueLabel());
      expect(midway).toBeGreaterThan(9);
      expect(midway).toBeLessThan(18);

      act(() => {
        vi.advanceTimersByTime(600);
      });
      expect(valueLabel()).toBe('18.0');
    });
  });
});
