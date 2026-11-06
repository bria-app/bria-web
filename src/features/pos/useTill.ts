"use client";

import { useCallback, useMemo, useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { CheckoutError, lostSalesApi, posApi } from "@/services/api/pos";
import { soles, units } from "@/lib/format";
import type { CatalogProduct, PaymentMethod, SalesDocumentType, SalesOrder } from "@/types/pos";
import { CartLine, cartTotals, lineGross, newLine, toNumber } from "./cart";
import { ClientData, EMPTY_CLIENT, clientDocType, clientProblem } from "./client";

/** Everything the till holds for the sale being built, plus the checkout call. */
export function useTill(companyId: string | null) {
  const toast = useToast();
  const [lines, setLines] = useState<CartLine[]>([]);
  const [doc, setDoc] = useState<SalesDocumentType>("boleta");
  const [client, setClient] = useState<ClientData>(EMPTY_CLIENT);
  const [payment, setPayment] = useState<PaymentMethod>("efectivo");
  const [received, setReceived] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<SalesOrder | null>(null);

  const totals = useMemo(() => cartTotals(lines), [lines]);

  const recordLost = useCallback(
    (product: CatalogProduct, requested: number) => {
      if (!companyId) return;
      lostSalesApi
        .record(companyId, {
          product_id: product.id,
          requested_quantity: requested,
          available_quantity: Math.max(product.stock_on_hand, 0),
        })
        .then(() => toast("Anotado. Así el pronóstico no se queda corto."))
        .catch((err: unknown) => toast(err instanceof Error ? err.message : "No pudimos anotarlo. Inténtalo de nuevo."));
    },
    [companyId, toast],
  );

  const warnStock = useCallback(
    (product: CatalogProduct, requested: number) => {
      const message =
        product.stock_on_hand <= 0
          ? `«${product.name}» está agotado.`
          : `Solo quedan ${units(product.stock_on_hand)} de «${product.name}».`;
      toast(message, { action: { label: "Anotar que lo pidieron", onClick: () => recordLost(product, requested) } });
    },
    [recordLost, toast],
  );

  const add = useCallback(
    (product: CatalogProduct) => {
      const existing = lines.find((l) => l.product.id === product.id);
      const requested = (existing?.quantity ?? 0) + 1;
      if (requested > product.stock_on_hand) return warnStock(product, requested);
      setError(null);
      setLines((prev) =>
        existing
          ? prev.map((l) => (l.product.id === product.id ? { ...l, product, quantity: requested } : l))
          : [...prev, newLine(product)],
      );
    },
    [lines, warnStock],
  );

  const remove = useCallback(
    (productId: string) => {
      const previous = lines;
      const line = lines.find((l) => l.product.id === productId);
      setLines((prev) => prev.filter((l) => l.product.id !== productId));
      if (line) toast(`Quitaste «${line.product.name}» de la venta.`, { undo: () => setLines(previous) });
    },
    [lines, toast],
  );

  const setQuantity = useCallback(
    (productId: string, quantity: number) => {
      const line = lines.find((l) => l.product.id === productId);
      if (!line) return;
      if (quantity <= 0) return remove(productId);
      if (quantity > line.product.stock_on_hand) return warnStock(line.product, quantity);
      setLines((prev) => prev.map((l) => (l.product.id === productId ? { ...l, quantity } : l)));
    },
    [lines, remove, warnStock],
  );

  const patchLine = useCallback(
    (productId: string, patch: Partial<Pick<CartLine, "unitPrice" | "discount">>) =>
      setLines((prev) => prev.map((l) => (l.product.id === productId ? { ...l, ...patch } : l))),
    [],
  );

  const clear = useCallback(() => {
    const previous = lines;
    setLines([]);
    toast("Quitaste todo de la venta.", { undo: () => setLines(previous) });
  }, [lines, toast]);

  const resetSale = () => {
    setLines([]);
    setClient(EMPTY_CLIENT);
    setDoc("boleta");
    setPayment("efectivo");
    setReceived("");
    setError(null);
  };

  const problem = useMemo((): string | null => {
    if (!lines.length) return null;
    for (const l of lines) {
      const price = l.unitPrice.trim();
      if (price === "" || !Number.isFinite(Number(price.replace(",", ".")))) return `Revisa el precio de «${l.product.name}».`;
      if (toNumber(l.discount) > lineGross(l)) return `El descuento de «${l.product.name}» supera su importe.`;
    }
    const clientIssue = clientProblem(doc, client, totals.total);
    if (clientIssue) return clientIssue;
    if (payment === "efectivo" && received !== "" && toNumber(received) < totals.total)
      return `Faltan ${soles(totals.total - toNumber(received))} por recibir.`;
    return null;
  }, [lines, doc, client, payment, received, totals.total]);

  const syncShortages = (err: CheckoutError) => {
    setLines((prev) =>
      prev.map((l) => {
        const s = err.shortages.find((x) => x.product_id === l.product.id);
        return s ? { ...l, product: { ...l.product, stock_on_hand: s.available } } : l;
      }),
    );
    const list = err.shortages.map((s) => `«${s.name}» (quedan ${units(s.available)})`).join(", ");
    setError(`Ya no alcanza el inventario: ${list}. Ajusta las cantidades.`);
  };

  const checkout = async () => {
    if (!companyId || submitting || !lines.length || problem) return;
    setSubmitting(true);
    setError(null);
    try {
      const order = await posApi.checkout(companyId, {
        items: lines.map((l) => ({
          product_id: l.product.id,
          quantity: l.quantity,
          unit_price: toNumber(l.unitPrice),
          discount: toNumber(l.discount),
        })),
        document_type: doc,
        client_doc_type: clientDocType(doc, client.docNumber),
        client_doc_number: client.docNumber.trim(),
        client_name: client.name.trim(),
        client_address: doc === "factura" ? client.address.trim() : "",
        payment_method: payment,
        amount_received: payment === "efectivo" && received !== "" ? toNumber(received) : null,
      });
      resetSale();
      setReceipt(order);
    } catch (err) {
      if (err instanceof CheckoutError && err.status === 409 && err.shortages.length) syncShortages(err);
      else setError(err instanceof Error ? err.message : "No pudimos registrar la venta. Inténtalo de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  return {
    lines,
    totals,
    doc,
    setDoc,
    client,
    setClient,
    payment,
    setPayment,
    received,
    setReceived,
    submitting,
    error,
    problem,
    receipt,
    closeReceipt: () => setReceipt(null),
    add,
    remove,
    setQuantity,
    patchLine,
    clear,
    checkout,
  };
}

export type Till = ReturnType<typeof useTill>;
