"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Boxes, FileSpreadsheet, Plus, SlidersHorizontal } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { DataState } from "@/components/ui/DataState";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { CatalogBoard } from "@/features/inventory/CatalogBoard";
import { CatalogTable, type CatalogSort } from "@/features/inventory/CatalogTable";
import { CatalogToolbar } from "@/features/inventory/CatalogToolbar";
import { ColumnsPanel } from "@/features/inventory/ColumnsPanel";
import { announceAdjustment } from "@/features/inventory/adjustmentToast";
import { FILTERS, matchesFilter, matchesQuery, type CatalogFilter } from "@/features/inventory/catalogFilters";
import { useCatalogColumns } from "@/features/inventory/useCatalogColumns";
import { DialogLoading, useOpenedOnce } from "@/components/ui/lazyDialog";
import { categoryOptions, descendantIds } from "@/features/products/categoryTree";
import { useApi } from "@/hooks/useApi";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useListView } from "@/hooks/useDevicePref";
import { useDrawnAsNeeded } from "@/hooks/useInfiniteList";
import { useQueryFlag } from "@/hooks/useQueryFlag";
import { ancestorIds, isGlobalField } from "@/features/custom-fields/scope";
import { limaToday, withAlerts } from "@/features/custom-fields/rules";
import { categoriesApi } from "@/services/api/resources";
import { stockApi } from "@/services/api/inventory";
import { formatNumber, soles } from "@/lib/format";
import type { CategoryDTO } from "@/types/api";

// The dialogs open from buttons: their code downloads the first time one is opened.
const ProductFormModal = dynamic(() => import("@/features/products/ProductFormModal").then((m) => m.ProductFormModal), { ssr: false, loading: DialogLoading });
const StockAdjustmentModal = dynamic(() => import("@/features/inventory/StockAdjustmentModal").then((m) => m.StockAdjustmentModal), { ssr: false, loading: DialogLoading });
const CategoryManager = dynamic(() => import("@/features/products/CategoryManager").then((m) => m.CategoryManager), { ssr: false, loading: DialogLoading });
const CustomFieldsModal = dynamic(() => import("@/features/custom-fields/CustomFieldsModal").then((m) => m.CustomFieldsModal), { ssr: false, loading: DialogLoading });

