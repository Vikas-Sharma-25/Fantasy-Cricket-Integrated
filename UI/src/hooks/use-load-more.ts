import { useEffect, useMemo, useState } from "react";

/**
 * Reveals `pageSize` items at a time from an already-fetched array.
 * Call `reset()` whenever the source list changes (new tab, new filter, refetch).
 */
export function useLoadMore<T>(items: T[], pageSize = 5) {
  const [visibleCount, setVisibleCount] = useState(pageSize);

  useEffect(() => {
    setVisibleCount(pageSize);
  }, [items === undefined ? 0 : items.length === 0 ? 0 : 1]); // resets only on empty<->non-empty swings; call reset() explicitly on refetch

  const visibleItems = useMemo(() => items.slice(0, visibleCount), [items, visibleCount]);
  const hasMore = visibleCount < items.length;

  function loadMore() {
    setVisibleCount((c) => Math.min(c + pageSize, items.length));
  }

  function reset() {
    setVisibleCount(pageSize);
  }

  return { visibleItems, hasMore, loadMore, reset, total: items.length };
}