import {
  Archive, BarChart3, Home, Receipt, ScanBarcode, Search, Settings, ShoppingCart, Sparkles, Truck, type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Other routes that belong to this section (they light it up in the sidebar). */
  matches?: string[];
  /** Short label for the dock, where space is tight. */
  short?: string;
}

/**
 * One source of truth for the sidebar, the dock, the header title and the command palette.
 * Each item points at a screen that exists and talks to real endpoints.
 */
export const OWNER_NAV: NavItem[] = [
  { label: "Hoy", href: "/dashboard", icon: Home },
  { label: "Caja", href: "/sales/new", icon: ScanBarcode },
  { label: "Ventas", href: "/sales", icon: Receipt },
  { label: "Compras", href: "/purchases", icon: ShoppingCart },
  { label: "Inventario", href: "/inventory", icon: Archive, matches: ["/products"] },
  { label: "Proveedores", href: "/suppliers", icon: Truck, short: "Proveed." },
  { label: "Pronóstico", href: "/forecasting", icon: Sparkles },
  { label: "Reportes", href: "/reports", icon: BarChart3 },
];

export const OWNER_FOOTER_NAV: NavItem[] = [{ label: "Configuración", href: "/settings", icon: Settings, short: "Ajustes" }];

/** Sellers (cashiers) only run the till, see their sales and look up what is left. */
export const SELLER_NAV: NavItem[] = [
  { label: "Caja", href: "/sales/new", icon: ScanBarcode },
  { label: "Mis ventas", href: "/sales", icon: Receipt, short: "Ventas" },
  { label: "Consultar inventario", href: "/sales/stock", icon: Search, short: "Inventario" },
];

/** Default dock shortcuts (counter mode and narrow screens): the most frequent screens. */
export const OWNER_DOCK = ["/dashboard", "/sales/new", "/inventory", "/forecasting"];
export const SELLER_DOCK = ["/sales/new", "/sales", "/sales/stock"];

export function navFor(isSeller: boolean) {
  return { main: isSeller ? SELLER_NAV : OWNER_NAV, footer: isSeller ? [] : OWNER_FOOTER_NAV };
}

/** The item whose route (or one of its `matches`) is the longest prefix of the pathname. */
export function activeItem(pathname: string, items: NavItem[]): NavItem | undefined {
  const hits = items.flatMap((item) =>
    [item.href, ...(item.matches ?? [])]
      .filter((route) => pathname === route || pathname.startsWith(route + "/"))
      .map((route) => ({ item, length: route.length })),
  );
  hits.sort((a, b) => b.length - a.length);
  return hits[0]?.item;
}
