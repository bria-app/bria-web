"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type RefObject } from "react";
import { flushSync } from "react-dom";
import { layoutNow } from "@/components/layout/sidewaysLayout";

/** Pointer travel that turns a press into a drag, px. */
const THRESHOLD = 5;
/** After the cards change places, the time to see where they went before they change again, ms. */
const REST = 220;
/** …and the pointer has to move this much, px, or a card that just slid under it would swap right back. */
const STILL = 14;
/** Distance from the screen's edge where dragging scrolls the page, px, and the fastest it goes, px per frame. */
const EDGE = 72;
const SPEED = 14;
const SLIDE = { duration: 260, easing: "cubic-bezier(0.22, 1, 0.36, 1)" };

interface Box {
  el: HTMLElement;
  left: number;
  top: number;
  right: number;
  bottom: number;
}

interface Session<K extends string> {
  key: K;
  el: HTMLElement;
  pointerId: number;
  /** Where the press landed, and the pointer now. */
  startX: number;
  startY: number;
  x: number;
  y: number;
  /** The press inside the card, so the card stays under the finger as it was picked up. */
  grabX: number;
  grabY: number;
  moving: boolean;
  order: K[];
  original: K[];
  /** The card's own place, the others' places, all as they were when measured… */
  slot: { left: number; top: number };
  others: Map<K, Box>;
  /** …with the page scrolled this far: scrolling since then shifts them all. */
  scrollX: number;
  scrollY: number;
  restUntil: number;
  lastSwapX: number;
  lastSwapY: number;
}

interface Options<K extends string> {
  grid: RefObject<HTMLElement | null>;
  order: K[];
  /** While dragging: shows the cards in this order. Nothing is saved yet. */
  onPreview: (next: K[]) => void;
  /** On letting go: the order to keep. */
  onDrop: (next: K[]) => void;
  /** Escape: back as it was. */
  onCancel: () => void;
}

const page = () => document.getElementById("contenido");

const calm = () =>
  document.documentElement.getAttribute("data-motion") === "reduced" || window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Drag cards to reorder them, at the screen's full frame rate: the card follows the pointer on the
 * compositor (`translate` only, no React render), and React renders only the moments the order
 * really changes. The other cards then slide to their new places the same way. Works the same
 * with the page running down or sideways, and scrolls it when the card nears the edge.
 */
