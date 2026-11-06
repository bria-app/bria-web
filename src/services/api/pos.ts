/** POS (Nueva venta), Ventas and lost sales API. */
import { ApiError, apiClient } from "@/services/api/client";
import { queryString as qs } from "./query";
import type {
  CatalogProduct,
  CreateSalesOrderBody,
  LostSale,
  SalesOrder,
  SalesOrderFilters,
  SalesOrderPage,
  SalesSummary,
  StockShortage,
} from "@/types/pos";

const base = (companyId: string) => `/companies/${companyId}`;

/** Checkout failure that keeps the backend's `details` (e.g. stock shortages on 409). */
export class CheckoutError extends ApiError {
  constructor(
    message: string,
    status: number,
    code: string | undefined,
    public readonly shortages: StockShortage[],
  ) {
    super(message, status, code);
    this.name = "CheckoutError";
  }
}

/** Shortages the API lists in `details.items` when a sale asks for more than there is. */
function shortagesOf(details: unknown): StockShortage[] {
  const items = details && typeof details === "object" ? (details as { items?: unknown }).items : undefined;
  return Array.isArray(items) ? (items as StockShortage[]) : [];
}

async function postCheckout(companyId: string, body: CreateSalesOrderBody): Promise<SalesOrder> {
  try {
    return await apiClient.post<SalesOrder>(`${base(companyId)}/sales-orders`, body);
  } catch (err) {
    if (err instanceof ApiError) throw new CheckoutError(err.message, err.status, err.code, shortagesOf(err.details));
    throw err;
  }
}

export const posApi = {
  /** Exact barcode / SKU match (case-insensitive). 404 when nothing matches. */
  lookup: (companyId: string, code: string) =>
    apiClient.get<CatalogProduct>(`${base(companyId)}/sales-orders/lookup${qs({ code })}`),
  /** Active products by name / SKU / barcode / category, with stock on hand. */
  catalog: (companyId: string, q = "", limit = 20) =>
    apiClient.get<CatalogProduct[]>(`${base(companyId)}/sales-orders/catalog${qs({ q, limit })}`),
  checkout: postCheckout,
  list: (companyId: string, filters: SalesOrderFilters = {}) =>
    apiClient.get<SalesOrderPage>(
      `${base(companyId)}/sales-orders${qs(filters as Record<string, string | number | undefined>)}`,
    ),
  summary: (companyId: string, params: { date_from?: string; date_to?: string; seller_id?: string } = {}) =>
    apiClient.get<SalesSummary>(`${base(companyId)}/sales-orders/summary${qs(params)}`),
  get: (companyId: string, orderId: string) =>
    apiClient.get<SalesOrder>(`${base(companyId)}/sales-orders/${orderId}`),
  void: (companyId: string, orderId: string, reason = "") =>
    apiClient.post<SalesOrder>(`${base(companyId)}/sales-orders/${orderId}/void`, { reason }),
};

export interface SalesImportRowBody {
  row: number;
  code?: string;
  barcode?: string;
  name?: string;
  sale_date: string;
  quantity: string;
  unit_price?: string;
  seller_name?: string;
  document_number?: string;
  payment_method?: string;
  client_name?: string;
  client_doc?: string;
}

export interface SalesImportResult {
  batch_id: string | null;
  created: number;
  tickets: number;
  units: number;
  revenue: string | number;
  period_start: string | null;
  period_end: string | null;
  products: number;
  errors: { row: number; message: string }[];
}

/**
 * Sales from a spreadsheet. `affectStock=false` loads past sales as history (no stock
 * movement); `true` registers bulk sales that take stock out (rows over stock are rejected).
 */
export const salesHistoryApi = {
  import: (companyId: string, rows: SalesImportRowBody[], opts: { affectStock?: boolean; allowDuplicates?: boolean } = {}) =>
    apiClient.post<SalesImportResult>(`${base(companyId)}/sales/import`, {
      rows,
      affect_stock: opts.affectStock ?? false,
      allow_duplicates: opts.allowDuplicates ?? false,
    }),
};

export const lostSalesApi = {
  record: (companyId: string, body: { product_id: string; requested_quantity: number; available_quantity: number }) =>
    apiClient.post<LostSale>(`${base(companyId)}/lost-sales`, { ...body, source: "pos" }),
};
