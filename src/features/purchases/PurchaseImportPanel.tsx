"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DateField } from "@/components/ui/DateField";
import { Select } from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import type { ImportRequirementGroup, ImportRow, NewCustomColumn } from "@/features/import/SmartImportWizard";
import { DialogLoading, useOpenedOnce } from "@/components/ui/lazyDialog";
import { ensureNewColumns, newColumnsNote } from "@/features/import/newColumns";
import { purchasingApi } from "@/services/api/purchasing";
import { formatNumber, soles, units } from "@/lib/format";
import { inputClass } from "@/lib/ui";
import type { SupplierDTO } from "@/types/api";
import type { CustomFieldDTO } from "@/types/custom-fields";
import type { PurchaseImportResultDTO } from "@/types/purchasing";
import { purchaseDateError, todayISO } from "./format";
import { purchaseImportTargets } from "./importTargets";
import { PurchaseDocumentModal } from "./lazyPurchaseDocument";
import { PurchaseImportSummary } from "./PurchaseImportSummary";

// The wizard and its spreadsheet reader load the first time someone picks «Elegir archivo».
const SmartImportWizard = dynamic(() => import("@/features/import/SmartImportWizard").then((m) => m.SmartImportWizard), {
  ssr: false,
  loading: DialogLoading,
});

// Each row needs something that says which product it is (a missing one is created by name).
const PRODUCT_GROUP: ImportRequirementGroup[] = [
  { id: "product", keys: ["name", "code", "barcode"], label: "Producto", hint: "el nombre, el código o el código de barras", question: "¿Qué columna dice qué producto es?" },
];

interface Props {
  companyId: string | null;
  suppliers: SupplierDTO[];
  productFields: CustomFieldDTO[];
  initialSupplierId: string;
  onImported: () => void;
}

