import type { ComponentType } from "react";
import { ForecastScene } from "./ForecastScene";
import { ScannerScene } from "./ScannerScene";
import { ShelfScene } from "./ShelfScene";

export interface LoginScene {
  id: "vitrina" | "caja" | "pronostico";
  title: string;
  text: string;
  points: string[];
  Visual: ComponentType;
}

/** Three ways into bria., one per visit: what it does for the shop, shown instead of told. */
export const LOGIN_SCENES: LoginScene[] = [
  {
    id: "vitrina",
    title: "Decide con brío.",
    text: "Ventas, inventario y pronóstico para tu bodega, tu tienda de ropa o tu ferretería.",
    points: ["Vende y cobra", "Sabe qué comprar", "A tu medida"],
    Visual: ShelfScene,
  },
  {
    id: "caja",
    title: "Cobra en segundos.",
    text: "Escanea, suma y entrega boleta o factura. El inventario baja solo con cada venta.",
    points: ["Boleta y factura", "Yape, Plin y efectivo", "Inventario al día"],
    Visual: ScannerScene,
  },
  {
    id: "pronostico",
    title: "Compra antes de que se acabe.",
    text: "bria mira tus ventas pasadas y te dice cuánto pedir y cuándo, producto por producto.",
    points: ["Pronóstico por producto", "Cuándo pedir", "Cuánto te alcanza"],
    Visual: ForecastScene,
  },
];

const KEY = "bria:login-scene";

/** The next scene in turn (by the one shown last in this browser). Read-only: safe to call twice. */
export function pickLoginScene(): number {
  try {
    const last = Number(window.localStorage.getItem(KEY) ?? -1);
    return Number.isInteger(last) && last >= 0 ? (last + 1) % LOGIN_SCENES.length : 0;
  } catch {
    return Math.floor(Math.random() * LOGIN_SCENES.length);
  }
}

/** Remembers the scene shown, so the next visit moves on to another one. */
export function rememberLoginScene(index: number): void {
  try {
    window.localStorage.setItem(KEY, String(index));
  } catch {
    /* storage blocked: scenes are picked at random instead */
  }
}
