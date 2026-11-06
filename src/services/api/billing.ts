import { apiClient } from "@/services/api/client";
import type { SubscriptionDTO } from "@/types/api";
import type { CheckoutPayload, CheckoutResultDTO, PaymentDTO, PlanDTO } from "@/types/billing";

const base = (companyId: string) => `/companies/${companyId}/billing`;

/** Plan catalog, simulated checkout, payment history and renewal management. */
export const billingPlansApi = {
  plans: () => apiClient.get<PlanDTO[]>("/billing/plans"),
  checkout: (companyId: string, body: CheckoutPayload) =>
    apiClient.post<CheckoutResultDTO>(`${base(companyId)}/checkout`, body),
  payments: (companyId: string) => apiClient.get<PaymentDTO[]>(`${base(companyId)}/payments`),
  cancel: (companyId: string) => apiClient.post<SubscriptionDTO>(`${base(companyId)}/cancel`),
  resume: (companyId: string) => apiClient.post<SubscriptionDTO>(`${base(companyId)}/resume`),
};

