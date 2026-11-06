"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface TabsProps {
  tabs: { id: string; label: string; count?: number }[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}

/**
 * Underlined tab bar with an indicator that glides between tabs. Controlled. On a narrow screen
 * the bar scrolls sideways instead of widening the page; ← → move between tabs.
 */
export function Tabs({ tabs, value, onChange, className }: TabsProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const [bar, setBar] = useState({ left: 0, width: 0 });
  const signature = tabs.map((t) => `${t.id}:${t.label}:${t.count ?? ""}`).join("|");

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const measure = () => {
      const el = list.querySelector<HTMLElement>(`[data-tab="${CSS.escape(value)}"]`);
      if (!el) return;
      setBar((b) => (b.left === el.offsetLeft && b.width === el.offsetWidth ? b : { left: el.offsetLeft, width: el.offsetWidth }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(list);
    return () => ro.disconnect();
  }, [value, signature]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const i = tabs.findIndex((t) => t.id === value);
    const next = tabs[(i + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length];
    if (!next) return;
    e.preventDefault();
    onChange(next.id);
    listRef.current?.querySelector<HTMLElement>(`[data-tab="${CSS.escape(next.id)}"]`)?.focus();
  };

  return (
    <div
      ref={listRef}
      role="tablist"
      onKeyDown={onKeyDown}
      // The baseline is an inset shadow, not a border: the bar scrolls sideways (overflow clips on
      // both axes) and the indicator still sits exactly on the line.
      className={cn(
        "relative flex items-center gap-1 overflow-x-auto shadow-[inset_0_-1px_0_rgb(var(--c-border))] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
    >
      {tabs.map((tab) => {
        const active = tab.id === value;
        return (
          <button
            key={tab.id}
            data-tab={tab.id}
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative flex shrink-0 items-center whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors focus-visible:-outline-offset-2",
              active ? "text-text-primary" : "text-text-secondary hover:text-text-primary",
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={cn(
                  "ml-2 rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums transition-colors",
                  active ? "bg-primary-soft text-accent-text" : "bg-surface-muted text-text-muted",
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
      {/* A 1px bar moved and stretched with `transform`, so the glide never re-lays out the row. */}
      <span
        aria-hidden
        className="absolute bottom-0 left-0 h-[2px] w-px origin-left bg-primary transition-transform duration-300 [transition-timing-function:var(--ease-out)]"
        style={{ transform: `translateX(${bar.left}px) scaleX(${bar.width})` }}
      />
    </div>
  );
}
