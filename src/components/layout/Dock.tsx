"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Plus, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDockSide } from "@/hooks/useDevicePref";
import { useNavMode } from "@/hooks/useNavMode";
import { useRole } from "@/hooks/useRole";
import { OWNER_DOCK, SELLER_DOCK, activeItem, navFor, type NavItem } from "./navigation";

interface DockProps {
  onCreate: () => void;
  onOpenMenu: () => void;
  /** Playing its exit (the menu mode just changed away from the dock). */
  leaving?: boolean;
}

/**
 * Counter mode and narrow screens: big targets at the bottom, «Crear» in the middle.
 * «Simple» keeps a few shortcuts and a «Todo» drawer; «Completo» carries every section of the
 * sidebar (the drawer is then only for the account: theme, sign out).
 */
export function Dock({ onCreate, onOpenMenu, leaving = false }: DockProps) {
  const pathname = usePathname();
  const { isSeller } = useRole();
  const { dockStyle, narrow } = useNavMode();
  const [side] = useDockSide();
  const { main, footer } = navFor(isSeller);
  const full = dockStyle === "completo";
  // A phone keeps the dock at the bottom: a left column would eat a third of the screen.
  const left = side === "izquierda" && !narrow;

  const items: NavItem[] = full
    ? [...main, ...footer]
    : (isSeller ? SELLER_DOCK : OWNER_DOCK)
        .map((href) => main.find((i) => i.href === href))
        .filter((i): i is NavItem => Boolean(i));
  const current = activeItem(pathname, [...main, ...footer]);
  const half = Math.ceil(items.length / 2);

  const link = (item: NavItem) => {
    const Icon = item.icon;
    const active = item === current;
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? "page" : undefined}
        title={item.label}
        className={cn(
          "flex h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[10px] font-semibold transition-colors",
          left ? "h-14 min-h-11 w-16 shrink" : full ? "w-[66px] shrink" : "flex-1 sm:min-w-[64px] sm:flex-none sm:px-2",
          active ? "bg-strong-foreground/10 text-accent-on-strong" : "text-strong-foreground/70 hover:text-strong-foreground",
        )}
      >
        <Icon aria-hidden className="h-5 w-5 shrink-0" />
        <span className="max-w-full truncate">{item.short ?? item.label}</span>
      </Link>
    );
  };

  const MenuIcon = full ? UserRound : LayoutGrid;

  return (
    <nav
      // Re-keyed so switching simple ⇄ complete or bottom ⇄ left replays a smooth entrance.
      key={`${dockStyle}-${left ? "left" : "bottom"}`}
      aria-label="Accesos rápidos"
      inert={leaving}
      className={cn(
        leaving && (left ? "dock-out-left" : "dock-out"),
        "fixed z-30 flex items-center gap-0.5 rounded-[26px] border border-strong-foreground/10 bg-strong p-1.5 shadow-soft-xl sm:gap-1",
        left
          ? "dock-in-left left-4 top-1/2 max-h-[calc(100vh-2rem)] -translate-y-1/2 flex-col"
          : cn(
              "dock-in bottom-4 left-1/2 -translate-x-1/2",
              full ? "w-max max-w-[calc(100vw-1.5rem)]" : "w-[calc(100vw-1.5rem)] max-w-[420px] sm:w-max sm:max-w-none",
            ),
      )}
    >
      {items.slice(0, half).map(link)}
      {!isSeller && (
        <button
          type="button"
          onClick={onCreate}
          aria-label="Crear"
          className={cn(
            "grid h-14 w-14 shrink-0 place-items-center rounded-[20px] bg-primary text-on-primary transition-[background-color,transform] duration-150 hover:bg-primary-hover active:scale-95 sm:h-[62px] sm:w-[62px] sm:rounded-[21px]",
            left ? "my-1" : "mx-0.5 sm:mx-1",
          )}
        >
          <Plus aria-hidden className="h-7 w-7" />
        </button>
      )}
      {items.slice(half).map(link)}
      <span aria-hidden className={cn("shrink-0 bg-strong-foreground/15", left ? "my-0.5 h-px w-8" : "mx-0.5 h-8 w-px")} />
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label={full ? "Tu cuenta" : "Todo el menú"}
        className={cn(
          "flex h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-2xl text-[10px] font-semibold text-strong-foreground/70 transition-colors hover:text-strong-foreground",
          left ? "h-14 min-h-11 w-16 shrink" : full ? "w-[58px] shrink" : "flex-1 sm:min-w-[58px] sm:flex-none",
        )}
      >
        <MenuIcon aria-hidden className="h-5 w-5 shrink-0" />
        {full ? "Cuenta" : "Todo"}
      </button>
    </nav>
  );
}
