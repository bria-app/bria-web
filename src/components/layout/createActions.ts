import { FileSpreadsheet, Package, ScanBarcode, ShoppingCart, Truck, type LucideIcon } from "lucide-react";

export interface CreateAction {
  label: string;
  /** How the command palette names it («Crear producto», «Importar Excel»). */
  command: string;
  hint: string;
  href: string;
  icon: LucideIcon;
  /** Single-letter shortcut while the «Crear» menu is open. */
  key: string;
}

/** Everything «Crear» can start. Each entry opens a screen or form that saves to the API. */
export const OWNER_CREATE: CreateAction[] = [
  { label: "Venta", command: "Nueva venta", hint: "Abre la caja", href: "/sales/new", icon: ScanBarcode, key: "v" },
  { label: "Compra", command: "Registrar compra", hint: "Registra mercadería que llegó", href: "/purchases/new", icon: ShoppingCart, key: "c" },
  { label: "Producto", command: "Crear producto", hint: "Nombre, precio e inventario", href: "/products?nuevo=1", icon: Package, key: "p" },
  { label: "Proveedor", command: "Agregar proveedor", hint: "RUC, contacto y productos", href: "/suppliers?nuevo=1", icon: Truck, key: "r" },
  { label: "Importar Excel", command: "Importar Excel", hint: "Tal como lo llevas", href: "/inventory/import", icon: FileSpreadsheet, key: "i" },
];

export const SELLER_CREATE: CreateAction[] = [OWNER_CREATE[0]];
