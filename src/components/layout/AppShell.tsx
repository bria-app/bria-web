"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { getRole, isAuthenticated } from "@/services/auth";
import { isSellerRoute } from "@/hooks/useRole";
import { useNavMode } from "@/hooks/useNavMode";
import { useDockSide } from "@/hooks/useDevicePref";
import { isOnboardingPending } from "@/features/onboarding/progress";
import { ToastProvider } from "@/components/ui/Toast";
import { EntryCurtain, clearEntry, peekEntry } from "@/components/brand/EntryCurtain";
import { FirstStepsPanel } from "@/features/first-steps/FirstStepsPanel";
import { FirstStepsProvider } from "@/features/first-steps/FirstStepsProvider";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { Dock } from "./Dock";
import { CreateMenu } from "./CreateMenu";
import { CommandPalette } from "./CommandPalette";
import { PageRail } from "./PageRail";
import { PageOverlayContext } from "./PageOverlay";
import { checkServerOnboarding } from "./serverOnboarding";
import { usePresence } from "./usePresence";
import { useSectionSlide } from "./useSectionSlide";
import { useSidewaysPage } from "./useSidewaysPage";

/** Layout effects commit before paint, so the guard never lets a wrong screen flash. */
const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

type Gate = "checking" | "redirecting" | "ok";

/**
 * Where this pathname should really send the person, or null if they belong here.
 * Session state only lives in localStorage, so this can only run on the client.
 */
function redirectTargetFor(pathname: string): string | null {
  if (!isAuthenticated()) return pathname === "/login" ? null : "/login";
  if (pathname === "/login") return null;
  // Sellers only run the till: anything outside their routes sends them back to it.
  if (getRole() === "seller") return isSellerRoute(pathname) ? null : "/sales/new";
  // A freshly created account goes through the welcome flow first.
  const onAppScreen = pathname !== "/welcome" && !pathname.startsWith("/premium");
  if (onAppScreen && isOnboardingPending()) return "/welcome";
  return null;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [gate, setGate] = useState<Gate>("checking");

  useIsomorphicLayoutEffect(() => {
    const target = redirectTargetFor(pathname);
    if (target && target !== pathname) {
      setGate("redirecting");
      router.replace(target);
      return;
    }
    setGate("ok");
  }, [pathname, router]);

  // An account that never finished the welcome flow and still has no products starts there.
  useEffect(() => {
    if (gate !== "ok") return;
    const onAppScreen = pathname !== "/login" && pathname !== "/welcome" && !pathname.startsWith("/premium");
    if (onAppScreen && getRole() !== "seller") void checkServerOnboarding((to) => router.replace(to));
  }, [gate, pathname, router]);

  // Neutral ground while deciding: same background as the app, so the hand-off is invisible.
  if (gate !== "ok") return <div aria-hidden className="min-h-screen bg-background" />;

  // Sign-in, checkout and the welcome flow are full-screen stages without navigation.
  if (pathname === "/login" || pathname.startsWith("/premium/") || pathname === "/welcome") {
    return <ToastProvider>{children}</ToastProvider>;
  }

  return (
    <ToastProvider>
      <Shell pathname={pathname}>{children}</Shell>
    </ToastProvider>
  );
}

/** Where the entry curtain closes: the sidebar logo, the middle of the bottom dock, or the left dock. */
function curtainOrigin(docked: boolean, dockLeft: boolean): string {
  if (dockLeft) return "52px 50%";
  return docked ? "50% 50%" : "36px 32px";
}

