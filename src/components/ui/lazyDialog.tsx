"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

/**
 * True from the first time `open` is true. A dialog loaded with `next/dynamic` renders only
 * once this is true, so its code downloads when someone opens it, and then it stays mounted
 * so the native <dialog> can close normally and give the focus back to the button.
 */
export function useOpenedOnce(open: boolean): boolean {
  const [opened, setOpened] = useState(open);
  if (open && !opened) setOpened(true);
  return opened || open;
}

/** Shown for the moment a lazily loaded dialog takes to arrive (above the bottom dock, `--dock-clear`). */
export function DialogLoading() {
  return (
    <div role="status" className="fixed inset-x-0 bottom-[calc(var(--dock-clear,0px)+1.5rem)] z-50 mx-auto flex w-max items-center gap-2 rounded-xl bg-strong px-4 py-2.5 text-sm text-strong-foreground shadow-soft-lg">
      <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> Abriendo…
    </div>
  );
}