/** «Inventario»: every product with its units on hand and prices, in one configurable table. */
export default function InventoryPage() {
  const router = useRouter();
  const toast = useToast();
  const companyId = useCompanyId();
  // Inactive products come too, so «Pausados» can list them; they are filtered out elsewhere.
  const overview = useApi(() => (companyId ? stockApi.overview(companyId, true) : Promise.resolve(null)), [companyId]);
  const categoriesQ = useApi(() => (companyId ? categoriesApi.list(companyId) : Promise.resolve([] as CategoryDTO[])), [companyId]);
  const cats = useMemo(() => categoriesQ.data ?? [], [categoriesQ.data]);
  const cols = useCatalogColumns(companyId, cats);
  const [view] = useListView("inventario");

  // The shell's «Crear → Producto» opens /products?nuevo=1, which redirects here.
  const [formOpen, setFormOpen] = useState(useQueryFlag("nuevo"));
  const [filter, setFilter] = useState<CatalogFilter>("todos");
  const [query, setQuery] = useState("");
  const [pickedCategory, setCategoryId] = useState("");
  // A category deleted from «Categorías» stops filtering instead of leaving an empty table.
  const categoryId = cats.some((c) => c.id === pickedCategory) ? pickedCategory : "";
  const [sort, setSort] = useState<CatalogSort>({ key: "status", dir: "asc" });
  const [panel, setPanel] = useState(false);
  const [fieldsOpen, setFieldsOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const formLoaded = useOpenedOnce(formOpen);
  const adjustLoaded = useOpenedOnce(adjustOpen);
  const categoriesLoaded = useOpenedOnce(categoriesOpen);
  const fieldsLoaded = useOpenedOnce(fieldsOpen);

  // Own-column alerts (por vencer, sin dato…) are worked out here: the overview does not send them.
  const items = useMemo(() => withAlerts(overview.data?.items ?? [], cols.fields, cats, limaToday()), [overview.data, cols.fields, cats]);
  const now = overview.data?.generated_at ?? "";
  const activeItems = useMemo(() => items.filter((r) => r.is_active), [items]);
  // Paused products count too: they still belong to their category.
  const productCategoryIds = useMemo(() => items.map((r) => r.category_id), [items]);

  const counts = useMemo(
    () => Object.fromEntries(FILTERS.map((f) => [f.id, items.filter((r) => matchesFilter(r, f.id, now)).length])) as Record<CatalogFilter, number>,
    [items, now],
  );

  // With a category picked, own fields that belong only to other categories step aside.
  const columns = useMemo(() => {
    if (!categoryId) return cols.columns;
    const scope = new Set([...ancestorIds(cats, categoryId), ...descendantIds(cats, categoryId)]);
    const byKey = new Map(cols.fields.map((f) => [`custom:${f.key}`, f]));
    return cols.columns.filter((c) => {
      const f = byKey.get(c.key);
      return !f || isGlobalField(f) || f.category_ids.some((id) => scope.has(id));
    });
  }, [cols.columns, cols.fields, categoryId, cats]);

  const rows = useMemo(() => {
    const allowed = categoryId ? descendantIds(cats, categoryId) : null;
    const column = columns.find((c) => c.key === sort.key) ?? columns[0];
    const filtered = items.filter(
      (r) => matchesFilter(r, filter, now) && matchesQuery(r, query) && (!allowed || (r.category_id !== null && allowed.has(r.category_id))),
    );
    return filtered.sort((a, b) => {
      const x = column.sort(a);
      const y = column.sort(b);
      const cmp = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y), "es");
      return sort.dir === "asc" ? cmp : -cmp;
    });
  }, [items, filter, now, query, categoryId, cats, columns, sort]);

  const drawn = useDrawnAsNeeded(rows);
  const catOptions = useMemo(() => categoryOptions(cats, "Todas las categorías"), [cats]);
  // Null stock_value = the API hid costs from this role: then the footer leaves the value out.
  const costHidden = rows.some((r) => r.stock_value == null);
  const value = rows.reduce((sum, r) => sum + Number(r.stock_value ?? 0), 0);
  const emptyMessage = query ? `Nada coincide con «${query}».` : "No hay productos con este filtro.";
  const total = filter === "pausados" ? counts.pausados : activeItems.length;
  const footer = (
    <>
      {formatNumber(rows.length)} de {formatNumber(total)} {total === 1 ? "producto" : "productos"}
      {!costHidden && (
        <>
          {" "}
          · <span className="font-mono">{soles(value)}</span> en inventario, a lo que te costaron
        </>
      )}
    </>
  );
  const reload = () => {
    overview.reload();
    categoriesQ.reload();
  };

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <PageHeader
        title="Inventario"
        description="Tus productos, cuánto te queda de cada uno y a cuánto los vendes."
        action={
          <>
            <Link href="/inventory/import" className="btn btn-secondary h-11 gap-2 px-4 text-sm">
              <FileSpreadsheet aria-hidden className="h-4 w-4" /> Importar
            </Link>
            <Button variant="secondary" onClick={() => setAdjustOpen(true)} disabled={!companyId || activeItems.length === 0}>
              <SlidersHorizontal aria-hidden className="h-4 w-4" /> Ajustar inventario
            </Button>
            <Button onClick={() => setFormOpen(true)} disabled={!companyId}>
              <Plus aria-hidden className="h-4 w-4" /> Agregar producto
            </Button>
          </>
        }
      />

      <DataState
        loading={overview.loading && !overview.data}
        error={overview.error}
        onRetry={reload}
        empty={items.length === 0}
        emptyState={
          <EmptyState
            icon={Boxes}
            title="Aún no tienes productos"
            description="Agrega el primero con su nombre y precio, o sube tu Excel tal como lo llevas."
            action={{ label: "Agregar producto", onClick: () => setFormOpen(true) }}
            hint={
              <Link href="/inventory/import" className="font-semibold text-accent-text hover:underline">
                O importa tu Excel
              </Link>
            }
          />
        }
      >
        <CatalogToolbar
          query={query}
          onQuery={setQuery}
          filter={filter}
          onFilter={setFilter}
          counts={counts}
          categoryId={categoryId}
          categoryOptions={catOptions}
          onCategory={setCategoryId}
          onCategories={() => setCategoriesOpen(true)}
          columnsOpen={panel}
          onColumns={() => setPanel((p) => !p)}
          showColumns={view === "tabla"}
        />
        {view === "tarjetas" ? (
          <CatalogBoard
            rows={drawn}
            showPrice={columns.some((c) => c.key === "price")}
            showCoverage={columns.some((c) => c.key === "coverage")}
            footer={footer}
            emptyMessage={emptyMessage}
          />
        ) : (
          <div className="flex flex-col items-start gap-4 lg:flex-row-reverse">
            {panel && (
              <ColumnsPanel
                fixed={cols.fixed}
                settings={cols.settings}
                onToggle={cols.toggle}
                onMove={cols.move}
                onReset={cols.reset}
                onManageFields={() => setFieldsOpen(true)}
                onClose={() => setPanel(false)}
                error={cols.saveError}
              />
            )}
            <CatalogTable
              rows={drawn}
              columns={columns}
              sort={sort}
              onSort={(key) => setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }))}
              onOpen={(id) => router.push(`/inventory/${id}`)}
              emptyMessage={emptyMessage}
              footer={footer}
            />
          </div>
        )}
      </DataState>

      {formLoaded && (
        <ProductFormModal
          open={formOpen}
          onClose={() => setFormOpen(false)}
          companyId={companyId}
          categories={cats}
          fields={cols.fields}
          onFieldsChanged={cols.reloadFields}
          onSaved={(p) => {
            reload();
            toast(`Creaste «${p.name}».`, { action: { label: "Ver ficha", onClick: () => router.push(`/inventory/${p.id}`) } });
          }}
        />
      )}
      {adjustLoaded && (
        <StockAdjustmentModal
          open={adjustOpen}
          onClose={() => setAdjustOpen(false)}
          companyId={companyId}
          products={activeItems}
          onDone={(res) => {
            overview.reload();
            if (companyId) announceAdjustment(toast, companyId, items.find((i) => i.id === res.product_id)?.name ?? "Producto", res, overview.reload);
          }}
        />
      )}
      {categoriesLoaded && (
        <CategoryManager
          open={categoriesOpen}
          onClose={() => setCategoriesOpen(false)}
          companyId={companyId}
          categories={cats}
          productCategoryIds={productCategoryIds}
          onChanged={reload}
        />
      )}
      {fieldsLoaded && (
        <CustomFieldsModal
          open={fieldsOpen}
          onClose={() => setFieldsOpen(false)}
          companyId={companyId}
          initialEntity="product"
          onChanged={(e) => e === "product" && cols.reloadFields()}
        />
      )}
    </div>
  );
}