/** Upload a supplier's spreadsheet: products are matched by code, barcode or name, or created. */
export function PurchaseImportPanel({ companyId, suppliers, productFields, initialSupplierId, onImported }: Props) {
  const [open, setOpen] = useState(false);
  // A link may bring a supplier that no longer exists or is inactive: start empty then.
  const [supplierId, setSupplierId] = useState(() => (suppliers.some((s) => s.id === initialSupplierId && s.is_active) ? initialSupplierId : ""));
  const [date, setDate] = useState(todayISO());
  const [docNumber, setDocNumber] = useState("");
  const [includeIgv, setIncludeIgv] = useState(false);
  const [result, setResult] = useState<PurchaseImportResultDTO | null>(null);
  const [docId, setDocId] = useState<string | null>(null);
  const wizardLoaded = useOpenedOnce(open);
  const docLoaded = useOpenedOnce(docId !== null);

  const targets = useMemo(() => purchaseImportTargets(productFields), [productFields]);
  const supplierOptions = suppliers.filter((s) => s.is_active || s.id === supplierId).map((s) => ({ value: s.id, label: s.business_name, description: `RUC ${s.ruc}` }));
  const supplier = suppliers.find((s) => s.id === supplierId);

  const runImport = async (rows: ImportRow[], newColumns: NewCustomColumn[]) => {
    if (!companyId) throw new Error("Tu sesión se cerró. Vuelve a entrar e inténtalo de nuevo.");
    if (!supplierId) throw new Error("Elige el proveedor.");
    const dateProblem = date ? purchaseDateError(date) : null;
    if (dateProblem) throw new Error(dateProblem);
    const savedKeys = await ensureNewColumns(companyId, "product", newColumns);
    const res = await purchasingApi.import(companyId, {
      supplier_id: supplierId,
      purchase_date: date || todayISO(),
      document_number: docNumber.trim(),
      create_missing_products: true,
      costs_include_igv: includeIgv,
      rows: rows.map((r) => ({
        row: r.rowNumber,
        code: r.values.code,
        barcode: r.values.barcode,
        name: r.values.name,
        quantity: r.values.quantity,
        unit_cost: r.values.unit_cost,
        unit_price: r.values.unit_price,
        purchase_date: r.values.purchase_date,
        document_number: r.values.document_number,
        custom_attributes: savedKeys(r.custom),
      })),
    });
    setResult(res);
    const shown = res.new_products.slice(0, 12).map((p) => `${p.sku} · ${p.name}`);
    const fieldsNote = newColumnsNote(newColumns.length, "productos");
    // Rows the API rejects (a future date, a missing product…) come back in errors[] with their message.
    const errors = res.errors.map((e) => ({ row: e.row, message: e.message || "No se pudo subir esta fila." }));
    // Every row failed: only the errors are worth reading.
    if (res.created_lines === 0) return { created: 0, errors, notes: fieldsNote ? [fieldsNote] : undefined };
    return {
      created: res.created_lines,
      errors,
      notes: [
        `Entraron ${units(res.units)} a tu inventario · ${soles(res.total)} con IGV`,
        `${formatNumber(res.matched)} ${res.matched === 1 ? "producto reconocido" : "productos reconocidos"} · ${formatNumber(res.new_products.length)} ${res.new_products.length === 1 ? "nuevo" : "nuevos"}`,
        ...shown,
        ...(res.new_products.length > shown.length ? [`y ${formatNumber(res.new_products.length - shown.length)} más (los ves al cerrar)`] : []),
        ...(fieldsNote ? [fieldsNote] : []),
      ],
    };
  };

  // Shares the top row of the review with the summary: one line of fields when there is room.
  const purchaseData = (
    <div className="@container h-full space-y-3 rounded-2xl border border-border bg-surface p-4">
      <p className="text-sm font-semibold text-text-primary">Datos de la compra</p>
      <div className="grid grid-cols-2 gap-2 @xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <div className="col-span-2 flex flex-col gap-1.5 @xl:col-span-1">
          <span className="text-[13px] font-semibold text-text-secondary">Proveedor</span>
          <Select aria-label="Proveedor" value={supplierId} onChange={setSupplierId} options={supplierOptions} searchable placeholder="¿A quién le compraste?" invalid={!supplierId} />
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold text-text-secondary">Fecha</span>
          <DateField className="px-2.5 text-[13px]" value={date} max={todayISO()} onChange={setDate} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold text-text-secondary">N.º de factura</span>
          <input className={inputClass(false, "px-2.5 font-mono text-[13px]")} value={docNumber} onChange={(e) => setDocNumber(e.target.value.toUpperCase())} placeholder="F001-123" maxLength={40} />
        </label>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <Switch checked={includeIgv} onChange={setIncludeIgv} label="Los costos del archivo incluyen IGV" showLabel />
        <p className="text-[12px] text-text-muted">Si cada fila trae su fecha o N.º de factura, usamos esos.</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <section aria-labelledby="import-title" className="grid gap-6 rounded-2xl border border-border bg-surface p-6 lg:grid-cols-[1fr_320px] lg:items-center">
        <div className="space-y-3">
          <h2 id="import-title" className="font-display text-xl font-bold tracking-[-0.02em] text-text-primary">
            Sube tus compras desde Excel
          </h2>
          <p className="max-w-xl text-sm leading-relaxed text-text-secondary">
            Sirve el detalle de la factura o tu propia planilla. Reconocemos cada producto por su código, código de barras o nombre, y
            creamos los que falten. Todo entra a tu inventario apenas lo confirmes.
          </p>
          <p className="text-[13px] text-text-muted">Las columnas extra (marca, talla, vencimiento) pueden guardarse como campos propios del producto.</p>
        </div>
        <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-border bg-surface-soft p-5 text-center">
          <p className="text-sm text-text-secondary">
            Tu archivo necesita al menos <strong className="text-text-primary">cantidad</strong>, <strong className="text-text-primary">costo</strong> y el
            nombre o código del producto.
          </p>
          <Button variant="primary" onClick={() => setOpen(true)} disabled={!companyId}>
            <FileSpreadsheet aria-hidden className="h-4 w-4" /> Elegir archivo
          </Button>
        </div>
      </section>

      {result && <PurchaseImportSummary result={result} supplierName={supplier?.business_name ?? "Tu proveedor"} onOpenDocument={setDocId} />}

      {wizardLoaded && (
        <SmartImportWizard
          open={open}
          onClose={() => setOpen(false)}
          title="Subir compras desde Excel"
          entityLabel="líneas de compra"
          targetFields={targets}
          allowNewColumns
          requireOneOf={PRODUCT_GROUP}
          mappingExtra={purchaseData}
          blockReason={!supplierId ? "Elige el proveedor en «Datos de la compra»" : date ? purchaseDateError(date) : null}
          uploadHint={
            <p>
              Cada fila es un producto comprado: <strong className="text-text-primary">cantidad</strong> y{" "}
              <strong className="text-text-primary">costo unitario</strong>, más su código, código de barras o nombre.
            </p>
          }
          onImport={runImport}
          onFinished={onImported}
        />
      )}

      {docLoaded && <PurchaseDocumentModal open={docId !== null} onClose={() => setDocId(null)} companyId={companyId} documentId={docId} />}
    </div>
  );
}
