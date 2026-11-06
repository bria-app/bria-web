/** Typed API functions per resource. Company-scoped calls take a companyId. */
import { apiClient } from "./client";
import { forget } from "./cache";
import { queryString as qs } from "./query";
import type {
  CategoryDTO,
  CompanyDTO,
  ForecastResultDTO,
  KpiDTO,
  MarkAllReadDTO,
  MessageResponse,
  MovementDTO,
  NotificationDTO,
  PaginatedResponse,
  ProductDTO,
  RecommendationDTO,
  ReportDTO,
  ReportType,
  SaleDTO,
  SubscriptionDTO,
  SupplierDTO,
  UnreadCountDTO,
  UserDTO,
} from "@/types/api";

const base = (companyId: string) => `/companies/${companyId}`;

export const authApi = {
  me: () => apiClient.get<UserDTO>("/auth/me"),
};

export const companiesApi = {
  get: (companyId: string) => apiClient.get<CompanyDTO>(`/companies/${companyId}`),
  /** Also clears the cached company (`useProfile`), so every screen shows the new data. */
  update: async (companyId: string, body: Partial<Pick<CompanyDTO, "name" | "business_type" | "email" | "phone" | "address">>) => {
    const company = await apiClient.patch<CompanyDTO>(`/companies/${companyId}`, body);
    forget(`/companies/${companyId}`);
    return company;
  },
};

export const productsApi = {
  list: (companyId: string) =>
    apiClient.get<ProductDTO[]>(`${base(companyId)}/products`),
  get: (companyId: string, id: string) =>
    apiClient.get<ProductDTO>(`${base(companyId)}/products/${id}`),
  remove: (companyId: string, id: string) =>
    apiClient.del<MessageResponse>(`${base(companyId)}/products/${id}`),
};

export const categoriesApi = {
  list: (companyId: string) =>
    apiClient.get<CategoryDTO[]>(`${base(companyId)}/product-categories`),
  create: (companyId: string, body: { name: string; description?: string; parent_id?: string | null }) =>
    apiClient.post<CategoryDTO>(`${base(companyId)}/product-categories`, body),
  update: (companyId: string, id: string, body: { name?: string; description?: string }) =>
    apiClient.patch<CategoryDTO>(`${base(companyId)}/product-categories/${id}`, body),
  remove: (companyId: string, id: string) =>
    apiClient.del<MessageResponse>(`${base(companyId)}/product-categories/${id}`),
};

export const salesApi = {
  /** origin: "imported" = history loaded from a spreadsheet, "pos" = lines of sales made at the till. */
  list: (companyId: string, page = 1, size = 50, origin?: "pos" | "imported") =>
    apiClient.get<SaleDTO[]>(
      `${base(companyId)}/sales?page=${page}&size=${size}${origin ? `&origin=${origin}` : ""}`,
    ),
};

export const inventoryApi = {
  /**
   * Newest first, one page at a time (API default size 50, max 100).
   * referenceType keeps one origin only: "sale", "sale_void", "purchase", "adjustment"...
   */
  listMovements: (
    companyId: string,
    opts: { referenceType?: string; page?: number; size?: number } = {},
  ) =>
    apiClient.get<MovementDTO[]>(
      `${base(companyId)}/inventory/movements${qs({
        reference_type: opts.referenceType,
        page: opts.page,
        size: opts.size,
      })}`,
    ),
};

export const forecastingApi = {
  runResults: (companyId: string, runId: string) =>
    apiClient.get<ForecastResultDTO[]>(
      `${base(companyId)}/forecast-runs/${runId}/results`,
    ),
};

/** GET /kpis is paged (max 100 rows, newest first) and every forecast appends a new batch. */
const KPI_PAGE = 100;
const KPI_MAX_PAGES = 20;

