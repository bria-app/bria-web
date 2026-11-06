/** Who the comprobante is for. Mirrors the backend rules in invoicing `validate_client`. */
import type { PosClientDocType, SalesDocumentType } from "@/types/pos";
import { BOLETA_ID_THRESHOLD, isValidDni, isValidRuc } from "./peru";

export interface ClientData {
  docNumber: string;
  name: string;
  address: string;
}

export const EMPTY_CLIENT: ClientData = { docNumber: "", name: "", address: "" };

/** «DNI» / «RUC» before a client's number; «Doc.» if the type was not recorded (old imports). */
export const CLIENT_DOC_LABEL: Record<PosClientDocType, string> = { dni: "DNI", ruc: "RUC", none: "Doc." };

export function clientDocType(doc: SalesDocumentType, number: string): PosClientDocType {
  const n = number.trim();
  if (!n) return "none";
  if (doc === "factura") return "ruc";
  return n.length === 11 ? "ruc" : "dni";
}

const rucProblem = (n: string): string | null => {
  if (n.length !== 11) return `El RUC tiene 11 dígitos (llevas ${n.length}).`;
  if (!isValidRuc(n)) return "Ese RUC no es válido. Revisa los dígitos.";
  return null;
};

/** First reason the backend would reject this client for this comprobante, or null. */
export function clientProblem(doc: SalesDocumentType, client: ClientData, total: number): string | null {
  const n = client.docNumber.trim();
  const name = client.name.trim();

  if (doc === "factura") {
    if (!n) return "La factura lleva el RUC del cliente.";
    return rucProblem(n) ?? (name ? null : "Escribe la razón social del cliente.");
  }

  if (doc === "boleta") {
    if (n.length === 11) return "Con RUC se emite factura. Cambia el comprobante.";
    if (n && !isValidDni(n)) return `El DNI tiene 8 dígitos (llevas ${n.length}).`;
    if (total >= BOLETA_ID_THRESHOLD && (!n || !name))
      return `Boletas de S/ ${BOLETA_ID_THRESHOLD} o más llevan DNI y nombre del cliente.`;
    return null;
  }

  if (!n) return null;
  if (n.length === 11) return rucProblem(n);
  return isValidDni(n) ? null : "El DNI tiene 8 dígitos y el RUC 11.";
}

/** Whether the client data must be filled before charging (to nudge the cashier early). */
export function clientRequired(doc: SalesDocumentType, total: number): boolean {
  return doc === "factura" || (doc === "boleta" && total >= BOLETA_ID_THRESHOLD);
}
