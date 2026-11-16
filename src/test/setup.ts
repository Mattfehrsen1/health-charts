import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

/** Width reported by the ResizeObserver stub to every observed element. */
export const TEST_WIDTH = 640;

class ResizeObserverStub {
  constructor(private readonly callback: ResizeObserverCallback) {}
  observe(target: Element) {
    const entry = { target, contentRect: { width: TEST_WIDTH, height: 0 } } as ResizeObserverEntry;
    this.callback([entry], this);
  }
  unobserve() {}
  disconnect() {}
}

export const motion = { reduced: false };

vi.stubGlobal('ResizeObserver', ResizeObserverStub);
vi.stubGlobal('matchMedia', (query: string) => ({
  matches: query.includes('reduced-motion') && motion.reduced,
  media: query,
  addEventListener: () => {},
  removeEventListener: () => {},
}));

afterEach(() => {
  cleanup();
  motion.reduced = false;
});
