"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, ChevronRight } from "lucide-react";
import { usePageOverlay } from "@/components/layout/PageOverlay";
import { usePageFlow } from "@/hooks/useDevicePref";

/**
 * While what follows the stage is out of sight: a pill that says there is more and takes you there.
 * It leaves as soon as that part shows (or was passed), and stays away once it has been seen.
 */
export function MoreBelow({ label }: { label: string }) {
  const overlay = usePageOverlay();
  const [pageFlow] = usePageFlow();
  const sideways = pageFlow !== "abajo";
  const [show, setShow] = useState(false);

  useEffect(() => {
    let seen = false;
    let frame = 0;
    const check = () => {
      frame = 0;
      if (seen) return;
      const target = document.querySelector('[data-look="next"]');
      if (!target) {
        // It arrives a moment after the stage.
        frame = requestAnimationFrame(check);
        return;
      }
      const r = target.getBoundingClientRect();
      // «In sight» means really in: the top of a heading peeking in doesn't count.
      const out = sideways ? r.left + r.width * 0.35 > window.innerWidth : r.top + r.height * 0.35 > window.innerHeight;
      if (!out) seen = true;
      setShow(out);
    };
    const later = () => {
      if (!frame) frame = requestAnimationFrame(check);
    };
    check();
    window.addEventListener("scroll", later, { capture: true, passive: true });
    window.addEventListener("resize", later);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", later, true);
      window.removeEventListener("resize", later);
    };
  }, [sideways]);

  if (!overlay || !show) return null;
  const Icon = sideways ? ChevronRight : ChevronDown;
  return createPortal(
    <button
      type="button"
      onClick={() => document.querySelector('[data-look="next"]')?.scrollIntoView({ behavior: "smooth", block: "start", inline: "start" })}
      className="more-below pop-in pointer-events-auto absolute bottom-0 left-1/2 flex h-11 -translate-x-1/2 items-center gap-2 rounded-full bg-strong px-5 text-sm font-semibold text-strong-foreground shadow-soft-lg transition-transform hover:scale-[1.03]"
    >
      {label}
      <Icon aria-hidden className={sideways ? "more-below-x h-4 w-4" : "more-below-y h-4 w-4"} />
    </button>,
    overlay,
  );
}
