import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from 'react';
import { decimateMinMax, type Bucket, type NumericArray } from './core/decimate';
import { extent, scaleLinear, type LinearScale } from './core/scale';
import { formatTime, niceDomain, niceTicks, timeTicks } from './core/ticks';
import { panDomain, zoomDomain, type Domain } from './core/viewport';
import { useDevicePixelRatio, useElementSize } from './hooks';
import { resolveColor, visuallyHidden } from './theme';

export interface DenseHeartRateCanvasProps {
  /** Epoch milliseconds, sorted ascending. */
  times: NumericArray;
  /** Beats per minute, aligned with `times`. NaN marks a missing reading. */
  values: NumericArray;
  height?: number;
  /** Readings further apart than this are not joined by the line. */
  gapMs?: number;
  /** Narrowest window that zooming can reach. */
  minSpanMs?: number;
  /** Visible time window. Pass it with `onDomainChange` to control pan and zoom. */
  domain?: Domain;
  onDomainChange?: (domain: [number, number]) => void;
  label?: string;
  className?: string;
}

const MARGIN = { top: 8, right: 12, bottom: 24, left: 40 };
const WHEEL_ZOOM_SPEED = 0.0015;
const LINE_HEIGHT = 16;
const KEY_PAN_FRACTION = 0.1;

interface Frame {
  width: number;
  height: number;
  x: LinearScale;
  y: LinearScale;
  buckets: Bucket[];
  gapMs: number;
}

function draw(canvas: HTMLCanvasElement, pixelRatio: number, frame: Frame) {
  const { width, height, x, y, buckets, gapMs } = frame;
  // The backing store is sized in device pixels; the transform lets every
  // drawing call below work in CSS pixels.
  const backingWidth = Math.round(width * pixelRatio);
  const backingHeight = Math.round(height * pixelRatio);
  // Assigning a size reallocates the backing store, so only do it on change.
  if (canvas.width !== backingWidth) canvas.width = backingWidth;
  if (canvas.height !== backingHeight) canvas.height = backingHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  ctx.clearRect(0, 0, width, height);

  const [left, right] = x.range;
  const [bottom, top] = y.range;
  const muted = resolveColor(canvas, 'muted');

  ctx.font = '11px system-ui, sans-serif';
  ctx.fillStyle = muted;
  ctx.strokeStyle = resolveColor(canvas, 'grid');
  ctx.lineWidth = 1;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (const tick of niceTicks(y.domain[0], y.domain[1], 5)) {
    // Half-pixel offset keeps 1px lines crisp at a ratio of 1.
    const py = Math.round(y(tick)) + 0.5;
    ctx.beginPath();
    ctx.moveTo(left, py);
    ctx.lineTo(right, py);
    ctx.stroke();
    ctx.fillText(String(tick), left - 6, py);
  }

  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  const { ticks, step } = timeTicks(
    x.domain[0],
    x.domain[1],
    Math.max(2, Math.floor((right - left) / 90)),
  );
  for (const tick of ticks) ctx.fillText(formatTime(tick, step), x(tick), bottom + 6);

  ctx.save();
  ctx.beginPath();
  ctx.rect(left, top, right - left, bottom - top);
  ctx.clip();
  ctx.strokeStyle = resolveColor(canvas, 'line');
  ctx.lineWidth = 1.25;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  let previous: Bucket | undefined;
  for (const bucket of buckets) {
    // One bucket per device pixel column; its centre in CSS pixels.
    const px = left + (bucket.column + 0.5) / pixelRatio;
    if (!previous || bucket.firstTime - previous.lastTime > gapMs) ctx.moveTo(px, y(bucket.first));
    else ctx.lineTo(px, y(bucket.first));
    ctx.lineTo(px, y(bucket.min));
    ctx.lineTo(px, y(bucket.max));
    ctx.lineTo(px, y(bucket.last));
    previous = bucket;
  }
  ctx.stroke();
  ctx.restore();
}

