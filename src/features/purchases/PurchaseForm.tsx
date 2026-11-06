"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useToast } from "@/components/ui/Toast";
import { DialogLoading, useOpenedOnce } from "@/components/ui/lazyDialog";
import type { SelectOption } from "@/components/ui/Select";
import { soles, units } from "@/lib/format";
import { purchasingApi } from "@/services/api/purchasing";
import type { SupplierDTO } from "@/types/api";
import type { PurchaseBatchResultDTO, PurchaseCatalogItemDTO } from "@/types/purchasing";
import { purchaseDateError, todayISO } from "./format";
import { computeLine, isBlank, newLine, suggestedCost, toBatchItems, totalsOf, type Line } from "./lines";
import { PurchaseHeader, type PurchaseHeaderState } from "./PurchaseHeader";
import { PurchaseLinesCard } from "./PurchaseLinesCard";
import { PurchaseResult } from "./PurchaseResult";
import { PurchaseSubmitBar } from "./PurchaseSubmitBar";
import { useSupplierSuggestions } from "./useSupplierSuggestions";
import type { PrefillItem } from "./usePurchasePrefill";
import { usePrefillSupplier } from "./usePrefillSupplier";

const SupplierFormModal = dynamic(() => import("@/features/suppliers/SupplierFormModal").then((m) => m.SupplierFormModal), {
  ssr: false,
  loading: DialogLoading,
});

interface Props {
  companyId: string | null;
  suppliers: SupplierDTO[];
  catalog: PurchaseCatalogItemDTO[];
  initialSupplierId: string;
  /** Products (and quantities) to start with, e.g. from a «por reponer» alert. */
  prefill: PrefillItem[];
  onSuppliersChanged: () => void;
  onRegistered: () => void;
}