function Shell({ pathname, children }: { pathname: string; children: React.ReactNode }) {
  const { mode, narrow } = useNavMode();
  const [createOpen, setCreateOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const docked = mode === "dock";
  const compact = mode === "riel";
  const [dockSide] = useDockSide();
  const dockLeft = docked && dockSide === "izquierda" && !narrow;
  const dockPresence = usePresence(docked, 260);
  // Right after signing in, the sign-in page's curtain closes into the logo.
  const [entry, setEntry] = useState(peekEntry);
  useEffect(() => clearEntry(), []);

  const mainRef = useRef<HTMLElement>(null);
  const [overlay, setOverlay] = useState<HTMLDivElement | null>(null);
  const { slide, dir } = useSectionSlide(pathname, mainRef);
  const sideways = useSidewaysPage(mainRef);

  // The dock's drawer behaves like a dialog: focus moves into it and Escape closes it.
  const drawerRef = useRef<HTMLElement>(null);
  const drawerShown = docked && drawerOpen;
  useEffect(() => {
    if (!drawerShown) return;
    const opener = document.activeElement as HTMLElement | null;
    drawerRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      opener?.focus?.();
    };
  }, [drawerShown]);

  return (
    <FirstStepsProvider>
      <div className="flex h-dvh overflow-hidden bg-background">
        {/* The sidebar folds away (width to 0, content sliding out) instead of vanishing. */}
        <aside
          inert={docked}
          aria-hidden={docked || undefined}
          className={cn(
            "shrink-0 overflow-hidden border-border transition-[width] duration-300 [transition-timing-function:var(--ease-out)]",
            docked ? "w-0 border-r-0" : cn("border-r", compact ? "w-[72px]" : "w-64"),
          )}
        >
          <div
            className={cn(
              "h-full transition-transform duration-300 [transition-timing-function:var(--ease-out)]",
              compact ? "w-[72px]" : "w-64",
              docked && "-translate-x-full",
            )}
          >
            <Sidebar compact={compact} />
          </div>
        </aside>

        {drawerShown && (
          <div className="fixed inset-0 z-40">
            <button
              type="button"
              aria-label="Cerrar menú"
              onClick={() => setDrawerOpen(false)}
              className="absolute inset-0 bg-[rgb(var(--shadow-color)/0.38)]"
            />
            <aside
              ref={drawerRef}
              tabIndex={-1}
              aria-label="Menú"
              className="drawer-in absolute inset-y-0 left-0 w-72 max-w-[85vw] border-r border-border shadow-soft-xl outline-none"
            >
              <Sidebar compact={false} onNavigate={() => setDrawerOpen(false)} />
            </aside>
          </div>
        )}

        {/* `--dock-clear`: room the bottom dock takes, so sticky bars (SaveBar) and the page rail
            sit above it instead of under it. */}
        <div className={cn("relative flex min-w-0 flex-1 flex-col", docked && !dockLeft && "[--dock-clear:6rem]")}>
          <Topbar onCreate={() => setCreateOpen(true)} onOpenMenu={docked ? () => setDrawerOpen(true) : undefined} />
          <main
            ref={mainRef}
            id="contenido"
            // Down: never a sideways scroll (sliding content must not open a scrollbar). Sideways: the
            // page goes on to the right as one strip, with the rail below instead of a scrollbar.
            className={cn(
              "flex-1 px-5 py-8 transition-[padding] duration-300 lg:px-10",
              // Sideways, the room at the bottom is the rail's, so it never covers a card.
              sideways ? "strip-scroll overflow-x-auto overflow-y-hidden pb-[4.5rem]" : "overflow-y-auto overflow-x-hidden",
              docked && (dockLeft ? "pl-28 lg:pl-32" : "pb-32"),
            )}
          >
            <div
              key={pathname}
              className={cn(
                slide ? cn("page-slide", dir > 0 ? "page-slide-next" : "page-slide-prev") : "page-enter",
                sideways && "page-columns",
              )}
            >
              <PageOverlayContext.Provider value={overlay}>{children}</PageOverlayContext.Provider>
            </div>
          </main>
          {/* What floats over the page without being part of it (see PageOverlay); its first item
              starts at the page's left edge, and the rail keeps its own corner on the right. */}
          <div
            ref={setOverlay}
            className={cn(
              "pointer-events-none absolute inset-x-0 bottom-[calc(var(--dock-clear,0px)+1rem)] z-20 flex items-end px-5 pr-64 lg:px-10 lg:pr-64",
              docked && dockLeft && "pl-28 lg:pl-32",
            )}
          />
          {sideways && <PageRail scroller={mainRef} pathname={pathname} />}
        </div>

        {dockPresence.mounted && (
          <Dock onCreate={() => setCreateOpen(true)} onOpenMenu={() => setDrawerOpen(true)} leaving={dockPresence.leaving} />
        )}
        <CreateMenu open={createOpen} onClose={() => setCreateOpen(false)} />
        <CommandPalette />
        <FirstStepsPanel />
        {entry && <EntryCurtain phase="out" name={entry.name} origin={curtainOrigin(docked, dockLeft)} onDone={() => setEntry(null)} />}
      </div>
    </FirstStepsProvider>
  );
}
