"use client";

import { useSyncExternalStore } from "react";
import { getCompanyId, subscribeToSession } from "@/services/auth";

/** The current company id from the session token (null on the server and when signed out). */
export function useCompanyId(): string | null {
  return useSyncExternalStore(subscribeToSession, getCompanyId, () => null);
}
