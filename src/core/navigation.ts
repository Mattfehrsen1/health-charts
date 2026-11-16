const PAGE_STEP = 10;

/**
 * Keyboard navigation over `count` data points. Returns the new active index,
 * `null` to clear the selection, or `undefined` when the key is not handled.
 */
export function navigate(
  key: string,
  active: number | null,
  count: number,
): number | null | undefined {
  if (count === 0) return undefined;
  const last = count - 1;
  const clamp = (index: number) => Math.max(0, Math.min(last, index));
  switch (key) {
    case 'ArrowRight':
      return active === null ? 0 : clamp(active + 1);
    case 'ArrowLeft':
      return active === null ? last : clamp(active - 1);
    case 'PageUp':
      return clamp((active ?? 0) + PAGE_STEP);
    case 'PageDown':
      return clamp((active ?? last) - PAGE_STEP);
    case 'Home':
      return 0;
    case 'End':
      return last;
    case 'Escape':
      return null;
    default:
      return undefined;
  }
}
