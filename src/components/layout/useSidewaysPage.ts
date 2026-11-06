"use client";

import { useEffect, type RefObject } from "react";
import { usePageFlow } from "@/hooks/useDevicePref";
import { columnStep, mountSidewaysLayout } from "./sidewaysLayout";

/** Share of the distance left that the glide covers each frame: higher is snappier. */
const EASE = 0.2;
/** Arrow keys move this far, px, like a few lines of a normal page. */
const ARROW = 96;

/** True when something between the target and the page can still scroll that way by itself. */
function scrollsInside(target: EventTarget | null, page: HTMLElement, deltaY: number): boolean {
  for (let n = target instanceof Element ? target : null; n && n !== page; n = n.parentElement) {
    if (!/(auto|scroll)/.test(getComputedStyle(n).overflowY) || n.scrollHeight <= n.clientHeight + 1) continue;
    const canDown = n.scrollTop + n.clientHeight < n.scrollHeight - 1;
    if (deltaY > 0 ? canDown : n.scrollTop > 0) return true;
  }
  return false;
}

/** Keys that belong to what has the focus (typing, a menu, a group of options), not to the page. */
function keyBelongsElsewhere(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return !!target.closest(
    "input, textarea, select, [contenteditable=''], [contenteditable='true'], [role='listbox'], [role='menu'], [role='radiogroup'], [role='tablist'], [role='slider'], [role='grid']",
  );
}

const gliders = new WeakMap<HTMLElement, (left: number) => void>();

/** Slides `scroller`'s strip to `left` (clamped) with the same glide as the wheel. */
export function glideTo(scroller: HTMLElement, left: number) {
  const glide = gliders.get(scroller);
  if (glide) glide(left);
  else scroller.scrollTo({ left, behavior: "smooth" });
}

/**
 * «Página hacia el lado»: the screen is laid out again as one strip of columns going on to the
 * right (see `sidewaysLayout`), and it slides the way a normal page scrolls down: the wheel, the
 * trackpad and the keys move it continuously, with a soft glide and no pages or snapping. A table
 * that scrolls by itself keeps the wheel until it reaches its end. Returns whether the mode is on.
 */
export function useSidewaysPage(scroller: RefObject<HTMLElement | null>): boolean {
  const [pageFlow] = usePageFlow();
  const sideways = pageFlow === "lado";

  useEffect(() => {
    const el = scroller.current;
    if (!el || !sideways) return;
    // The glide keeps its own position: scrollLeft may round, which would stall the last pixels.
    let pos = el.scrollLeft;
    let target = pos;
    let frame = 0;
    const max = () => Math.max(0, el.scrollWidth - el.clientWidth);
    const step = () => {
      pos += (target - pos) * EASE;
      if (Math.abs(target - pos) < 0.5) {
        el.scrollLeft = target;
        frame = 0;
        return;
      }
      el.scrollLeft = pos;
      frame = requestAnimationFrame(step);
    };
    const glide = (left: number) => {
      if (!frame) pos = el.scrollLeft;
      target = Math.max(0, Math.min(max(), left));
      if (!frame) frame = requestAnimationFrame(step);
    };
    gliders.set(el, glide);

    const onWheel = (e: WheelEvent) => {
      // A list or a table inside took it already, or it is a zoom (ctrl + wheel).
      if (e.defaultPrevented || e.ctrlKey) return;
      // A sideways swipe already moves the strip: the browser does it.
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX) || scrollsInside(e.target, el, e.deltaY)) return;
      e.preventDefault();
      const unit = e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? el.clientWidth : 1;
      glide((frame ? target : el.scrollLeft) + e.deltaY * unit);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || keyBelongsElsewhere(e.target)) return;
      if (document.querySelector("dialog[open]")) return;
      const from = frame ? target : el.scrollLeft;
      const screen = Math.max(columnStep(el), el.clientWidth * 0.85);
      const moves: Record<string, number> = {
        ArrowRight: from + ARROW,
        ArrowDown: from + ARROW,
        ArrowLeft: from - ARROW,
        ArrowUp: from - ARROW,
        PageDown: from + screen,
        PageUp: from - screen,
        Home: 0,
        End: max(),
      };
      // Space is the page's own key only when no button or link has the focus.
      if (e.key === " " && (e.target === document.body || e.target === el)) moves[" "] = from + (e.shiftKey ? -screen : screen);
      if (!(e.key in moves)) return;
      e.preventDefault();
      glide(moves[e.key]);
    };
    const onScroll = () => {
      // Focusing a field can push the page down; there is nothing below, so it goes back.
      if (el.scrollTop) el.scrollTop = 0;
      // Moved by something else (a swipe, the rail, focusing a field): the glide starts from there.
      if (!frame) pos = target = el.scrollLeft;
    };
    // A hand on the trackpad or a drag on the rail takes over from a glide in progress.
    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("scroll", onScroll, { passive: true });
    el.addEventListener("pointerdown", stop);
    document.addEventListener("keydown", onKey);
    const unmount = mountSidewaysLayout(el);
    return () => {
      stop();
      gliders.delete(el);
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("scroll", onScroll);
      el.removeEventListener("pointerdown", stop);
      document.removeEventListener("keydown", onKey);
      unmount();
    };
  }, [scroller, sideways]);

  return sideways;
}
