"use client";

import { useEffect, useState } from "react";

/**
 * Keeps something mounted for `ms` after it should go, so it can play an exit animation.
 * `leaving` is true during that time.
 */
export function usePresence(show: boolean, ms: number): { mounted: boolean; leaving: boolean } {
  const [state, setState] = useState({ mounted: show, leaving: false });
  if (show && (!state.mounted || state.leaving)) setState({ mounted: true, leaving: false });
  if (!show && state.mounted && !state.leaving) setState({ mounted: true, leaving: true });

  useEffect(() => {
    if (!state.leaving) return;
    const id = window.setTimeout(() => setState({ mounted: false, leaving: false }), ms);
    return () => window.clearTimeout(id);
  }, [state.leaving, ms]);

  return state;
}
