"use client";

import { useId } from "react";
import { Columns3, FolderTree, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Select, type SelectOption } from "@/components/ui/Select";
import { cn } from "@/lib/utils";
import { FILTERS, type CatalogFilter } from "./catalogFilters";
import { ViewToggle } from "@/components/ui/ViewToggle";

interface CatalogToolbarProps {
  query: string;
  onQuery: (q: string) => void;
  filter: CatalogFilter;
  onFilter: (f: CatalogFilter) => void;
  counts: Record<CatalogFilter, number>;
  categoryId: string;
  categoryOptions: SelectOption[];
  onCategory: (id: string) => void;
  onCategories: () => void;
  columnsOpen: boolean;
  onColumns: () => void;
  /** Columns only apply to the table; cards hide the button. */
  showColumns: boolean;
}

/**
 * Search, filters and table options above the inventory. They arrange by the width they get: the
 * search and the view switch always share a line, and with room the options join them.
 */
export function CatalogToolbar({
  query,
  onQuery,
  filter,
  onFilter,
  counts,
  categoryId,
  categoryOptions,
  onCategory,
  onCategories,
  columnsOpen,
  onColumns,
  showColumns,
}: CatalogToolbarProps) {
  const searchId = useId();
  const active = FILTERS.find((f) => f.id === filter);
  // «Con alertas» and «Pausados» only show up when something is in them (or one is picked).
  const chips = FILTERS.filter((f) => !(f.id === "pausados" || f.id === "alertas") || counts[f.id] > 0 || filter === f.id);

  return (
    <div className="@container space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor={searchId} className="relative min-w-0 flex-1 basis-[calc(100%-5.5rem)] @4xl:max-w-sm @4xl:basis-0">
          <span className="sr-only">Buscar en tu inventario</span>
          <Search aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            id={searchId}
            type="search"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Busca por nombre, código o categoría"
            className="h-11 w-full rounded-xl border border-border bg-surface pl-10 pr-3.5 text-sm text-text-primary placeholder:text-text-muted hover:border-text-muted/50 focus:border-accent-text focus:outline-none focus:ring-4 focus:ring-primary/20"
          />
        </label>
        <div className="order-1 min-w-40 flex-1 @4xl:order-none @4xl:w-56 @4xl:flex-none">
          <Select aria-label="Filtrar por categoría" value={categoryId} options={categoryOptions} onChange={onCategory} searchable placeholder="Todas las categorías" />
        </div>
        <div className="order-1 flex items-center gap-2 @4xl:order-none @4xl:ml-auto">
          <Button variant="ghost" onClick={onCategories}>
            <FolderTree aria-hidden className="h-4 w-4" /> Categorías
          </Button>
          {showColumns && (
            <Button variant="secondary" onClick={onColumns} aria-expanded={columnsOpen} className={cn(columnsOpen && "border-strong")}>
              <Columns3 aria-hidden className="h-4 w-4" /> Columnas
            </Button>
          )}
        </div>
        <ViewToggle screen="inventario" />
      </div>
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtros">
        {chips.map((f) => (
          <Chip key={f.id} active={filter === f.id} onClick={() => onFilter(f.id)} count={counts[f.id]}>
            {f.label}
          </Chip>
        ))}
      </div>
      {active && filter !== "todos" && <p className="text-[13px] text-text-muted">{active.help}</p>}
    </div>
  );
}
