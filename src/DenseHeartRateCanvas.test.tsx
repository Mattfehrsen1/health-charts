import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { DenseHeartRateCanvas } from './DenseHeartRateCanvas';
import { TEST_WIDTH } from './test/setup';

const start = Date.parse('2026-03-14T00:00:00Z');
const count = 86_400;
const times = Float64Array.from({ length: count }, (_, i) => start + i * 1000);
const values = Float32Array.from({ length: count }, (_, i) => 60 + 40 * Math.sin(i / 3000));
const fullSpan = (count - 1) * 1000;

type Call = [method: string, ...args: unknown[]];

const lastDomain = (mock: Mock<(domain: [number, number]) => void>) => {
  const call = mock.mock.lastCall;
  if (!call) throw new Error('onDomainChange was not called');
  return call[0];
};

function fakeContext(calls: Call[]) {
  return new Proxy({} as CanvasRenderingContext2D, {
    get:
      (_, method: string) =>
      (...args: unknown[]) =>
        calls.push([method, ...args]),
    set: () => true,
  });
}

describe('DenseHeartRateCanvas', () => {
  let calls: Call[];

  beforeEach(() => {
    calls = [];
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() =>
      fakeContext(calls),
    );
    HTMLCanvasElement.prototype.setPointerCapture = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderCanvas = (props: Partial<Parameters<typeof DenseHeartRateCanvas>[0]> = {}) => {
    render(<DenseHeartRateCanvas times={times} values={values} height={200} {...props} />);
    return {
      group: screen.getByRole('group', { name: 'Heart rate, full day' }),
      canvas: screen.getByRole<HTMLCanvasElement>('img'),
    };
  };

  it('scales the backing store by devicePixelRatio and draws in CSS pixels', () => {
    vi.spyOn(window, 'devicePixelRatio', 'get').mockReturnValue(2);
    const { canvas } = renderCanvas();
    expect(canvas.width).toBe(TEST_WIDTH * 2);
    expect(canvas.height).toBe(400);
    expect(canvas.style.width).toBe(`${TEST_WIDTH}px`);
    expect(calls).toContainEqual(['setTransform', 2, 0, 0, 2, 0, 0]);
  });

  it('draws one decimated bucket per device pixel column, not every sample', () => {
    vi.spyOn(window, 'devicePixelRatio', 'get').mockReturnValue(2);
    renderCanvas();
    const plotColumns = (TEST_WIDTH - 40 - 12) * 2;
    const lineTos = calls.filter(([method]) => method === 'lineTo').length;
    // Grid lines add a handful; the data line adds three or four per column.
    expect(lineTos).toBeGreaterThan(plotColumns * 3);
    expect(lineTos).toBeLessThan(plotColumns * 4 + 20);
    expect(calls.some(([method]) => method === 'stroke')).toBe(true);
  });

  it('summarises the visible window in its accessible name', () => {
    const { canvas } = renderCanvas();
    expect(canvas.getAttribute('aria-label')).toBe(
      'Heart rate, full day: 00:00 to 23:59, 20 to 100 bpm',
    );
  });

  it('zooms and pans with the keyboard', () => {
    const onDomainChange = vi.fn<(domain: [number, number]) => void>();
    const { group } = renderCanvas({ onDomainChange });

    fireEvent.keyDown(group, { key: '+' });
    const [zoomStart, zoomEnd] = lastDomain(onDomainChange);
    expect(zoomEnd - zoomStart).toBeCloseTo(fullSpan / 2);
    expect(zoomStart).toBeCloseTo(start + fullSpan / 4);

    fireEvent.keyDown(group, { key: 'ArrowRight' });
    expect(lastDomain(onDomainChange)[0]).toBeCloseTo(zoomStart + fullSpan / 20);

    fireEvent.keyDown(group, { key: '0' });
    expect(lastDomain(onDomainChange)).toEqual([start, start + fullSpan]);
  });

  it('zooms towards the cursor on wheel and resets on double click', () => {
    const onDomainChange = vi.fn<(domain: [number, number]) => void>();
    const { canvas } = renderCanvas({ onDomainChange });

    fireEvent.wheel(canvas, { deltaY: -500, clientX: 40 });
    const [zoomStart, zoomEnd] = lastDomain(onDomainChange);
    expect(zoomStart).toBe(start);
    expect(zoomEnd - zoomStart).toBeLessThan(fullSpan);

    fireEvent.doubleClick(canvas);
    expect(lastDomain(onDomainChange)).toEqual([start, start + fullSpan]);
  });

  it('pans by dragging, in the direction of the drag', () => {
    const half: [number, number] = [start, start + fullSpan / 2];
    const onDomainChange = vi.fn<(domain: [number, number]) => void>();
    const { canvas } = renderCanvas({ domain: half, onDomainChange });

    fireEvent.pointerDown(canvas, { clientX: 300, pointerId: 1 });
    fireEvent.pointerMove(canvas, { clientX: 200, pointerId: 1 });
    const [panStart] = lastDomain(onDomainChange);
    expect(panStart).toBeGreaterThan(start);

    fireEvent.pointerUp(canvas, { pointerId: 1 });
    onDomainChange.mockClear();
    fireEvent.pointerMove(canvas, { clientX: 100, pointerId: 1 });
    expect(onDomainChange).not.toHaveBeenCalled();
  });

  it('stops at the edges of the data', () => {
    const onDomainChange = vi.fn<(domain: [number, number]) => void>();
    const { group } = renderCanvas({ onDomainChange });
    fireEvent.keyDown(group, { key: 'ArrowLeft' });
    expect(lastDomain(onDomainChange)).toEqual([start, start + fullSpan]);
  });
});
