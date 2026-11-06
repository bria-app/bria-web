"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeft, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProfile } from "@/hooks/useProfile";
import { useRole } from "@/hooks/useRole";
import { useNavMode } from "@/hooks/useNavMode";
import { AppMark, Wordmark } from "@/components/brand/Wordmark";
import { activeItem, navFor, type NavItem } from "./navigation";
import { openCommandPalette } from "./CommandPalette";
import { FirstStepsLauncher } from "@/features/first-steps/FirstStepsLauncher";
import { TodayPulse } from "./TodayPulse";
import { UserMenu } from "./UserMenu";

interface SidebarProps {
  /** Icons only (rail) instead of icons with labels. */
  compact: boolean;
  /** Rendered as an overlay drawer (dock mode): closes after navigating. */
  onNavigate?: () => void;
}

export function Sidebar({ compact, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { isSeller } = useRole();
  const { preferred, narrow, setMode } = useNavMode();
  const { main, footer } = navFor(isSeller);
  const current = activeItem(pathname, [...main, ...footer]);

  return (
    <nav aria-label="Navegación principal" className="flex h-full flex-col bg-surface-soft">
      <div className={cn("flex h-16 shrink-0 items-center gap-2.5 px-3.5", compact && "justify-center px-0")}>
        <AppMark />
        {!compact && <BusinessName />}
        {/* As the dock's drawer, this corner closes the drawer; it never switches the menu mode
            (that would silently replace the dock). In the sidebar it folds it to icons. */}
        {onNavigate ? (
          <button
            type="button"
            onClick={onNavigate}
            aria-label="Cerrar menú"
            title="Cerrar menú"
            className="ml-auto grid h-8 w-8 place-items-center rounded-lg text-text-muted hover:bg-surface-muted hover:text-text-primary"
          >
            <X aria-hidden className="h-4 w-4" />
          </button>
        ) : (
          !compact &&
          !narrow && (
            <button
              type="button"
              onClick={() => setMode("riel")}
              aria-label="Mostrar solo íconos"
              title="Mostrar solo íconos"
              className="ml-auto grid h-8 w-8 place-items-center rounded-lg text-text-muted hover:bg-surface-muted hover:text-text-primary"
            >
              <PanelLeft aria-hidden className="h-4 w-4" />
            </button>
          )
        )}
      </div>

      <div className={cn("shrink-0 px-3 pb-3", compact && "px-2")}>
        <button
          type="button"
          onClick={openCommandPalette}
          aria-label="Buscar o ir a… (Ctrl K)"
          className={cn(
            "flex h-10 w-full items-center gap-2 rounded-xl border border-border bg-surface px-3 text-[13px] text-text-muted transition-colors hover:border-text-muted/40",
            compact && "justify-center px-0",
          )}
        >
          <Search aria-hidden className="h-4 w-4 shrink-0" />
          {!compact && (
            <>
              <span className="flex-1 text-left">Buscar o ir a…</span>
              <kbd className="rounded-md border border-border px-1.5 font-mono text-[10px]">Ctrl K</kbd>
            </>
          )}
        </button>
      </div>

      <div className={cn("flex flex-1 flex-col gap-4 overflow-y-auto px-3 pb-3", compact && "px-2")}>
        <ul className="flex flex-col gap-0.5">
          {main.map((item) => (
            <NavLink key={item.href} item={item} active={item === current} compact={compact} onNavigate={onNavigate} />
          ))}
        </ul>
        {/* Hoy already shows the till in full. */}
        {!compact && pathname !== "/dashboard" && <TodayPulse isSeller={isSeller} onNavigate={onNavigate} />}
      </div>

      <div className={cn("shrink-0 px-3 pb-3", compact && "px-2")}>
        <FirstStepsLauncher variant={compact ? "rail" : "sidebar"} onOpen={onNavigate} />
      </div>

      <div className={cn("flex shrink-0 flex-col gap-0.5 border-t border-border px-3 py-3", compact && "px-2")}>
        <ul>
          {footer.map((item) => (
            <NavLink key={item.href} item={item} active={item === current} compact={compact} onNavigate={onNavigate} />
          ))}
        </ul>
        {compact && preferred === "riel" && (
          <button
            type="button"
            onClick={() => setMode("lateral")}
            aria-label="Mostrar nombres"
            title="Mostrar nombres"
            className="grid h-10 w-full place-items-center rounded-xl text-text-muted hover:bg-surface-muted hover:text-text-primary"
          >
            <PanelLeft aria-hidden className="h-[18px] w-[18px] rotate-180" />
          </button>
        )}
        <UserMenu compact={compact} />
      </div>
    </nav>
  );
}

function NavLink({ item, active, compact, onNavigate }: { item: NavItem; active: boolean; compact: boolean; onNavigate?: () => void }) {
  const Icon = item.icon;
  return (
    <li>
      <Link
        href={item.href}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        title={compact ? item.label : undefined}
        className={cn(
          "flex h-10 items-center gap-3 rounded-xl px-3 text-[14px] transition-colors",
          compact && "justify-center px-0",
          active
            ? "bg-surface font-semibold text-text-primary shadow-[0_1px_2px_rgb(var(--shadow-color)/0.06)]"
            : "font-medium text-text-secondary hover:bg-surface-muted hover:text-text-primary",
        )}
      >
        <Icon aria-hidden className={cn("h-[18px] w-[18px] shrink-0", active && "text-accent-text")} />
        {compact ? <span className="sr-only">{item.label}</span> : <span className="truncate">{item.label}</span>}
      </Link>
    </li>
  );
}

function BusinessName() {
  const { company } = useProfile();
  return (
    <span className="flex min-w-0 flex-col leading-tight">
      <Wordmark className="text-[19px]" />
      <span className="truncate text-[12px] text-text-muted">{company?.name ?? " "}</span>
    </span>
  );
}
