"use client";

import { useDevicePref } from "@/hooks/useDevicePref";

const STATES = ["nuevo", "visto"] as const;
export type TourState = (typeof STATES)[number];

/**
 * Whether this device already met «Cómo predice bria.»: the first time the forecast screen
 * invites to it; after it was opened or dismissed it only lives in quiet places (the
 * «¿Cómo funciona?» dialog and Configuración › Plan).
 */
export const usePredictionTourState = () => useDevicePref<TourState>("bria-tour-prediccion", STATES, "nuevo");
