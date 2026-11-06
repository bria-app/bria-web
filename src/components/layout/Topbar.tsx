"use client";

import { usePathname } from "next/navigation";
import { Menu, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRole } from "@/hooks/useRole";
import { activeItem, navFor } from "./navigation";
import { NotificationsMenu } from "./NotificationsMenu";
import { FirstStepsLauncher } from "@/features/first-steps/FirstStepsLauncher";

interface TopbarProps {
  onCreate: () => void;
  /** Present in dock mode: opens the full menu as a drawer. */
  onOpenMenu?: () => void;
}

/** Subpages with a fixed address get their own name; records (/inventory/<id>) are «Detalle». */
const SUBPAGE_LABEL: Record<string, string> = {
  "/inventory/import": "Importar",
  "/purchases/new": "Nueva compra",
};

/** Section breadcrumb on the left; avisos and «Crear» on the right. */
export function Topbar({ onCreate, onOpenMenu }: TopbarProps) {
  const pathname = usePathname();
  const { isSeller } = useRole();
  const { main, footer } = navFor(isSeller);
  const item = activeItem(pathname, [...main, ...footer]);
  const isDetail = item && pathname !== item.href && !(item.matches ?? []).includes(pathname);

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-2 border-b border-border bg-background/85 px-5 backdrop-blur-md sm:gap-3 lg:px-10">
      {onOpenMenu && (
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Abrir menú"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border bg-surface text-text-secondary transition-colors hover:text-text-primary"
        >
          <Menu aria-hidden className="h-[18px] w-[18px]" />
        </button>
      )}
      <nav aria-label="Ubicación" className="min-w-0 flex-1">
        <ol className="flex min-w-0 items-center gap-2 text-sm">
          <li className={cn("truncate", isDetail ? "text-text-muted" : "font-semibold text-text-primary")}>{item?.label ?? "bria."}</li>
          {isDetail && (
            <>
              <li aria-hidden className="shrink-0 text-text-muted">/</li>
              <li aria-current="page" className="truncate font-semibold text-text-primary">{SUBPAGE_LABEL[pathname] ?? "Detalle"}</li>
            </>
          )}
        </ol>
      </nav>
      {onOpenMenu && <FirstStepsLauncher variant="topbar" />}
      <NotificationsMenu />
      {!isSeller && (
        <button
          type="button"
          onClick={onCreate}
          aria-haspopup="dialog"
          // With the dock, «Crear» already sits in its middle: on a phone the header leaves it there.
          className={cn("btn btn-primary h-10 shrink-0 gap-1.5 px-4 text-sm", onOpenMenu && "max-sm:hidden")}
        >
          <Plus aria-hidden className="h-[18px] w-[18px]" />
          Crear
        </button>
      )}
    </header>
  );
}
