"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePageFlow } from "@/hooks/useDevicePref";

/** How far ahead of the end the next part is asked for, in screens. */
const AHEAD = 1.5;
/** Cards or rows a list that is already in memory draws at a time. */
const STEP = 60;

/**
 * Calls `load` whenever the person gets close to the end of the page, whichever way the page runs:
 * down, on to the right, or inside a table that scrolls by itself in a sideways page. It also asks
 * right away while the screen isn't full yet. `size` changes when something arrived.
 */
export function useLoadNearEnd(load: () => void, active: boolean, size: number) {
  const [pageFlow] = usePageFlow();
  const sideways = pageFlow === "lado";
  const latest = useRef(load);
  useLayoutEffect(() => {
    latest.current = load;
  });

  useEffect(() => {
    if (!active) return;
    const main = document.getElementById("contenido");
    if (!main) return;
    let frame = 0;
    const check = () => {
      frame = 0;
      // A table in a sideways page keeps its rows inside: that scroll is what counts, not the page's.
      const inner = sideways ? main.querySelector<HTMLElement>("[data-sw-tall]:has(table)") : null;
      const near = inner
        ? inner.scrollHeight - inner.scrollTop - inner.clientHeight < inner.clientHeight * AHEAD
        : sideways
          ? main.scrollWidth - main.scrollLeft - main.clientWidth < main.clientWidth * AHEAD
          : main.scrollHeight - main.scrollTop - main.clientHeight < main.clientHeight * AHEAD;
      if (near) latest.current();
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(check);
    };
    // Scroll events don't bubble: capturing also hears the table's own.
    main.addEventListener("scroll", schedule, { passive: true, capture: true });
    main.addEventListener("sideways-layout", schedule);
    window.addEventListener("resize", schedule);
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      main.removeEventListener("scroll", schedule, { capture: true });
      main.removeEventListener("sideways-layout", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [active, sideways, size]);
}

export interface ListPage<T> {
  items: T[];
  /** All there are, when the endpoint says. */
  total?: number;
  hasMore: boolean;
}

interface Loaded<T> {
  key: string;
  items: T[];
  total: number | null;
  page: number;
  hasMore: boolean;
}

export interface InfiniteList<T> {
  items: T[];
  total: number | null;
  /** The list itself is on its way (a first load, or new filters: what was there stays meanwhile). */
  loading: boolean;
  /** The next part is on its way. */
  loadingMore: boolean;
  error: string | null;
  /** The next part didn't arrive: the list stays as it is and offers to try again. */
  moreFailed: boolean;
  hasMore: boolean;
  loadMore: () => void;
  reload: () => void;
}

/**
 * A list the API serves in parts, loaded as the person moves along it: no pages and no buttons to
 * turn them. New filters (`deps`) start over; what is on screen stays until the new list is there.
 */
export function useInfiniteList<T>(
  fetchPage: (page: number) => Promise<ListPage<T>>,
  getKey: (item: T) => string,
  deps: readonly (string | number | boolean | null | undefined)[],
): InfiniteList<T> {
  const [reloads, setReloads] = useState(0);
  const [loaded, setLoaded] = useState<Loaded<T> | null>(null);
  const [error, setError] = useState<{ key: string; message: string } | null>(null);
  const [more, setMore] = useState<{ key: string; state: "loading" | "failed" } | null>(null);
  const requestKey = `${JSON.stringify(deps)}#${reloads}`;

  const fetcher = useRef(fetchPage);
  const keyOf = useRef(getKey);
  useLayoutEffect(() => {
    fetcher.current = fetchPage;
    keyOf.current = getKey;
  });

  useEffect(() => {
    let active = true;
    fetcher.current(1).then(
      (first) => {
        if (!active) return;
        setError(null);
        setLoaded({ key: requestKey, items: first.items, total: first.total ?? null, page: 1, hasMore: first.hasMore });
      },
      (err: unknown) => {
        if (active) setError({ key: requestKey, message: err instanceof Error ? err.message : "Algo salió mal. Inténtalo de nuevo." });
      },
    );
    return () => {
      active = false;
    };
  }, [requestKey]);

  const current = loaded?.key === requestKey ? loaded : null;
  const fetching = useRef<string | null>(null);

  const loadMore = useCallback(() => {
    if (!current?.hasMore) return;
    const ask = `${requestKey}@${current.page + 1}`;
    if (fetching.current === ask) return;
    fetching.current = ask;
    setMore({ key: requestKey, state: "loading" });
    fetcher.current(current.page + 1).then(
      (next) => {
        fetching.current = null;
        setMore(null);
        setLoaded((prev) => {
          if (prev?.key !== requestKey || prev.page !== current.page) return prev;
          // A sale made meanwhile shifts the parts by one: what is already listed isn't listed twice.
          const seen = new Set(prev.items.map((i) => keyOf.current(i)));
          return {
            ...prev,
            items: [...prev.items, ...next.items.filter((i) => !seen.has(keyOf.current(i)))],
            total: next.total ?? prev.total,
            page: prev.page + 1,
            hasMore: next.hasMore,
          };
        });
      },
      () => {
        fetching.current = null;
        setMore({ key: requestKey, state: "failed" });
      },
    );
  }, [current, requestKey]);

  const reload = useCallback(() => setReloads((n) => n + 1), []);
  const moreState = more?.key === requestKey ? more.state : null;

  return {
    items: loaded?.items ?? [],
    total: loaded?.total ?? null,
    loading: !current && error?.key !== requestKey,
    loadingMore: moreState === "loading",
    error: error?.key === requestKey ? error.message : null,
    moreFailed: moreState === "failed",
    hasMore: !!current?.hasMore,
    loadMore,
    reload,
  };
}

/**
 * Keeps `useInfiniteList` loading as the person moves. A part that failed isn't asked for again by
 * itself, or it would be asked on every scroll: the list offers to try again instead.
 */
export function useLoadsMore<T>(list: InfiniteList<T>) {
  useLoadNearEnd(list.loadMore, list.hasMore && !list.loadingMore && !list.moreFailed && !list.loading, list.items.length);
}

/**
 * A long list already in memory, drawn a part at a time as the person moves along it, so a big
 * catalog opens as fast as a small one.
 */
export function useDrawnAsNeeded<T>(items: T[]): T[] {
  const [count, setCount] = useState(STEP);
  const shown = items.length > count ? items.slice(0, count) : items;
  useLoadNearEnd(() => setCount((c) => c + STEP), items.length > count, shown.length);
  return shown;
}
