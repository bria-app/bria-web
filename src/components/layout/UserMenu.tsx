"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronUp, LogOut, Monitor, Moon, Sun, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { logout } from "@/services/auth";
import { resolveMode, setModePref } from "@/lib/appearance";
import { initialsOf, useProfile } from "@/hooks/useProfile";
import { useRole } from "@/hooks/useRole";
import { useNavMode } from "@/hooks/useNavMode";
import { useDismiss } from "./useDismiss";

const ROLE_LABEL: Record<string, string> = {
  owner: "Dueño",
  admin: "Administrador",
  analyst: "Analista",
  viewer: "Lector",
  seller: "Vendedor",
};

interface MenuAction {
  label: string;
  icon: LucideIcon;
  run: () => void;
}

/** The account button at the foot of the sidebar: theme, counter mode and sign out. */
export function UserMenu({ compact }: { compact: boolean }) {
  const router = useRouter();
  const { user } = useProfile();
  const { role } = useRole();
  const { preferred, narrow, setMode } = useNavMode();
  const [open, setOpen] = useState(false);
  // In the icon rail the sidebar clips anything wider than 72px, so the menu opens beside the
  // button as a fixed layer instead of above it.
  const [railPos, setRailPos] = useState<{ left: number; bottom: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);

  // Read when the menu renders its items, i.e. after a click, never during the first paint.
  const dark = open && document.documentElement.getAttribute("data-mode") === "dark";
  const counterMode = preferred === "dock";

  const actions: MenuAction[] = [
    { label: dark ? "Tema claro" : "Tema oscuro", icon: dark ? Sun : Moon, run: () => setModePref(resolveMode(dark ? "light" : "dark")) },
    ...(narrow
      ? []
      : [{ label: counterMode ? "Salir del modo mostrador" : "Modo mostrador", icon: Monitor, run: () => setMode(counterMode ? "lateral" : "dock") }]),
    {
      label: "Cerrar sesión",
      icon: LogOut,
      run: () => {
        logout();
        router.replace("/login");
      },
    },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={(e) => {
          if (compact) {
            const r = e.currentTarget.getBoundingClientRect();
            setRailPos({ left: r.right + 8, bottom: window.innerHeight - r.bottom });
          }
          setOpen((v) => !v);
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={compact ? "Tu cuenta" : undefined}
        className={cn(
          "flex h-12 w-full items-center gap-2.5 rounded-xl px-2 text-left hover:bg-surface-muted",
          compact && "justify-center px-0",
        )}
      >
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary-soft text-[12px] font-bold text-accent-text">
          {initialsOf(user?.full_name)}
        </span>
        {!compact && (
          <>
            <span className="flex min-w-0 flex-1 flex-col leading-tight">
              <span className="truncate text-[13px] font-semibold text-text-primary">{user?.full_name ?? " "}</span>
              <span className="text-[12px] text-text-muted">{role ? (ROLE_LABEL[role] ?? role) : ""}</span>
            </span>
            <ChevronUp aria-hidden className={cn("h-4 w-4 text-text-muted transition-transform", !open && "rotate-180")} />
          </>
        )}
      </button>
      {open && (
        <div
          role="menu"
          aria-label="Tu cuenta"
          style={compact && railPos ? { left: railPos.left, bottom: railPos.bottom } : undefined}
          className={cn(
            "pop-in z-50 w-60 rounded-2xl border border-border bg-surface p-1.5 shadow-soft-xl",
            compact && railPos ? "fixed" : "absolute bottom-14 left-0",
          )}
        >
          {actions.map(({ label, icon: Icon, run }) => (
            <button
              key={label}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                run();
              }}
              className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-[13px] font-medium text-text-primary hover:bg-surface-muted"
            >
              <Icon aria-hidden className="h-4 w-4 text-text-muted" />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