export function DenseHeartRateCanvas({
  times,
  values,
  height = 200,
  gapMs = 5_000,
  minSpanMs = 60_000,
  domain: controlledDomain,
  onDomainChange,
  label = 'Heart rate, full day',
  className,
}: DenseHeartRateCanvasProps) {
  const [containerRef, { width }] = useElementSize<HTMLDivElement>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pixelRatio = useDevicePixelRatio();
  const helpId = useId();
  // Announce the new window after keyboard moves only; dragging would flood the screen reader.
  const [announce, setAnnounce] = useState(false);

  const bounds = useMemo<Domain>(() => [times[0] ?? 0, times[times.length - 1] ?? 0], [times]);
  const [ownDomain, setOwnDomain] = useState<Domain>(bounds);
  const [previousBounds, setPreviousBounds] = useState(bounds);
  if (bounds !== previousBounds) {
    setPreviousBounds(bounds);
    setOwnDomain(bounds);
  }
  const domain = controlledDomain ?? ownDomain;
  const setDomain = (next: [number, number]) => {
    setOwnDomain(next);
    onDomainChange?.(next);
  };

  const yDomain = useMemo(() => {
    const range = extent(values);
    return range ? niceDomain(range[0], range[1], 5) : ([0, 1] as const);
  }, [values]);

  const plotWidth = Math.max(0, width - MARGIN.left - MARGIN.right);
  const x = useMemo(
    () => scaleLinear(domain, [MARGIN.left, MARGIN.left + plotWidth]),
    [domain, plotWidth],
  );
  const y = useMemo(
    () => scaleLinear(yDomain, [height - MARGIN.bottom, MARGIN.top]),
    [yDomain, height],
  );
  const buckets = useMemo(
    () => decimateMinMax(times, values, domain[0], domain[1], Math.round(plotWidth * pixelRatio)),
    [times, values, domain, plotWidth, pixelRatio],
  );

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && width > 0) draw(canvas, pixelRatio, { width, height, x, y, buckets, gapMs });
  }, [width, height, x, y, buckets, gapMs, pixelRatio]);

  // Wheel events can arrive faster than React re-renders, so each one builds
  // on the most recently requested domain rather than the last rendered one.
  const latestDomain = useRef(domain);
  useLayoutEffect(() => {
    latestDomain.current = domain;
  }, [domain]);

  // React registers wheel listeners as passive, which cannot prevent the page from scrolling.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      if (plotWidth === 0) return;
      // Some browsers report mouse wheels in lines rather than pixels.
      const scale = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? LINE_HEIGHT : 1;
      const current = latestDomain.current;
      const span = current[1] - current[0];
      const offsetX = event.clientX - canvas.getBoundingClientRect().left - MARGIN.left;
      const anchor = current[0] + (offsetX / plotWidth) * span;
      const factor = Math.exp(event.deltaY * scale * WHEEL_ZOOM_SPEED);
      const zoomed = zoomDomain(current, bounds, anchor, factor, minSpanMs);
      const shift = ((event.deltaX * scale) / plotWidth) * (zoomed[1] - zoomed[0]);
      const next = panDomain(zoomed, bounds, shift);
      latestDomain.current = next;
      setDomain(next);
    };
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      canvas.removeEventListener('wheel', onWheel);
    };
  });

  const drag = useRef<{ pointerX: number; domain: Domain } | null>(null);

  const onPointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    if (event.button !== 0) return;
    setAnnounce(false);
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { pointerX: event.clientX, domain };
  };

  const onPointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!drag.current || plotWidth === 0) return;
    const { pointerX, domain: start } = drag.current;
    const msPerPixel = (start[1] - start[0]) / plotWidth;
    setDomain(panDomain(start, bounds, (pointerX - event.clientX) * msPerPixel));
  };

  const endDrag = () => {
    drag.current = null;
  };

  const keyboardDomain = (key: string): [number, number] | undefined => {
    const span = domain[1] - domain[0];
    const center = domain[0] + span / 2;
    switch (key) {
      case 'ArrowLeft':
        return panDomain(domain, bounds, -span * KEY_PAN_FRACTION);
      case 'ArrowRight':
        return panDomain(domain, bounds, span * KEY_PAN_FRACTION);
      case '+':
      case '=':
        return zoomDomain(domain, bounds, center, 0.5, minSpanMs);
      case '-':
        return zoomDomain(domain, bounds, center, 2, minSpanMs);
      case '0':
        return [bounds[0], bounds[1]];
      default:
        return undefined;
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const next = keyboardDomain(event.key);
    if (!next) return;
    event.preventDefault();
    setDomain(next);
    setAnnounce(true);
  };

  let low = Infinity;
  let high = -Infinity;
  for (const bucket of buckets) {
    low = Math.min(low, bucket.min);
    high = Math.max(high, bucket.max);
  }
  const visible = buckets.length
    ? `${formatTime(domain[0])} to ${formatTime(domain[1])}, ${Math.round(low)} to ${Math.round(high)} bpm`
    : 'no readings in view';

  return (
    <div
      ref={containerRef}
      className={className}
      role="group"
      aria-label={`${label}: ${visible}`}
      aria-describedby={helpId}
      tabIndex={0}
      onKeyDown={onKeyDown}
      style={{ position: 'relative', height }}
    >
      <p id={helpId} style={visuallyHidden}>
        Drag or use the left and right arrow keys to pan. Scroll or press plus and minus to zoom,
        and 0 to reset.
      </p>
      <div aria-live="polite" style={visuallyHidden}>
        {announce && visible}
      </div>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onDoubleClick={() => {
          setDomain([bounds[0], bounds[1]]);
        }}
        style={{ display: 'block', width, height, touchAction: 'none', cursor: 'grab' }}
      />
    </div>
  );
}
