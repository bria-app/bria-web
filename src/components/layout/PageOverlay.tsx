"use client";

import { createContext, useContext } from "react";

/**
 * A layer over the page, inside the shell, for what floats above the content and must not take
 * part in it: how much of a list is on screen, the bar for customizing Hoy. Whatever is portaled
 * here stays put while the page moves, whichever way it runs.
 */
export const PageOverlayContext = createContext<HTMLElement | null>(null);

export const usePageOverlay = () => useContext(PageOverlayContext);
