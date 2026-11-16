import { describe, expect, it } from 'vitest';
import { navigate } from './navigation';

describe('navigate', () => {
  it('enters from the start or the end', () => {
    expect(navigate('ArrowRight', null, 5)).toBe(0);
    expect(navigate('ArrowLeft', null, 5)).toBe(4);
  });

  it('steps and clamps at the edges', () => {
    expect(navigate('ArrowRight', 2, 5)).toBe(3);
    expect(navigate('ArrowRight', 4, 5)).toBe(4);
    expect(navigate('ArrowLeft', 0, 5)).toBe(0);
    expect(navigate('PageUp', 0, 50)).toBe(10);
    expect(navigate('PageDown', 3, 50)).toBe(0);
  });

  it('jumps to the ends and clears on Escape', () => {
    expect(navigate('Home', 3, 5)).toBe(0);
    expect(navigate('End', 0, 5)).toBe(4);
    expect(navigate('Escape', 3, 5)).toBeNull();
  });

  it('ignores other keys and empty data', () => {
    expect(navigate('a', 1, 5)).toBeUndefined();
    expect(navigate('ArrowRight', null, 0)).toBeUndefined();
  });
});
