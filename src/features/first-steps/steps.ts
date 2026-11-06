import { PackagePlus, ScanBarcode, ShoppingCart, Sparkles, Store, Truck, Users, type LucideIcon } from "lucide-react";

export type FirstStepId = "setup" | "products" | "sale" | "supplier" | "purchase" | "team" | "forecast";

/** What the app knows about the shop, from real endpoints. */
export interface ShopProgress {
  setupDone: boolean;
  /** A step was saved in /welcome but the setup was left for later. */
  setupStarted: boolean;
  products: number;
  tickets: number;
  suppliers: number;
  purchases: number;
  people: number;
  forecasts: number;
}

export interface FirstStep {
  id: FirstStepId;
  icon: LucideIcon;
  title: string;
  /** Why it matters, in one sentence. */
  why: string;
  how: string[];
  minutes: number;
  optional?: boolean;
  cta: { label: string; href: string };
  alt?: { label: string; href: string };
  done: boolean;
}

export function buildSteps(p: ShopProgress): FirstStep[] {
  return [
    {
      id: "setup",
      icon: Store,
      title: "Configura tu tienda",
      why: "Tu rubro, los datos de tus boletas y las columnas que usarás en tus productos.",
      how: ["Elige tu rubro", "Completa dirección y teléfono", "Activa las columnas que te sirven"],
      minutes: 5,
      cta: { label: p.setupStarted ? "Seguir donde lo dejé" : "Empezar", href: "/welcome" },
      done: p.setupDone,
    },
    {
      id: "products",
      icon: PackagePlus,
      title: "Agrega tus productos",
      why: "Sin productos no hay caja ni inventario que cuidar.",
      how: ["Sube tu Excel tal como lo tienes", "O créalos uno por uno, con foto"],
      minutes: 5,
      cta: { label: "Importar mi Excel", href: "/inventory/import" },
      alt: { label: "Crear uno a mano", href: "/inventory?nuevo=1" },
      done: p.products > 0,
    },
    {
      id: "sale",
      icon: ScanBarcode,
      title: "Cobra tu primera venta",
      why: "Ves la caja en acción y tu inventario baja solo.",
      how: ["Busca o escanea el producto", "Elige cómo te pagan", "Emite boleta, factura o nota de venta"],
      minutes: 1,
      cta: { label: "Abrir la caja", href: "/sales/new" },
      done: p.tickets > 0,
    },
    {
      id: "supplier",
      icon: Truck,
      title: "Anota a un proveedor",
      why: "Sabrás a quién comprarle cada cosa y cuánto tarda en llegar.",
      how: ["Su RUC y cómo contactarlo", "Qué productos te vende"],
      minutes: 2,
      cta: { label: "Agregar proveedor", href: "/suppliers?nuevo=1" },
      done: p.suppliers > 0,
    },
    {
      id: "purchase",
      icon: ShoppingCart,
      title: "Registra una compra",
      why: "Lo que te llega sube tu inventario y actualiza lo que te cuesta cada producto.",
      how: ["Elige al proveedor y el comprobante", "Agrega productos, cantidades y costos"],
      minutes: 3,
      cta: { label: "Registrar compra", href: "/purchases/new" },
      done: p.purchases > 0,
    },
    {
      id: "team",
      icon: Users,
      title: "Suma a tu equipo",
      why: "Cada vendedor cobra con su propio usuario y nunca ve tus costos.",
      how: ["Nombre y apellido", "Le das su usuario y contraseña"],
      minutes: 2,
      optional: true,
      cta: { label: "Crear usuario", href: "/settings?seccion=equipo" },
      done: p.people > 1,
    },
    {
      id: "forecast",
      icon: Sparkles,
      title: "Mira tu primer pronóstico",
      why: "bria calcula cuánto venderás y qué te conviene comprar.",
      how: ["Usa tus ventas de la caja o las de tu Excel", "Mientras más semanas, más preciso"],
      minutes: 1,
      cta: { label: "Ver pronóstico", href: "/forecasting" },
      done: p.forecasts > 0,
    },
  ];
}
