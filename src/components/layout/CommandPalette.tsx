"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CornerDownLeft, LogOut, Moon, Package, Plus, Search, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { logout } from "@/services/auth";
import { productsApi } from "@/services/api/resources";
import { resolveMode, setModePref } from "@/lib/appearance";
import { useRole } from "@/hooks/useRole";
import { useCompanyId } from "@/hooks/useCompanyId";
import type { ProductDTO } from "@/types/api";
import { navFor } from "./navigation";
import { OWNER_CREATE, SELLER_CREATE } from "./createActions";

interface Command {
  id: string;
  label: string;
  hint?: string;
  group: string;
  icon: LucideIcon;
  href?: string;
  run?: () => void;
}

const OPEN_EVENT = "bria:command";
const MAX_PRODUCTS = 6;

const normalize = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Opens the palette from anywhere (sidebar search box, dock). */
export const openCommandPalette = () => window.dispatchEvent(new Event(OPEN_EVENT));

/**
 * Ctrl K: jump to a screen, start something new, or find a product by name, code (SKU) or barcode.
 * Products are fetched when the palette opens, so results are always the company's own.
 */
export function CommandPalette() {
  const router = useRouter();
  const companyId = useCompanyId();
  const { isSeller } = useRole();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [products, setProducts] = useState<ProductDTO[]>([]);
  const listRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pressedBackdrop = useRef(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_EVENT, onOpen);
    };
  }, []);

  // Native <dialog>: focus trap, Escape and focus return come from the browser.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // Sellers cannot open product records (their lookup is «Consultar inventario»), so the palette
  // only searches products for the other roles.
  useEffect(() => {
    if (!open || !companyId || isSeller) return;
    let alive = true;
    productsApi
      .list(companyId)
      .then((list) => alive && setProducts(list))
      .catch(() => alive && setProducts([]));
    return () => {
      alive = false;
    };
  }, [open, companyId, isSeller]);

  const close = () => {
    setOpen(false);
    setQuery("");
    setActive(0);
  };

  const commands = useMemo<Command[]>(() => {
    const { main, footer } = navFor(isSeller);
    const nav = [...main, ...footer].map((i) => ({ id: i.href, label: i.label, group: "Ir a", icon: i.icon, href: i.href }));
    const create = (isSeller ? SELLER_CREATE : OWNER_CREATE).map((a) => ({
      id: `crear-${a.key}`,
      label: a.command,
      hint: a.hint,
      group: "Crear",
      icon: Plus,
      href: a.href,
    }));
    const actions: Command[] = [
      {
        id: "tema",
        label: "Cambiar tema claro / oscuro",
        group: "Acciones",
        icon: Moon,
        run: () => setModePref(resolveMode(document.documentElement.getAttribute("data-mode") === "dark" ? "light" : "dark")),
      },
      {
        id: "salir",
        label: "Cerrar sesión",
        group: "Acciones",
        icon: LogOut,
        run: () => {
          logout();
          router.replace("/login");
        },
      },
    ];
    return [...nav, ...create, ...actions];
  }, [isSeller, router]);

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return commands;
    const found = commands.filter((c) => normalize(`${c.label} ${c.group}`).includes(q));
    const productHits: Command[] = products
      .filter((p) => normalize(`${p.name} ${p.sku} ${p.barcode ?? ""}`).includes(q))
      .slice(0, MAX_PRODUCTS)
      .map((p) => ({ id: `p-${p.id}`, label: p.name, hint: p.sku, group: "Productos", icon: Package, href: `/inventory/${p.id}` }));
    return [...productHits, ...found];
  }, [commands, products, query]);

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const execute = (c: Command | undefined) => {
    if (!c) return;
    close();
    if (c.run) c.run();
    else if (c.href) router.push(c.href);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(filtered.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      execute(filtered[active]);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-label="Buscar o ir a"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onPointerDown={(e) => {
        pressedBackdrop.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && pressedBackdrop.current) close();
        pressedBackdrop.current = false;
      }}
      className="modal mx-auto mt-[12vh] w-[calc(100%-2rem)] max-w-xl overflow-hidden rounded-3xl border border-border bg-surface p-0 text-text-primary shadow-soft-xl"
    >
      {open && (
        <div onKeyDown={onKeyDown}>
          <div className="flex items-center gap-3 border-b border-border px-5">
            <Search aria-hidden className="h-[18px] w-[18px] shrink-0 text-text-muted" />
            <input
              autoFocus
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              role="combobox"
              aria-expanded
              aria-controls="palette-results"
              aria-activedescendant={filtered[active] ? `palette-${filtered[active].id}` : undefined}
              aria-label={
                isSeller
                  ? "Busca una pantalla o una acción"
                  : "Busca una pantalla, una acción o un producto por nombre, código (SKU) o código de barras"
              }
              placeholder={isSeller ? "Pantalla o acción" : "Pantalla, acción, producto o código"}
              className="h-14 w-full bg-transparent text-[15px] outline-none placeholder:text-text-muted"
            />
            <kbd className="hidden rounded-md border border-border px-1.5 py-0.5 font-mono text-[10px] text-text-muted sm:inline">Esc</kbd>
          </div>

          <div ref={listRef} id="palette-results" role="listbox" className="max-h-[52vh] overflow-y-auto p-2">
            {filtered.length === 0 && <p className="px-3 py-10 text-center text-sm text-text-muted">Nada coincide con «{query}».</p>}
            {filtered.map((c, i) => {
              const showGroup = c.group !== filtered[i - 1]?.group;
              const Icon = c.icon;
              const isActive = i === active;
              return (
                <div key={c.id}>
                  {showGroup && (
                    <p className="px-3 pb-1.5 pt-3 text-[11px] font-bold uppercase tracking-[0.08em] text-text-muted">{c.group}</p>
                  )}
                  <button
                    type="button"
                    id={`palette-${c.id}`}
                    role="option"
                    aria-selected={isActive}
                    data-index={i}
                    tabIndex={-1}
                    onMouseMove={() => setActive(i)}
                    onClick={() => execute(c)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm",
                      isActive ? "bg-surface-muted text-text-primary" : "text-text-secondary",
                    )}
                  >
                    <Icon aria-hidden className={cn("h-4 w-4 shrink-0", isActive ? "text-accent-text" : "text-text-muted")} />
                    <span className="min-w-0 flex-1 truncate font-medium">{c.label}</span>
                    {c.hint && (
                      // SKUs line up in mono; the «Crear» hints are prose.
                      <span className={cn("max-w-[45%] shrink-0 truncate text-[12px] text-text-muted", c.group === "Productos" && "font-mono")}>
                        {c.hint}
                      </span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Keyboard hints: only where there is a keyboard-sized screen. */}
          <div className="hidden items-center gap-4 border-t border-border bg-surface-soft px-5 py-2.5 text-[11px] text-text-muted sm:flex">
            <span>↑ ↓ para moverte</span>
            <span className="flex items-center gap-1.5">
              <CornerDownLeft aria-hidden className="h-3 w-3" /> para abrir
            </span>
            <span className="ml-auto">Ctrl K desde cualquier pantalla</span>
          </div>
        </div>
      )}
    </dialog>
  );
}
