import { useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';

export interface Size {
  width: number;
  height: number;
}

/** Tracks an element's content-box size with a ResizeObserver. */
export function useElementSize<T extends Element>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setSize((prev) =>
        prev.width === width && prev.height === height ? prev : { width, height },
      );
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, []);

  return [ref, size] as const;
}

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

function subscribeToReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener('change', onChange);
  return () => {
    query.removeEventListener('change', onChange);
  };
}

export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeToReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  );
}

function subscribeToPixelRatio(onChange: () => void) {
  // A resolution query only fires when the ratio moves away from the value it
  // was created with, so re-arm it with the new ratio after every change.
  let query: MediaQueryList;
  const handleChange = () => {
    listen();
    onChange();
  };
  const listen = () => {
    query = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    query.addEventListener('change', handleChange, { once: true });
  };
  listen();
  return () => {
    query.removeEventListener('change', handleChange);
  };
}

/** Re-renders when the window moves to a screen with a different pixel density, or on zoom. */
export function useDevicePixelRatio(): number {
  return useSyncExternalStore(
    subscribeToPixelRatio,
    () => window.devicePixelRatio || 1,
    () => 1,
  );
}
