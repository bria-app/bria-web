"use client";

import { ReactNode, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { SelectOptionList } from "./SelectOptionList";

export interface SelectOption<V extends string = string> {
  value: V;
  label: string;
  /** Secondary line under the label (e.g. SKU, RUC). */
  description?: string;
  /** Tree indentation level (categories: Marca → Tipo). */
  depth?: number;
  icon?: ReactNode;
  disabled?: boolean;
  /** Options sharing a group render under a small uppercase header. */
  group?: string;
}

interface SelectProps<V extends string> {
  value: V | "" | null | undefined;
  onChange: (value: V) => void;
  options: SelectOption<V>[];
  placeholder?: string;
  /** Shows a filter box. Defaults to on when there are more than 7 options. */
  searchable?: boolean;
  size?: "sm" | "md";
  disabled?: boolean;
  invalid?: boolean;
  className?: string;
  emptyText?: string;
  "aria-label"?: string;
}

const PANEL_MAX_HEIGHT = 300;

const normalize = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/**
 * Themed dropdown that replaces the native <select>.
 *
 * The panel opens as a `popover` (browser top layer) in a portal, so it is never clipped by a
 * scroll container and never ends up behind a native <dialog>. Inside a dialog it is portalled
 * into that dialog, which keeps it interactive (everything outside a modal dialog is inert).
 * It flips above the trigger when there is no room below and supports keyboard navigation
 * (↑ ↓ Enter Esc) plus type-to-filter.
 */
export function Select<V extends string = string>({
  value,
  onChange,
  options,
  placeholder = "Selecciona…",
  searchable,
  size = "md",
  disabled,
  invalid,
  className,
  emptyText = "Sin resultados",
  "aria-label": ariaLabel,
}: SelectProps<V>) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [pos, setPos] = useState<{ top: number; left: number; width: number; up: boolean; maxHeight: number; host: HTMLElement } | null>(null);

  const showSearch = searchable ?? options.length > 7;
  const selected = options.find((o) => o.value === value) ?? null;

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = normalize(query.trim());
    return options.filter((o) => normalize(`${o.label} ${o.description ?? ""}`).includes(q));
  }, [options, query]);

  const place = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const spaceBelow = window.innerHeight - r.bottom;
    const up = spaceBelow < PANEL_MAX_HEIGHT + 16 && r.top > spaceBelow;
    const host = el.closest("dialog") ?? document.body;
    // Never taller than the room on its side, so it never runs off the screen.
    const room = (up ? r.top : spaceBelow) - 16;
    const maxHeight = Math.max(120, Math.min(PANEL_MAX_HEIGHT, room - (showSearch ? 48 : 0)));
    // At least 220px wide, but never past the screen's edges (a narrow trigger near the right edge of a phone).
    const width = Math.min(Math.max(r.width, 220), window.innerWidth - 16);
    const left = Math.max(8, Math.min(r.left, window.innerWidth - width - 8));
    setPos({ top: up ? r.top - 6 : r.bottom + 6, left, width, up, maxHeight, host });
  }, [showSearch]);

  useLayoutEffect(() => {
    if (!open) return;
    place();
    const onMove = () => place();
    window.addEventListener("resize", onMove);
    window.addEventListener("scroll", onMove, true);
    return () => {
      window.removeEventListener("resize", onMove);
      window.removeEventListener("scroll", onMove, true);
    };
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  /** Opening resets the search and highlights the current value. */
  const openPanel = () => {
    setQuery("");
    const idx = options.findIndex((o) => o.value === value);
    setActive(idx >= 0 ? idx : 0);
    setOpen(true);
    if (showSearch) setTimeout(() => searchRef.current?.focus(), 0);
  };

  // Into the top layer, above any open dialog (the panel mounts once `pos` is known).
  useLayoutEffect(() => {
    const el = panelRef.current;
    if (open && pos && el && !el.matches(":popover-open")) el.showPopover();
  }, [open, pos]);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const choose = (opt: SelectOption<V> | undefined) => {
    if (!opt || opt.disabled) return;
    onChange(opt.value);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openPanel();
      }
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation(); // don't close a surrounding modal
      setOpen(false);
      triggerRef.current?.focus();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(filtered.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(filtered[active]);
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  };

  const panel =
    open && pos
      ? createPortal(
          <div
            ref={panelRef}
            popover="manual"
            onKeyDown={onKeyDown}
            style={{
              position: "fixed",
              inset: "auto",
              margin: 0,
              left: pos.left,
              width: pos.width,
              ...(pos.up ? { bottom: window.innerHeight - pos.top } : { top: pos.top }),
            }}
            className="overflow-hidden rounded-2xl border border-border bg-surface p-0 text-text-primary shadow-soft-xl animate-fade-up"
          >
            {showSearch && (
              <div className="flex items-center gap-2 border-b border-border px-3 py-2">
                <Search className="h-3.5 w-3.5 shrink-0 text-text-muted" />
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setActive(0);
                  }}
                  placeholder="Buscar…"
                  aria-label="Buscar en la lista"
                  className="w-full bg-transparent py-1 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
                />
              </div>
            )}
            <SelectOptionList
              options={filtered}
              value={value}
              active={active}
              onHover={setActive}
              onChoose={choose}
              emptyText={emptyText}
              maxHeight={pos.maxHeight}
            />
          </div>,
          pos.host,
        )
      : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => (open ? setOpen(false) : openPanel())}
        onKeyDown={onKeyDown}
        className={cn(
          "flex w-full items-center gap-2 border bg-surface-soft text-left text-text-primary transition-all focus:outline-none focus:ring-4",
          // md matches inputClass (44px) so a Select lines up with inputs and buttons in a row.
          size === "md" ? "min-h-11 rounded-xl px-3.5 py-2.5 text-sm" : "rounded-lg px-2.5 py-1.5 text-xs",
          invalid
            ? "border-danger focus:ring-danger/15"
            : open
              ? "border-accent-text bg-surface ring-4 ring-primary/20"
              : "border-border hover:border-text-muted/50 focus:border-accent-text focus:ring-primary/20",
          disabled && "cursor-not-allowed opacity-60",
          className,
        )}
      >
        {selected?.icon && <span className="shrink-0">{selected.icon}</span>}
        <span className={cn("min-w-0 flex-1 truncate", !selected && "text-text-muted")}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 text-text-muted transition-transform duration-200", open && "rotate-180")}
        />
      </button>
      {panel}
    </>
  );
}
