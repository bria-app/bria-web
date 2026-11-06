/** TypeScript mirrors of the backend DTOs. */
import type { ProductAlert } from "./custom-fields";

// Numeric fields that the backend serializes from Decimal may arrive as number
// or string depending on the serializer; coerce with Number() when displaying.
export type Numeric = number | string;

export interface TokenDTO {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export type UserRole = "owner" | "admin" | "analyst" | "viewer" | "seller";

export interface UserDTO {
  id: string;
  company_id: string;
  /** Null for users that sign in with a username (sellers). */
  email: string | null;
  username: string | null;
  full_name: string;
  role: UserRole;
  status: string;
  last_login_at: string | null;
}

export interface CompanyDTO {
  id: string;
  name: string;
  tax_id: string;
  business_type: string;
  address: string;
  phone: string;
  email: string;
  plan: string;
  status: string;
}

export interface CategoryDTO {
  id: string;
  company_id: string;
  name: string;
  description: string;
  parent_id: string | null;
}

export interface ProductDTO {
  id: string;
  company_id: string;
  sku: string;
  name: string;
  description: string;
  category_id: string | null;
  /** Weighted-average cost. Null when the caller may not see costs (role seller). */
  unit_cost: Numeric | null;
  unit_price: Numeric;
  currency: string;
  unit_of_measure: string;
  lead_time_days: number;
  safety_stock: number;
  reorder_point: number;
  is_active: boolean;
  barcode?: string | null;
  /** Data URL (compressed JPEG) or http(s) URL. */
  image_url?: string | null;
  custom_attributes?: Record<string, string | number | boolean | null>;
  /** Cost of the latest receipt; unit_cost is the weighted-average cost. Null for sellers. */
  last_cost?: Numeric | null;
  /** Own-column alerts that fire today (Lima), ordered by column. */
  alerts?: ProductAlert[];
}

export interface SaleDTO {
  id: string;
  company_id: string;
  product_id: string;
  batch_id: string | null;
  sale_date: string;
  quantity: number;
  unit_price: Numeric;
  total_amount: Numeric;
  currency: string;
  /** POS ticket the line belongs to (null for imported history). */
  order_id?: string | null;
  seller_id?: string | null;
  seller_name?: string;
  /** Weighted-average cost at the moment of the sale. */
  unit_cost?: Numeric | null;
  /** Product labels ("" when not loaded). */
  product_name: string;
  sku: string;
}

export type MovementType = "inbound" | "outbound" | "adjustment";

export interface MovementDTO {
  id: string;
  company_id: string;
  product_id: string;
  movement_type: MovementType;
  quantity: number;
  /** Outbound movements are negative. */
  signed_quantity?: number;
  reason: string;
  occurred_at: string;
  unit_cost?: Numeric | null;
  reference_type?: string | null;
  reference_id?: string | null;
}

export interface ForecastPointDTO {
  period_date: string;
  predicted_demand: Numeric;
  lower_bound: Numeric | null;
  upper_bound: Numeric | null;
}

/** One in-sample bucket: observed demand, cleaned (stockout-imputed) and model fit. */
export interface HistoryPointDTO {
  period_date: string;
  observed: Numeric;
  cleaned: Numeric;
  fitted: Numeric | null;
  is_stockout: boolean;
}

export interface ForecastResultDTO {
  id: string;
  run_id: string;
  company_id: string;
  product_id: string;
  points: ForecastPointDTO[];
  history: HistoryPointDTO[];
}

export type KpiType =
  | "coverage_days"
  | "stockout_risk"
  | "turnover"
  | "overstock_risk";

export interface KpiDTO {
  id: string;
  company_id: string;
  product_id: string;
  kpi_type: KpiType;
  value: Numeric;
  run_id: string | null;
  computed_at: string;
}

export type RecommendationPriority = "high" | "medium" | "low";
export type RecommendationStatus = "pending" | "accepted" | "dismissed" | "superseded";

export interface RecommendationDTO {
  id: string;
  company_id: string;
  product_id: string;
  recommended_quantity: number;
  priority: RecommendationPriority;
  reason: string;
  status: RecommendationStatus;
}

export interface MessageResponse {
  message: string;
}

/** GET /notifications/unread-count */
export interface UnreadCountDTO {
  unread: number;
}

/** POST /notifications/mark-all-read */
export interface MarkAllReadDTO {
  message: string;
  /** How many notices went from unread to read. */
  updated: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

// --- Deferred modules --------------------------------------------------------
export interface NotificationDTO {
  id: string;
  company_id: string;
  title: string;
  message: string;
  severity: string;
  is_read: boolean;
  created_at: string;
}

export type ReportType = "forecast" | "kpi" | "recommendation";
export type ReportStatus = "pending" | "ready" | "failed";

export interface ReportDTO {
  id: string;
  company_id: string;
  title: string;
  report_type: ReportType;
  status: ReportStatus;
  file_path: string | null;
  params: Record<string, unknown>;
  /** When it was asked for; null only for rows not yet stored. */
  created_at: string | null;
}

export interface SubscriptionDTO {
  /** null for the implicit free plan (no subscription stored yet). */
  id: string | null;
  company_id: string;
  plan_id: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  /** Premium access right now (active, or canceled but not expired). */
  is_premium?: boolean;
  /** Renews automatically at period end. */
  auto_renew?: boolean;
}

export interface SupplierDTO {
  id: string;
  company_id: string;
  ruc: string;
  business_name: string;
  contact_name: string;
  phone: string;
  email: string;
  address: string;
  is_active: boolean;
  /** Values for the company's custom supplier columns, keyed by field key. */
  custom_attributes: Record<string, string | number | boolean | null>;
  /** Purchase figures (filled by the list endpoint). */
  total_purchased: Numeric;
  purchase_lines: number;
  last_purchase_date: string | null;
}

export interface PurchaseDTO {
  id: string;
  company_id: string;
  supplier_id: string;
  product_id: string;
  purchase_date: string;
  quantity: number;
  /** Net of IGV. */
  unit_cost: Numeric;
  total_amount: Numeric;
  currency: string;
  /** Supplier's comprobante (e.g. F001-000123). */
  document_number: string;
  notes: string;
  /** Document id the line belongs to. */
  import_batch_id: string | null;
}
