"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Columns3, FileSpreadsheet, Search, Truck, UserPlus } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { DataState } from "@/components/ui/DataState";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { ViewToggle } from "@/components/ui/ViewToggle";
import { DialogLoading, useOpenedOnce } from "@/components/ui/lazyDialog";
import { SuppliersBoard } from "@/features/suppliers/SuppliersBoard";
import { SuppliersTable } from "@/features/suppliers/SuppliersTable";
import { SUPPLIER_COLUMNS } from "@/features/suppliers/supplierColumns";
import { num } from "@/features/purchases/format";
import { useApi } from "@/hooks/useApi";
import { useColumnConfig } from "@/hooks/useColumnConfig";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useListView } from "@/hooks/useDevicePref";
import { useDrawnAsNeeded } from "@/hooks/useInfiniteList";
import { useQueryFlag } from "@/hooks/useQueryFlag";
import { suppliersApi } from "@/services/api/resources";
import { formatNumber, soles } from "@/lib/format";
import { inputClass } from "@/lib/ui";
import type { SupplierDTO } from "@/types/api";

// The dialogs open from buttons: their code (and the spreadsheet reader) downloads on first use.
const SupplierFormModal = dynamic(() => import("@/features/suppliers/SupplierFormModal").then((m) => m.SupplierFormModal), { ssr: false, loading: DialogLoading });
const ColumnsManager = dynamic(() => import("@/features/custom-fields/ColumnsManager").then((m) => m.ColumnsManager), { ssr: false, loading: DialogLoading });
const SupplierImportWizard = dynamic(() => import("@/features/suppliers/SupplierImportWizard").then((m) => m.SupplierImportWizard), { ssr: false, loading: DialogLoading });

type StatusFilter = "all" | "active" | "inactive";