/** Register one supplier document: header, products, totals. The units go in on save. */
export function PurchaseForm({ companyId, suppliers, catalog, initialSupplierId, prefill, onSuppliersChanged, onRegistered }: Props) {
  const toast = useToast();
  const [header, setHeader] = useState<PurchaseHeaderState>(() => ({
    supplierId: suppliers.some((s) => s.id === initialSupplierId) ? initialSupplierId : "",
    date: todayISO(),
    docNumber: "",
    notes: "",
    includeIgv: false,
  }));
  const [lines, setLines] = useState<Line[]>(() => {
    const known = prefill.flatMap((item) => {
      const product = catalog.find((p) => p.id === item.productId && p.is_active);
      return product ? [newLine({ productId: product.id, quantity: String(item.quantity), unitCost: suggestedCost(product, false) })] : [];
    });
    return known.length > 0 ? known : [newLine()];
  });
  const [attempted, setAttempted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PurchaseBatchResultDTO | null>(null);
  const [supplierModal, setSupplierModal] = useState(false);
  const supplierModalLoaded = useOpenedOnce(supplierModal);

  const byId = useMemo(() => new Map(catalog.map((p) => [p.id, p])), [catalog]);
  const suggestions = useSupplierSuggestions(companyId, header.supplierId);
  const supplier = suppliers.find((s) => s.id === header.supplierId) ?? null;

  const usable = (id: string) => suppliers.some((s) => s.id === id && s.is_active);
  // Only when the link brought products but no supplier: suggest the one it was last bought from.
  const [prefillProduct] = useState(() =>
    suppliers.some((s) => s.id === initialSupplierId)
      ? ""
      : (prefill.find((item) => catalog.some((p) => p.id === item.productId && p.is_active))?.productId ?? ""),
  );
  usePrefillSupplier(companyId, prefillProduct, (id) => {
    if (usable(id)) setHeader((h) => (h.supplierId ? h : { ...h, supplierId: id }));
  });

  const supplierOptions: SelectOption[] = suppliers
    .filter((s) => s.is_active || s.id === header.supplierId)
    .map((s) => ({ value: s.id, label: s.business_name, description: `RUC ${s.ruc}` }));

  const taken = new Set(lines.map((l) => l.productId).filter(Boolean));
  const canAdd = (id: string) => !taken.has(id) && !!byId.get(id)?.is_active;
  const optionsFor = (current: string): SelectOption[] =>
    catalog
      .filter((p) => p.is_active || p.id === current)
      .map((p) => ({
        value: p.id,
        label: p.name,
        description: `${p.sku} · quedan ${units(p.stock_on_hand)} · te costó ${soles(p.last_cost ?? p.unit_cost)}`,
        disabled: p.id !== current && taken.has(p.id),
      }));

  const computed = lines.map((l) => computeLine(l, l.mode === "existing" ? byId.get(l.productId) : undefined, header.includeIgv));
  const totals = totalsOf(computed);
  const allValid = computed.every((c) => c.valid);

  const changeHeader = (patch: Partial<PurchaseHeaderState>) => {
    const igv = patch.includeIgv;
    if (igv !== undefined && igv !== header.includeIgv) {
      // Costs we filled in ourselves follow the switch; the ones the user typed stay as typed.
      setLines((ls) =>
        ls.map((l) => {
          const product = l.mode === "existing" ? byId.get(l.productId) : undefined;
          return product && l.unitCost === suggestedCost(product, header.includeIgv) ? { ...l, unitCost: suggestedCost(product, igv) } : l;
        }),
      );
    }
    setHeader((h) => ({ ...h, ...patch }));
  };

  const patchLine = (uid: string, patch: Partial<Line>) => setLines((ls) => ls.map((l) => (l.uid === uid ? { ...l, ...patch } : l)));
  const pick = (uid: string, productId: string) => patchLine(uid, { productId, unitCost: suggestedCost(byId.get(productId), header.includeIgv) });
  const remove = (uid: string) => setLines((ls) => (ls.length === 1 ? [newLine()] : ls.filter((l) => l.uid !== uid)));
  const append = (added: Line[]) => setLines((ls) => [...(isBlank(ls) ? [] : ls), ...added]);
  const addProduct = (productId: string) => append([newLine({ productId, unitCost: suggestedCost(byId.get(productId), header.includeIgv) })]);

  const fillSuggested = () => {
    const before = lines;
    const next = [...(isBlank(lines) ? [] : lines)];
    let changed = 0;
    for (const [productId, qty] of suggestions.suggested) {
      const existing = next.findIndex((l) => l.productId === productId);
      if (existing >= 0) next[existing] = { ...next[existing], quantity: String(qty) };
      else if (canAdd(productId)) next.push(newLine({ productId, quantity: String(qty), unitCost: suggestedCost(byId.get(productId), header.includeIgv) }));
      else continue;
      changed += 1;
    }
    if (changed === 0) return;
    setLines(next);
    toast(`Llenamos ${changed} ${changed === 1 ? "producto" : "productos"} con lo que sugiere bria.`, { undo: () => setLines(before) });
  };

  const submit = async () => {
    setAttempted(true);
    if (!companyId) return;
    const problem = !header.supplierId
      ? "Elige a qué proveedor le compraste."
      : (purchaseDateError(header.date) ?? (allValid ? null : "Revisa las filas marcadas: falta el producto, la cantidad o el costo."));
    if (problem) {
      setError(problem);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await purchasingApi.registerDocument(companyId, {
        supplier_id: header.supplierId,
        purchase_date: header.date,
        document_number: header.docNumber.trim(),
        notes: header.notes.trim(),
        costs_include_igv: header.includeIgv,
        items: toBatchItems(lines),
      });
      setResult(res);
      onRegistered();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar la compra.");
    } finally {
      setSaving(false);
    }
  };

  const startOver = () => {
    setResult(null);
    setLines([newLine()]);
    setHeader((h) => ({ ...h, docNumber: "", notes: "" }));
    setAttempted(false);
    setError(null);
  };

  if (result) {
    return <PurchaseResult companyId={companyId} result={result} supplierName={supplier?.business_name ?? "Tu proveedor"} onAnother={startOver} />;
  }

  return (
    // One form with its totals bar: «Hacia el lado» keeps it whole, a page wide.
    <div data-sw-keep="page" className="space-y-6">
      <PurchaseHeader
        value={header}
        onChange={changeHeader}
        supplierOptions={supplierOptions}
        showErrors={attempted}
        onNewSupplier={() => setSupplierModal(true)}
      />
      <PurchaseLinesCard
        computed={computed}
        optionsFor={optionsFor}
        showErrors={attempted}
        includeIgv={header.includeIgv}
        supplierName={supplier?.business_name ?? null}
        suggestions={suggestions}
        canAdd={canAdd}
        onPick={pick}
        onChange={patchLine}
        onRemove={remove}
        onAdd={(mode) => setLines((ls) => [...ls, newLine({ mode })])}
        onAddProduct={addProduct}
        onFillSuggested={fillSuggested}
      />
      <PurchaseSubmitBar totals={totals} error={error} saving={saving} disabled={!companyId} onSubmit={submit} />
      {supplierModalLoaded && (
        <SupplierFormModal
          open={supplierModal}
          onClose={() => setSupplierModal(false)}
          companyId={companyId}
          onCreated={(saved) => {
            onSuppliersChanged();
            setHeader((h) => ({ ...h, supplierId: saved.id }));
          }}
        />
      )}
    </div>
  );
}
