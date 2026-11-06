"use client";

import { useSyncExternalStore } from "react";
import { getRole, subscribeToSession } from "@/services/auth";

/** Routes a seller (cashier) may open. Everything else redirects to the till. */
const SELLER_ROUTES = ["/sales/new", "/sales", "/sales/stock", "/notifications", "/login"];

export function isSellerRoute(pathname: string): boolean {
  return SELLER_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"));
}

/** The signed-in role from the session token (null on the server, so hydration matches). */
export function useRole() {
  const role = useSyncExternalStore(subscribeToSession, getRole, () => null);
  return {
    role,
    isSeller: role === "seller",
    isAdmin: role === "owner" || role === "admin",
  };
}