const normalize = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** «Proveedores»: who you buy from, how to reach them and how much you bought. */
export default function SuppliersPage() {
  const companyId = useCompanyId();
  const router = useRouter();
  const toast = useToast();
  const suppliers = useApi(() => (companyId ? suppliersApi.list(companyId) : Promise.resolve([] as SupplierDTO[])), [companyId]);
  const columns = useColumnConfig(companyId, "supplier");
  const [view] = useListView("proveedores");

  // The shell's «Crear → Proveedor» links here with ?nuevo=1.
  const openedToCreate = useQueryFlag("nuevo");
  const [formOpen, setFormOpen] = useState(openedToCreate);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const formLoaded = useOpenedOnce(formOpen);
  const columnsLoaded = useOpenedOnce(columnsOpen);
  const importLoaded = useOpenedOnce(importOpen);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");

  const items = useMemo(() => suppliers.data ?? [], [suppliers.data]);
  const active = items.filter((s) => s.is_active).length;

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    return items.filter((s) => {
      if (status === "active" && !s.is_active) return false;
      if (status === "inactive" && s.is_active) return false;
      if (!q) return true;
      const custom = Object.values(s.custom_attributes ?? {}).map((v) => String(v ?? ""));
      return normalize([s.business_name, s.ruc, s.contact_name, s.phone, s.email, s.address, ...custom].join(" ")).includes(q);
    });
  }, [items, query, status]);

  const drawn = useDrawnAsNeeded(filtered);
  const visibleColumns = SUPPLIER_COLUMNS.filter((c) => c.locked || columns.isBuiltinVisible(c.key));
  const shownTotal = filtered.reduce((acc, s) => acc + num(s.total_purchased), 0);
  const footer = (
    <>
      {formatNumber(filtered.length)} {filtered.length === 1 ? "proveedor · le compraste" : "proveedores · les compraste"}{" "}
      <span className="font-mono">{soles(shownTotal)}</span> sin IGV
    </>
  );

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <PageHeader
        title="Proveedores"
        description="A quién le compras, cómo contactarlos y cuánto les has comprado."
        action={
          <Button variant="primary" onClick={() => setFormOpen(true)} disabled={!companyId}>
            <UserPlus aria-hidden className="h-4 w-4" /> Nuevo proveedor
          </Button>
        }
      />

      <DataState
        loading={suppliers.loading && !suppliers.data}
        error={suppliers.error}
        onRetry={suppliers.reload}
        empty={items.length === 0}
        emptyState={
          <EmptyState
            icon={Truck}
            title="Aún no tienes proveedores"
            description="Agrega a quien te vende tu mercadería con «Nuevo proveedor». Luego anota sus facturas en Compras."
            hint={
              <button type="button" className="font-semibold text-accent-text hover:underline" onClick={() => setImportOpen(true)}>
                ¿Ya tienes una lista en Excel? Impórtala
              </button>
            }
          />
        }
      >
        <div className="@container flex flex-wrap items-center gap-2">
          <label className="relative block min-w-0 flex-1 basis-[calc(100%-5.5rem)] @5xl:w-80 @5xl:flex-none @5xl:basis-auto">
            <span className="sr-only">Buscar proveedores</span>
            <Search aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              type="search"
              className={inputClass(false, "pl-10")}
              placeholder="Nombre, RUC, contacto o teléfono"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <div role="group" aria-label="Estado" className="order-1 flex flex-wrap gap-2 @5xl:order-none">
            <Chip active={status === "all"} onClick={() => setStatus("all")} count={items.length}>Todos</Chip>
            <Chip active={status === "active"} onClick={() => setStatus("active")} count={active}>Activos</Chip>
            <Chip active={status === "inactive"} onClick={() => setStatus("inactive")} count={items.length - active}>Inactivos</Chip>
          </div>
          <div className="order-1 ml-auto flex items-center gap-2 @5xl:order-none">
            <Button variant="secondary" size="sm" onClick={() => setImportOpen(true)} disabled={!companyId}>
              <FileSpreadsheet aria-hidden className="h-4 w-4" /> Importar Excel
            </Button>
            {view === "tabla" && (
              <Button variant="secondary" size="sm" onClick={() => setColumnsOpen(true)} disabled={!companyId}>
                <Columns3 aria-hidden className="h-4 w-4" /> Columnas
              </Button>
            )}
          </div>
          <ViewToggle screen="proveedores" />
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={Search}
            title="Ningún proveedor coincide"
            description={query ? `No encontramos «${query.trim()}». Prueba con el RUC o el nombre del contacto.` : "No hay proveedores con ese estado."}
            hint={
              <button
                type="button"
                className="font-semibold text-accent-text hover:underline"
                onClick={() => {
                  setQuery("");
                  setStatus("all");
                }}
              >
                Quitar los filtros
              </button>
            }
          />
        ) : view === "tarjetas" ? (
          <SuppliersBoard rows={drawn} footer={footer} />
        ) : (
          <SuppliersTable rows={drawn} columns={visibleColumns} customColumns={columns.visibleFields} footer={footer} />
        )}
      </DataState>

      {formLoaded && (
        <SupplierFormModal
          open={formOpen}
          onClose={() => setFormOpen(false)}
          companyId={companyId}
          fields={columns.fields}
          onCreated={(saved) => {
            suppliers.reload();
            toast(`Agregaste a «${saved.business_name}».`, { action: { label: "Ver ficha", onClick: () => router.push(`/suppliers/${saved.id}`) } });
          }}
        />
      )}
      {columnsLoaded && (
        <ColumnsManager
          open={columnsOpen}
          onClose={() => setColumnsOpen(false)}
          companyId={companyId}
          entity="supplier"
          entityLabel="proveedores"
          builtinColumns={SUPPLIER_COLUMNS}
          hiddenBuiltins={columns.hiddenBuiltins}
          onHiddenBuiltinsChange={columns.setHiddenBuiltins}
          fields={columns.fields}
          onFieldsChanged={columns.reloadFields}
        />
      )}
      {importLoaded && (
        <SupplierImportWizard
          open={importOpen}
          onClose={() => setImportOpen(false)}
          companyId={companyId}
          fields={columns.fields}
          onFinished={() => {
            suppliers.reload();
            columns.reloadFields();
          }}
        />
      )}
    </div>
  );
}
