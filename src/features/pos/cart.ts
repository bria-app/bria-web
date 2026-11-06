import type { CatalogProduct } from "@/types/pos";
import { round2 } from "@/lib/money";
import { splitIgv } from "./peru";

export interface CartLine {
  product: CatalogProduct;
  quantity: number;
  /** Kept as text so the cashier can type freely ("12.", "") without the input jumping. */
  unitPrice: string;
  /** Absolute amount in soles taken off the line (the backend stores it per line). */
  discount: string;
}

export const toNumber = (v: string | number | null | undefined) => {
  const n = Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};

/** Keeps digits and one decimal separator, for money inputs. */
export const moneyInput = (raw: string) => raw.replace(/[^\d.,]/g, "");

export function lineGross(line: CartLine): number {
  return round2(line.quantity * toNumber(line.unitPrice));
}

export function lineTotal(line: CartLine): number {
  return Math.max(0, round2(lineGross(line) - toNumber(line.discount)));
}

/** Discount amount for a percentage of the line, as the text the input holds. */
export function percentDiscount(line: CartLine, pct: number): string {
  return pct ? round2((lineGross(line) * pct) / 100).toFixed(2) : "";
}

export function cartTotals(lines: CartLine[]) {
  const gross = round2(lines.reduce((acc, l) => acc + lineGross(l), 0));
  const total = lines.reduce((acc, l) => acc + lineTotal(l), 0);
  const units = lines.reduce((acc, l) => acc + l.quantity, 0);
  return { ...splitIgv(total), gross, discount: round2(gross - round2(total)), units };
}

export function newLine(product: CatalogProduct): CartLine {
  return { product, quantity: 1, unitPrice: toNumber(product.unit_price).toFixed(2), discount: "" };
}
