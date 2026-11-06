"use client";

import { useEffect, type RefObject } from "react";

const WHEEL_DISTANCE = 140; // px of sideways trackpad travel that count as a swipe
const TOUCH_DISTANCE = 70;
const COOLDOWN_MS = 800;

/** True when the gesture started on something that scrolls sideways or takes text. */
function ownsGesture(target: EventTarget | null): boolean {
  let el = target instanceof Element ? target : null;
  while (el && el !== document.body) {
    // Text fields, dialogs and sideways boards (even one short enough not to scroll) keep the gesture.
    if (el.matches("input, textarea, select, [contenteditable='true'], dialog, .strip-scroll")) return true;
    const style = getComputedStyle(el);
    if (/(auto|scroll)/.test(style.overflowX) && el.scrollWidth > el.clientWidth + 1) return true;
    el = el.parentElement;
  }
  return false;
}

/**
 * Sideways swipes (trackpad or finger) on the page move to the next or previous section. Anything
 * that scrolls sideways itself (tables, boards) or takes text keeps the gesture for itself.
 */
export function useSectionSwipe(ref: RefObject<HTMLElement | null>, enabled: boolean, go: (dir: 1 | -1) => void) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    let travel = 0;
    let last = 0;
    let quietUntil = 0;
    let touch: { x: number; y: number; owned: boolean } | null = null;

    const fire = (dir: 1 | -1) => {
      quietUntil = Date.now() + COOLDOWN_MS;
      travel = 0;
      go(dir);
    };

    const onWheel = (e: WheelEvent) => {
      if (Date.now() < quietUntil || Math.abs(e.deltaX) <= Math.abs(e.deltaY) * 1.5 || ownsGesture(e.target)) return;
      if (Date.now() - last > 300) travel = 0;
      last = Date.now();
      travel += e.deltaX;
      if (Math.abs(travel) >= WHEEL_DISTANCE) fire(travel > 0 ? 1 : -1);
    };
    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      touch = { x: t.clientX, y: t.clientY, owned: ownsGesture(e.target) };
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (!touch || touch.owned || Date.now() < quietUntil) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - touch.x;
      const dy = t.clientY - touch.y;
      touch = null;
      if (Math.abs(dx) >= TOUCH_DISTANCE && Math.abs(dy) < Math.abs(dx) * 0.6) fire(dx < 0 ? 1 : -1);
    };

    el.addEventListener("wheel", onWheel, { passive: true });
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [ref, enabled, go]);
}
