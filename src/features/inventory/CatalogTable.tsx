"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { ListStatus } from "@/components/ui/ListStatus";
import { ScrollShadow } from "@/components/ui/ScrollShadow";
import { cn } from "@/lib/utils";
import type { InventoryOverviewItem } from "@/types/inventory";
import { columnShow, foldedCells, type CatalogColumn } from "./catalogColumns";

export interface CatalogSort {
  key: string;
  dir: "asc" | "desc";
}

interface CatalogTableProps {
  rows: InventoryOverviewItem[];
  columns: CatalogColumn[];
  sort: CatalogSort;
  onSort: (key: string) => void;
  onOpen: (id: string) => void;
  footer: React.ReactNode;
  emptyMessage: string;
}

// The two fixed columns stay pinned while the rest scrolls sideways (from tablet width up).
// On a phone the product takes whatever stock and price leave, and its name truncates.
const PIN = {
  product:
    "w-full max-w-0 sm:sticky sm:left-0 sm:z-10 sm:w-[220px] sm:min-w-[220px] sm:max-w-[220px] xl:w-[260px] xl:min-w-[260px] xl:max-w-[260px]",
  stock: "sm:sticky sm:left-[220px] sm:z-10 sm:w-[108px] sm:min-w-[108px] sm:border-r sm:border-border xl:left-[260px]",
} as const;

const pinClass = (key: string) => (key === "product" || key === "stock" ? PIN[key] : "");

/** The catalog table: sortable headers, pinned name and stock, the whole row opens the product. */
export function CatalogTable({ rows, columns, sort, onSort, onOpen, footer, emptyMessage }: CatalogTableProps) {
  const shown = new Set(columns.map((c) => c.key));
  return (
    <div className="w-full min-w-0 flex-1 overflow-clip rounded-2xl border border-border bg-surface">
      <ScrollShadow hint="Desliza para ver más columnas">
        <table className="w-full border-collapse text-left text-sm sm:w-max sm:min-w-full">
          <thead>
            <tr className="bg-surface-soft">
              {columns.map((c) => {
                const on = sort.key === c.key;
                return (
                  <th
                    key={c.key}
                    scope="col"
                    aria-sort={on ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
                    className={cn("h-10 whitespace-nowrap bg-surface-soft px-3 first:pl-5 last:pr-5", columnShow(c.key), pinClass(c.key))}
                  >
                    <button
                      type="button"
                      onClick={() => onSort(c.key)}
                      className={cn(
                        "inline-flex w-full items-center gap-1 text-[12px] font-semibold transition-colors hover:text-text-primary",
                        c.align === "right" ? "justify-end" : "justify-start",
                        on ? "text-text-primary" : "text-text-muted",
                      )}
                    >
                      {c.label}
                      {on && (sort.dir === "asc" ? <ArrowUp aria-hidden className="h-3 w-3" /> : <ArrowDown aria-hidden className="h-3 w-3" />)}
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const fold = foldedCells(r, shown);
              return (
                <tr key={r.id} onClick={() => onOpen(r.id)} className={cn("group h-[52px] cursor-pointer border-t border-border transition-colors hover:bg-surface-soft", !r.is_active && "text-text-muted")}>
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={cn(
                        "whitespace-nowrap px-3 first:pl-5 last:pr-5",
                        columnShow(c.key),
                        c.align === "right" && "text-right",
                        pinClass(c.key) && cn(pinClass(c.key), "bg-surface transition-colors group-hover:bg-surface-soft"),
                      )}
                    >
                      {c.cell(r, c.key === "product" ? fold.product : c.key === "stock" ? fold.stock : undefined)}
                    </td>
                  ))}
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr className="border-t border-border">
                <td colSpan={columns.length} className="px-6 py-12 text-center text-sm text-text-muted">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </ScrollShadow>
      <ListStatus variant="table">{footer}</ListStatus>
    </div>
  );
}
