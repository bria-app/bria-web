import { apiClient } from "@/services/api/client";
import type {
  PurchaseBatchInput,
  PurchaseBatchResultDTO,
  PurchaseCatalogItemDTO,
  PurchaseDocumentDetailDTO,
  PurchaseDocumentPageDTO,
  PurchaseFilters,
  PurchaseImportInput,
  PurchaseImportResultDTO,
  SupplierImportResultDTO,
  SupplierImportRow,
  SupplierSummaryDTO,
} from "@/types/purchasing";
import { queryString } from "./query";

const base = (companyId: string) => `/companies/${companyId}`;

/** Supplier detail + bulk import (CRUD stays in suppliersApi). */
export const supplierInsightsApi = {
  summary: (companyId: string, supplierId: string) =>
    apiClient.get<SupplierSummaryDTO>(`${base(companyId)}/suppliers/${supplierId}/summary`),
  import: (companyId: string, rows: SupplierImportRow[]) =>
    apiClient.post<SupplierImportResultDTO>(`${base(companyId)}/suppliers/import`, { rows }),
};

/** Purchase documents: register (one by one), bulk import, history. */
export const purchasingApi = {
  catalog: (companyId: string) =>
    apiClient.get<PurchaseCatalogItemDTO[]>(`${base(companyId)}/purchases/catalog`),
  registerDocument: (companyId: string, body: PurchaseBatchInput) =>
    apiClient.post<PurchaseBatchResultDTO>(`${base(companyId)}/purchases/batch`, body),
  import: (companyId: string, body: PurchaseImportInput) =>
    apiClient.post<PurchaseImportResultDTO>(`${base(companyId)}/purchases/import`, body),
  documents: (companyId: string, filters: PurchaseFilters = {}) =>
    apiClient.get<PurchaseDocumentPageDTO>(`${base(companyId)}/purchases/documents${queryString({ ...filters })}`),
  document: (companyId: string, documentId: string) =>
    apiClient.get<PurchaseDocumentDetailDTO>(
      `${base(companyId)}/purchases/documents/${encodeURIComponent(documentId)}`,
    ),
};
