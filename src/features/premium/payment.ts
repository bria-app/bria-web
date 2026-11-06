import type { BillingCycle, CardBrand, CheckoutPayload, PaymentMethod } from "@/types/billing";

/** What the simulated checkout asks for. Only brand, last 4 digits and holder ever leave the page. */
export interface PaymentState {
  method: PaymentMethod;
  brand: CardBrand;
  last4: string;
  holder: string;
  yapeCode: string;
}

export const EMPTY_PAYMENT: PaymentState = { method: "card", brand: "visa", last4: "", holder: "", yapeCode: "" };

export const BRANDS: { value: CardBrand; label: string }[] = [
  { value: "visa", label: "Visa" },
  { value: "mastercard", label: "Mastercard" },
  { value: "amex", label: "Amex" },
  { value: "diners", label: "Diners" },
];

export type PaymentErrors = Partial<Record<"last4" | "holder" | "yapeCode", string>>;

/** Mirrors the backend checks (POST /billing/checkout) so the person sees them before sending. */
export function paymentErrors(s: PaymentState): PaymentErrors {
  const errors: PaymentErrors = {};
  if (s.method === "card") {
    if (!/^\d{4}$/.test(s.last4)) errors.last4 = `Son los 4 últimos dígitos de la tarjeta (llevas ${s.last4.length}).`;
    if (s.holder.trim().length < 3) errors.holder = "Escribe el nombre como figura en la tarjeta.";
  }
  if (s.method === "yape" && !/^\d{6}$/.test(s.yapeCode)) {
    errors.yapeCode = `El código de aprobación de Yape tiene 6 dígitos (llevas ${s.yapeCode.length}).`;
  }
  return errors;
}

export function toPayload(s: PaymentState, cycle: BillingCycle): CheckoutPayload {
  const body: CheckoutPayload = { plan_id: "premium", billing_cycle: cycle, method: s.method };
  if (s.method === "card") body.card = { brand: s.brand, last4: s.last4, holder_name: s.holder.trim().toUpperCase() };
  if (s.method === "yape") body.yape_code = s.yapeCode;
  return body;
}
