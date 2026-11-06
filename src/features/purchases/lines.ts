/** Draft lines of a purchase being registered, and the math the form shows for them. */
import type { PurchaseBatchItemInput, PurchaseCatalogItemDTO } from "@/types/purchasing";
import { IGV_RATE, round2 } from "@/lib/money";
import { centsOf, num, weightedAverage, withIgv } from "./format";

export interface Line {
  uid: string;
  mode: "existing" | "new";
  productId: string;
  /** New product only. */
  name: string;
  sku: string;
  barcode: string;
  price: string;
  quantity: string;
  unitCost: string;
}

let seq = 0;

export function newLine(patch: Partial<Line> = {}): Line {
  seq += 1;
  return { uid: `l${seq}`, mode: "existing", productId: "", name: "", sku: "", barcode: "", price: "", quantity: "1", unitCost: "", ...patch };
}

/** Starting cost for a product: what it cost last time, else its average, in the mode being typed. */
export function suggestedCost(product: PurchaseCatalogItemDTO | undefined, includeIgv: boolean): string {
  if (!product) return "";
  const base = num(product.last_cost ?? product.unit_cost);
  if (base <= 0) return "";
  return String(round2(includeIgv ? base * (1 + IGV_RATE) : base));
}

export interface ComputedLine {
  line: Line;
  product: PurchaseCatalogItemDTO | undefined;
  qty: number;
  qtyOk: boolean;
  costOk: boolean;
  productOk: boolean;
  valid: boolean;
  /** Typed quantity × typed cost (with or without IGV, as typed). */
  lineTotal: number;
  /** Line total net of IGV, rounded like the backend: round(gross × qty / 1.18, 2) with IGV. */
  netTotal: number;
  /** Cost net of IGV. */
  netCost: number;
  /** Weighted average cost after this purchase (existing products). */
  newAvg: number | null;
  /** Margin on the sale price net of IGV, using the new average cost. */
  margin: number | null;
}

export function computeLine(line: Line, product: PurchaseCatalogItemDTO | undefined, includeIgv: boolean): ComputedLine {
  const qty = Number(line.quantity);
  const cost = Number(line.unitCost);
  const qtyOk = Number.isInteger(qty) && qty > 0;
  const costOk = line.unitCost.trim() !== "" && Number.isFinite(cost) && cost >= 0;
  const productOk = line.mode === "existing" ? !!product : line.name.trim().length > 0;
  const netCost = costOk ? round2(includeIgv ? cost / (1 + IGV_RATE) : cost) : 0;
  const newAvg =
    product && qtyOk && costOk ? weightedAverage(product.stock_on_hand, num(product.unit_cost), qty, netCost) : null;
  const salePrice = line.mode === "existing" ? num(product?.unit_price) : num(line.price);
  const saleNet = salePrice / (1 + IGV_RATE);
  const costForMargin = newAvg ?? (costOk ? netCost : null);
  // Integer céntimos: the backend rounds the typed cost first, then the whole line once.
  const grossCents = qtyOk && costOk ? centsOf(cost) * qty : 0;
  const netCents = includeIgv ? Math.round(grossCents / (1 + IGV_RATE)) : grossCents;
  const margin = saleNet > 0 && costForMargin !== null ? (saleNet - costForMargin) / saleNet : null;
  return {
    line,
    product,
    qty,
    qtyOk,
    costOk,
    productOk,
    valid: qtyOk && costOk && productOk,
    lineTotal: grossCents / 100,
    netTotal: netCents / 100,
    netCost,
    newAvg,
    margin,
  };
}

export interface Totals {
  units: number;
  subtotal: number;
  igv: number;
  total: number;
}

/** Same sums as the backend: subtotal = sum of net line totals, IGV on that subtotal. */
export function totalsOf(computed: ComputedLine[]): Totals {
  const subtotal = computed.reduce((acc, c) => acc + centsOf(c.netTotal), 0) / 100;
  const { igv, total } = withIgv(subtotal);
  return { units: computed.reduce((acc, c) => acc + (c.qtyOk ? c.qty : 0), 0), subtotal, igv, total };
}

export function toBatchItems(lines: Line[]): PurchaseBatchItemInput[] {
  return lines.map((l) =>
    l.mode === "existing"
      ? { product_id: l.productId, quantity: Number(l.quantity), unit_cost: Number(l.unitCost) }
      : {
          new_product: {
            name: l.name.trim(),
            sku: l.sku.trim() || null,
            barcode: l.barcode.trim() || null,
            unit_price: l.price.trim() ? Number(l.price) : null,
          },
          quantity: Number(l.quantity),
          unit_cost: Number(l.unitCost),
        },
  );
}

/** A form with only the untouched starting row counts as empty. */
export const isBlank = (lines: Line[]) => lines.every((l) => l.mode === "existing" && !l.productId);