export const kpisApi = {
  /**
   * Reads pages until the latest value of every product's KPIs is in hand: stops at a short
   * page, or at a page that adds no new product/KPI pair (it only holds older batches).
   */
  list: async (companyId: string): Promise<KpiDTO[]> => {
    const all: KpiDTO[] = [];
    const seen = new Set<string>();
    for (let page = 1; page <= KPI_MAX_PAGES; page++) {
      const rows = await apiClient.get<KpiDTO[]>(`${base(companyId)}/kpis?page=${page}&size=${KPI_PAGE}`);
      let fresh = 0;
      for (const k of rows) {
        const key = `${k.product_id}:${k.kpi_type}`;
        if (!seen.has(key)) {
          seen.add(key);
          fresh++;
        }
      }
      all.push(...rows);
      if (rows.length < KPI_PAGE || fresh === 0) break;
    }
    return all;
  },
  calculate: (companyId: string) =>
    apiClient.post<KpiDTO[]>(`${base(companyId)}/kpis/calculate`),
};

export const recommendationsApi = {
  list: (companyId: string, pendingOnly = false) =>
    apiClient.get<RecommendationDTO[]>(
      `${base(companyId)}/recommendations${pendingOnly ? "?pending_only=true" : ""}`,
    ),
  accept: (companyId: string, id: string) =>
    apiClient.post<RecommendationDTO>(
      `${base(companyId)}/recommendations/${id}/accept`,
    ),
};

/** Tells every open notices list (the bell, /notifications) to reload. */
function notifyNoticesChanged() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED));
}

export const notificationsApi = {
  /** Paged, newest first; total and pages are the real counts (size max 100). */
  list: (companyId: string, size?: number, opts: { page?: number; unreadOnly?: boolean } = {}) =>
    apiClient.get<PaginatedResponse<NotificationDTO>>(
      `${base(companyId)}/notifications${qs({
        size,
        page: opts.page,
        unread_only: opts.unreadOnly ? "true" : undefined,
      })}`,
    ),
  /** Unread notices of the company (for the bell's badge). */
  unreadCount: (companyId: string) =>
    apiClient.get<UnreadCountDTO>(`${base(companyId)}/notifications/unread-count`),
  markRead: async (companyId: string, id: string) => {
    const res = await apiClient.post<MessageResponse>(`${base(companyId)}/notifications/${id}/mark-read`);
    notifyNoticesChanged();
    return res;
  },
  /** One call for every unread notice; `updated` says how many changed. */
  markAllRead: async (companyId: string) => {
    const res = await apiClient.post<MarkAllReadDTO>(`${base(companyId)}/notifications/mark-all-read`);
    notifyNoticesChanged();
    return res;
  },
};

/** Window event fired after a notice changes, so lists with their own `useApi` stay in step. */
export const NOTIFICATIONS_CHANGED = "bria:notifications-changed";

export const reportsApi = {
  list: (companyId: string) =>
    apiClient.get<PaginatedResponse<ReportDTO>>(`${base(companyId)}/reports`),
  create: (
    companyId: string,
    body: { title: string; report_type: ReportType; params?: Record<string, unknown> },
  ) => apiClient.post<ReportDTO>(`${base(companyId)}/reports`, { params: {}, ...body }),
  download: (companyId: string, id: string) =>
    apiClient.getBlob(`${base(companyId)}/reports/${id}/download`),
};

export const billingApi = {
  subscription: (companyId: string) =>
    apiClient.get<SubscriptionDTO>(
      `${base(companyId)}/billing/subscription`,
    ),
};

export const suppliersApi = {
  list: (companyId: string) =>
    apiClient.get<SupplierDTO[]>(`${base(companyId)}/suppliers`),
  create: (
    companyId: string,
    body: {
      ruc: string;
      business_name: string;
      contact_name?: string;
      phone?: string;
      email?: string;
      address?: string;
      custom_attributes?: SupplierDTO["custom_attributes"];
    },
  ) => apiClient.post<SupplierDTO>(`${base(companyId)}/suppliers`, body),
  update: (
    companyId: string,
    id: string,
    body: Partial<Pick<SupplierDTO, "business_name" | "contact_name" | "phone" | "email" | "address" | "is_active" | "custom_attributes">>,
  ) => apiClient.patch<SupplierDTO>(`${base(companyId)}/suppliers/${id}`, body),
  remove: (companyId: string, id: string) =>
    apiClient.del<MessageResponse>(`${base(companyId)}/suppliers/${id}`),
};