export function useCardDrag<K extends string>({ grid, order, onPreview, onDrop, onCancel }: Options<K>) {
  const [dragging, setDragging] = useState<K | null>(null);
  const session = useRef<Session<K> | null>(null);
  const frame = useRef(0);
  const options = useRef({ onPreview, onDrop, onCancel });
  useEffect(() => {
    options.current = { onPreview, onDrop, onCancel };
  });
  const finish = useRef<(commit: boolean) => void>(() => {});
  const loop = useRef<() => void>(() => {});

  /** Every card's place as laid out now, ignoring where the dragged one is being carried. */
  const measure = useCallback(
    (s: Session<K>) => {
      s.el.style.translate = "";
      s.el.style.scale = "";
      const scroller = page();
      s.scrollX = scroller?.scrollLeft ?? 0;
      s.scrollY = scroller?.scrollTop ?? 0;
      const own = s.el.getBoundingClientRect();
      s.slot = { left: own.left, top: own.top };
      // The dashed outline of where the card will land.
      const mark = grid.current?.querySelector<HTMLElement>("[data-slot]");
      if (mark) {
        mark.style.display = "block";
        const base = (mark.offsetParent ?? mark).getBoundingClientRect();
        mark.style.left = `${own.left - base.left}px`;
        mark.style.top = `${own.top - base.top}px`;
        mark.style.width = `${own.width}px`;
        mark.style.height = `${own.height}px`;
      }
      s.others = new Map();
      for (const el of grid.current?.querySelectorAll<HTMLElement>("[data-card]") ?? []) {
        if (el === s.el) continue;
        const r = el.getBoundingClientRect();
        s.others.set(el.dataset.card as K, { el, left: r.left, top: r.top, right: r.right, bottom: r.bottom });
      }
    },
    [grid],
  );

  /** Puts the carried card under the pointer. */
  const carry = useCallback((s: Session<K>) => {
    const scroller = page();
    const dx = s.x - s.grabX - (s.slot.left - ((scroller?.scrollLeft ?? 0) - s.scrollX));
    const dy = s.y - s.grabY - (s.slot.top - ((scroller?.scrollTop ?? 0) - s.scrollY));
    s.el.style.translate = `${dx}px ${dy}px`;
    s.el.style.scale = "1.015";
  }, []);

  /** Shows `next` now and slides every other card from where it was to its new place. */
  const reorder = useCallback(
    (s: Session<K>, next: K[]) => {
      const was = new Map([...s.others].map(([k, b]) => [k, { left: b.left, top: b.top }]));
      s.order = next;
      flushSync(() => options.current.onPreview(next));
      const scroller = page();
      if (scroller) layoutNow(scroller);
      measure(s);
      carry(s);
      if (calm()) return;
      for (const [k, box] of s.others) {
        const from = was.get(k);
        if (!from) continue;
        const dx = from.left - box.left;
        const dy = from.top - box.top;
        if (Math.abs(dx) > 1 || Math.abs(dy) > 1) box.el.animate([{ translate: `${dx}px ${dy}px` }, { translate: "0 0" }], SLIDE);
      }
    },
    [carry, measure],
  );

  /** The card under the pointer, once the pointer is past the point of swapping with it. */
  const swapTarget = useCallback((s: Session<K>): K | null => {
    const scroller = page();
    const offX = (scroller?.scrollLeft ?? 0) - s.scrollX;
    const offY = (scroller?.scrollTop ?? 0) - s.scrollY;
    const from = s.order.indexOf(s.key);
    for (const [k, b] of s.others) {
      const left = b.left - offX;
      const right = b.right - offX;
      const top = b.top - offY;
      const bottom = b.bottom - offY;
      if (s.x < left || s.x > right || s.y < top || s.y > bottom) continue;
      const to = s.order.indexOf(k);
      // Side by side, it waits for the pointer to pass the other's middle: a wide card and a narrow
      // one can't keep trading places. From another row, being over it is enough.
      const sameRow = Math.abs(top - (s.slot.top - offY)) < 8;
      if (sameRow && (to > from ? s.x < (left + right) / 2 : s.x > (left + right) / 2)) return null;
      return k;
    }
    return null;
  }, []);

  const tick = useCallback(() => {
    const s = session.current;
    if (!s?.moving) return;
    const scroller = page();
    if (scroller) {
      const r = scroller.getBoundingClientRect();
      const pull = (near: number, far: number, at: number) =>
        at < near + EDGE ? -((near + EDGE - at) / EDGE) * SPEED : at > far - EDGE ? ((at - (far - EDGE)) / EDGE) * SPEED : 0;
      const sx = scroller.scrollWidth > scroller.clientWidth ? pull(r.left, r.right, s.x) : 0;
      const sy = scroller.scrollHeight > scroller.clientHeight ? pull(r.top, r.bottom, s.y) : 0;
      if (sx || sy) scroller.scrollBy(sx, sy);
    }
    carry(s);
    const now = performance.now();
    const moved = Math.hypot(s.x - s.lastSwapX, s.y - s.lastSwapY) >= STILL;
    if (now >= s.restUntil && moved) {
      const target = swapTarget(s);
      if (target) {
        const next = s.order.filter((k) => k !== s.key);
        next.splice(s.order.indexOf(target), 0, s.key);
        s.restUntil = now + REST;
        s.lastSwapX = s.x;
        s.lastSwapY = s.y;
        reorder(s, next);
      }
    }
    frame.current = requestAnimationFrame(() => loop.current());
  }, [carry, reorder, swapTarget]);
  useEffect(() => {
    loop.current = tick;
  }, [tick]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const s = session.current;
      if (!s || e.pointerId !== s.pointerId) return;
      s.x = e.clientX;
      s.y = e.clientY;
      if (s.moving || Math.hypot(s.x - s.startX, s.y - s.startY) < THRESHOLD) return;
      s.moving = true;
      measure(s);
      s.el.dataset.lifted = "";
      document.documentElement.dataset.cardDragging = "";
      setDragging(s.key);
      frame.current = requestAnimationFrame(() => loop.current());
    };
    const onUp = (e: PointerEvent) => {
      if (session.current && e.pointerId === session.current.pointerId) finish.current(true);
    };
    const onCancel = () => finish.current(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && session.current?.moving) {
        e.preventDefault();
        e.stopPropagation();
        finish.current(false);
      }
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    window.addEventListener("keydown", onKey, true);
    finish.current = (commit) => {
      const s = session.current;
      session.current = null;
      if (!s?.moving) return;
      cancelAnimationFrame(frame.current);
      delete document.documentElement.dataset.cardDragging;
      if (!commit && s.order.join() !== s.original.join()) {
        flushSync(() => options.current.onPreview(s.original));
        const scroller = page();
        if (scroller) layoutNow(scroller);
      }
      // The card settles into its place from wherever it was let go.
      const carried = s.el.style.translate;
      s.el.style.translate = "";
      s.el.style.scale = "";
      delete s.el.dataset.lifted;
      const mark = grid.current?.querySelector<HTMLElement>("[data-slot]");
      if (mark) mark.style.display = "none";
      setDragging(null);
      if (commit) options.current.onDrop(s.order);
      else options.current.onCancel();
      if (calm() || !carried) return;
      const was = s.el.getBoundingClientRect();
      const [x, y] = carried.split(" ").map(parseFloat);
      const scroller = page();
      const dx = s.slot.left + x - ((scroller?.scrollLeft ?? 0) - s.scrollX) - was.left;
      const dy = s.slot.top + y - ((scroller?.scrollTop ?? 0) - s.scrollY) - was.top;
      s.el.animate([{ translate: `${dx}px ${dy}px`, scale: "1.015" }, { translate: "0 0", scale: "1" }], SLIDE);
    };
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
      window.removeEventListener("keydown", onKey, true);
      cancelAnimationFrame(frame.current);
    };
  }, [grid, measure]);

  /** Press on a card. Taps on its own controls, and touch anywhere but the grip, aren't drags. */
  const press = (key: K, e: ReactPointerEvent<HTMLElement>) => {
    if (e.button !== 0 || (e.target as Element).closest("[data-no-drag]")) return;
    if (e.pointerType !== "mouse" && !(e.target as Element).closest("[data-grip]")) return;
    const el = e.currentTarget;
    const box = el.getBoundingClientRect();
    session.current = {
      key,
      el,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      x: e.clientX,
      y: e.clientY,
      grabX: e.clientX - box.left,
      grabY: e.clientY - box.top,
      moving: false,
      order,
      original: order,
      slot: { left: box.left, top: box.top },
      others: new Map(),
      scrollX: 0,
      scrollY: 0,
      restUntil: 0,
      lastSwapX: e.clientX,
      lastSwapY: e.clientY,
    };
    e.preventDefault(); // no text selected on the way
  };

  return { dragging, press };
}
